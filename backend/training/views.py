from django.contrib.auth.models import User
from django.utils import timezone
from .certificate_utils import generate_certificate_pdf
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Course
from accounts.serializers import CourseSerializer
from notifications.models import Notification
from notifications.utils import notify_trainee_course_assigned

from django.db.models import Count

from .models import (
    CourseMemberAccess,
    CoursePositionAccess,
    Item,
    ItemProgress,
    Module,
    QuizAttempt,
)

from .serializers import (
    CourseAudienceUpdateSerializer,
    InstructorCourseDetailSerializer,
    ItemProgressSerializer,
    ItemSerializer,
    ItemWriteSerializer,
    ModuleWriteSerializer,
    TraineeModuleSerializer,
)


def get_member_id(user):
    if hasattr(user, "profile") and user.profile.member_id:
        return user.profile.member_id
    return user.username


def is_admin(user):
    return bool(
        user.is_authenticated
        and hasattr(user, "profile")
        and user.profile.role == "admin"
    )


def can_manage_course(user, course):
    return is_admin(user) or course.instructor_id == user.id


def course_matches_user(course, user):
    if not hasattr(user, "profile"):
        return False

    position_targets = list(course.position_targets.values_list("position", flat=True))
    member_target_ids = list(course.member_targets.values_list("user_id", flat=True))

    if not position_targets and not member_target_ids:
        return False

    if user.id in member_target_ids:
        return True

    return user.profile.position in position_targets


def item_matches_user(item, user):
    if item.audience_type == "all":
        return True

    if not hasattr(user, "profile"):
        return False

    if item.audience_type == "role":
        positions = list(item.position_targets.values_list("position", flat=True))
        return user.profile.position in positions

    if item.audience_type == "member":
        member_user_ids = list(item.member_targets.values_list("user_id", flat=True))
        return user.id in member_user_ids

    return False


def visible_items_for_user(course, user):
    items = []
    modules = course.modules.filter(is_visible=True).prefetch_related(
        "items__position_targets",
        "items__member_targets",
    )
    for module in modules:
        for item in module.items.filter(is_visible=True).order_by("order", "id"):
            if item_matches_user(item, user):
                items.append(item)
    return items


def build_progress_summary_for_items(items, user):
    total = len(items)
    if total == 0:
        return {
            "completed": 0,
            "total": 0,
            "percent": 0,
            "status": "not_started",
        }

    item_ids = [item.id for item in items]
    progress_rows = ItemProgress.objects.filter(
        user=user,
        item_id__in=item_ids,
    )

    progress_map = {row.item_id: row.status for row in progress_rows}
    completed = sum(1 for item_id in item_ids if progress_map.get(item_id) == "completed")
    has_in_progress = any(progress_map.get(item_id) == "in_progress" for item_id in item_ids)

    percent = round((completed / total) * 100) if total else 0

    if completed == total:
        status_value = "completed"
    elif completed > 0 or has_in_progress:
        status_value = "in_progress"
    else:
        status_value = "not_started"

    return {
        "completed": completed,
        "total": total,
        "percent": percent,
        "status": status_value,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    profile = getattr(u, "profile", None)

    return Response(
        {
            "name": u.get_full_name().strip() or u.username,
            "member_id": get_member_id(u),
            "email": u.email,
            "phone": profile.phone if profile else "",
            "position": profile.position if profile else "General Member",
            "role": profile.role if profile else "trainee",
        }
    )


class InstructorCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "profile") or request.user.profile.role not in ["instructor", "admin"]:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if is_admin(request.user):
            courses = Course.objects.select_related("instructor").all()
        else:
            courses = Course.objects.select_related("instructor").filter(instructor=request.user)

        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)


class InstructorCourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_course(self, course_id):
        return Course.objects.select_related("instructor").prefetch_related(
            "modules__items__position_targets",
            "modules__items__member_targets",
            "position_targets",
            "member_targets__user__profile",
        ).get(id=course_id)

    def get(self, request, course_id):
        try:
            course = self.get_course(course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        trainees = User.objects.filter(
            profile__role="trainee",
            profile__status="active",
        )
        enrollment_count = sum(1 for trainee in trainees if course_matches_user(course, trainee))

        serializer = InstructorCourseDetailSerializer(
            course,
            context={"enrollment_count": enrollment_count, "request": request},
        )
        return Response(serializer.data)

    def patch(self, request, course_id):
        try:
            course = self.get_course(course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        allowed_fields = ["name", "code", "description", "image", "open_date", "due_date", "status"]
        for field in allowed_fields:
            if field in request.data:
                setattr(course, field, request.data.get(field))
        course.save()

        selected_roles = request.data.get("selected_roles", request.data.get("selectedRoles"))
        assigned_member_ids = request.data.get("assigned_member_ids", request.data.get("assignedMemberIds"))

        if selected_roles is not None:
            selected_roles = list(dict.fromkeys(selected_roles))
            CoursePositionAccess.objects.filter(course=course).exclude(position__in=selected_roles).delete()
            existing_positions = set(
                CoursePositionAccess.objects.filter(course=course).values_list("position", flat=True)
            )
            for position in selected_roles:
                if position not in existing_positions:
                    CoursePositionAccess.objects.create(course=course, position=position)

        if assigned_member_ids is not None:
            users = User.objects.filter(profile__member_id__in=assigned_member_ids)
            CourseMemberAccess.objects.filter(course=course).exclude(user__in=users).delete()
            existing_user_ids = set(
                CourseMemberAccess.objects.filter(course=course).values_list("user_id", flat=True)
            )
            for user in users:
                if user.id not in existing_user_ids:
                    CourseMemberAccess.objects.create(course=course, user=user)

        # Notify all currently assigned trainees (idempotent — skips anyone already notified)
        if course.status == "Published" and (selected_roles is not None or assigned_member_ids is not None):
            trainees = User.objects.filter(
                profile__role="trainee",
                profile__status="active",
            ).select_related("profile")
            for trainee in trainees:
                if course_matches_user(course, trainee):
                    try:
                        notify_trainee_course_assigned(trainee, course)
                    except Exception:
                        pass

        serializer = InstructorCourseDetailSerializer(
            course,
            context={"enrollment_count": 0, "request": request},
        )
        return Response({
            "message": "Course updated successfully.",
            "course": serializer.data,
        })


class InstructorEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        search = request.query_params.get("search", "").strip().lower()
        sort = request.query_params.get("sort", "default")

        trainees = User.objects.filter(
            profile__role="trainee",
            profile__status="active",
        ).select_related("profile")

        rows = []
        for trainee in trainees:
            if not course_matches_user(course, trainee):
                continue

            progress_summary = build_progress_summary_for_items(
                visible_items_for_user(course, trainee),
                trainee,
            )

            row = {
                "id": trainee.id,
                "name": trainee.get_full_name() or trainee.username,
                "memberId": get_member_id(trainee),
                "role": trainee.profile.position,
                "progress": progress_summary["percent"],
                "status": progress_summary["status"].replace("_", " ").title(),
                "enrollmentDate": trainee.profile.activated_at.date().isoformat() if trainee.profile.activated_at else "",
            }
            rows.append(row)

        if search:
            rows = [
                row for row in rows
                if search in row["name"].lower()
                or search in row["memberId"].lower()
                or search in row["role"].lower()
                or search in row["status"].lower()
                or search in row["enrollmentDate"].lower()
            ]

        if sort == "date-newest":
            rows.sort(key=lambda x: x["enrollmentDate"], reverse=True)
        elif sort == "date-oldest":
            rows.sort(key=lambda x: x["enrollmentDate"])

        return Response(rows)


class InstructorModuleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data["course"] = course.id

        if not data.get("order"):
            last_module = Module.objects.filter(course=course).order_by("-order").first()
            data["order"] = (last_module.order + 1) if last_module else 1

        serializer = ModuleWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()

        return Response(
            {
                "message": "Module created successfully.",
                "module": {
                    "id": module.id,
                    "title": module.title,
                    "visible": module.is_visible,
                    "isExpanded": True,
                    "created_at": module.created_at,
                    "items": [],
                },
            },
            status=status.HTTP_201_CREATED,
        )


class InstructorModuleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, module_id):
        return Module.objects.select_related("course").get(id=module_id)

    def patch(self, request, module_id):
        try:
            module = self.get_object(module_id)
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, module.course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ModuleWriteSerializer(module, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()

        return Response({
            "message": "Module updated successfully.",
            "module": {
                "id": module.id,
                "title": module.title,
                "visible": module.is_visible,
                "order": module.order,
            },
        })

    def delete(self, request, module_id):
        try:
            module = self.get_object(module_id)
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, module.course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        module.delete()
        return Response({"message": "Module deleted successfully."})


class InstructorItemCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, module_id):
        try:
            module = Module.objects.select_related("course").get(id=module_id)
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, module.course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data["module"] = module.id

        if not data.get("order"):
            last_item = Item.objects.filter(module=module).order_by("-order").first()
            data["order"] = (last_item.order + 1) if last_item else 1

        serializer = ItemWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()

        return Response(
            {
                "message": "Item created successfully.",
                "item": ItemSerializer(item, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class InstructorItemDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, item_id):
        return Item.objects.select_related("module__course").get(id=item_id)

    def patch(self, request, item_id):
        try:
            item = self.get_object(item_id)
        except Item.DoesNotExist:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, item.module.course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ItemWriteSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()

        return Response({
            "message": "Item updated successfully.",
            "item": ItemSerializer(item, context={"request": request}).data,
        })

    def delete(self, request, item_id):
        try:
            item = self.get_object(item_id)
        except Item.DoesNotExist:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, item.module.course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        item.delete()
        return Response({"message": "Item deleted successfully."})


class TraineeCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "profile") or request.user.profile.role not in ["trainee", "admin"]:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if request.user.profile.role == "trainee":
            try:
                from notifications.utils import check_due_date_notifications
                check_due_date_notifications(request.user)
            except Exception:
                pass

        courses = Course.objects.filter(status="Published").select_related("instructor").prefetch_related(
            "position_targets",
            "member_targets",
            "modules__items__position_targets",
            "modules__items__member_targets",
        )

        visible_courses = []
        for course in courses:
            if course_matches_user(course, request.user) or is_admin(request.user):
                visible_courses.append(course)

        serialized = CourseSerializer(visible_courses, many=True).data
        response_rows = []

        for course, row in zip(visible_courses, serialized):
            visible_items = visible_items_for_user(course, request.user)
            progress_summary = build_progress_summary_for_items(visible_items, request.user)

            row["progress"] = progress_summary
            response_rows.append(row)

        return Response(response_rows)


class TraineeCourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.objects.select_related("instructor").prefetch_related(
                "modules__items__position_targets",
                "modules__items__member_targets",
            ).get(id=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if course.status != "Published" and not is_admin(request.user):
            return Response({"detail": "Course is not available."}, status=status.HTTP_403_FORBIDDEN)

        if not (course_matches_user(course, request.user) or is_admin(request.user)):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        visible_items = visible_items_for_user(course, request.user)
        visible_item_ids = [item.id for item in visible_items]

        progress_rows = ItemProgress.objects.filter(
            user=request.user,
            item_id__in=visible_item_ids,
        )
        progress_map = {row.item_id: row.status for row in progress_rows}

        quiz_attempts_map = {
            row["item_id"]: row["count"]
            for row in QuizAttempt.objects.filter(
                user=request.user,
                item_id__in=visible_item_ids,
            ).values("item_id").annotate(count=Count("id"))
        }

        # Most recent attempt per item — used by frontend to derive quiz display state
        last_attempt_map = {}
        for attempt in QuizAttempt.objects.filter(
            user=request.user,
            item_id__in=visible_item_ids,
        ).order_by("item_id", "-created_at"):
            if attempt.item_id not in last_attempt_map:
                last_attempt_map[attempt.item_id] = {
                    "score_percent": attempt.score_percent,
                    "passed": attempt.passed,
                    "submission_status": attempt.submission_status,
                }

        modules = course.modules.filter(is_visible=True).order_by("order", "id")
        modules_data = TraineeModuleSerializer(
            modules,
            many=True,
            context={
                "request": request,
                "user": request.user,
                "progress_map": progress_map,
                "quiz_attempts_map": quiz_attempts_map,
                "last_attempt_map": last_attempt_map,
                "item_matcher": item_matches_user,
            },
        ).data

        progress_summary = build_progress_summary_for_items(visible_items, request.user)
        instructor_name = f"{course.instructor.first_name} {course.instructor.last_name}".strip() or course.instructor.username

        return Response({
            "id": course.id,
            "title": course.name,
            "code": course.code,
            "description": course.description,
            "image": course.image,
            "status": course.status,
            "open_date": course.open_date,
            "due_date": course.due_date,
            "instructor_name": instructor_name,
            "progress": progress_summary,
            "modules": modules_data,
        })


class InstructorNotifyView(APIView):
    """
    POST /api/training/instructor/courses/<course_id>/notify/
    Sends a notification to all enrolled members of the course.
    Body: { title, message, notification_type (optional, default "info") }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        if not hasattr(request.user, "profile") or request.user.profile.role not in ["instructor", "admin"]:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_manage_course(request.user, course):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        title = (request.data.get("title") or "").strip()
        message = (request.data.get("message") or "").strip()
        notification_type = request.data.get("notification_type", "info")

        if not title or not message:
            return Response({"detail": "title and message are required."}, status=status.HTTP_400_BAD_REQUEST)

        valid_types = [t[0] for t in Notification.NOTIFICATION_TYPES]
        if notification_type not in valid_types:
            notification_type = "info"

       
        try:
            trainees = User.objects.filter(
                profile__role="trainee",
                profile__status="active",
            ).select_related("profile").prefetch_related("profile")

            enrolled = [u for u in trainees if course_matches_user(course, u)]

            notifications = [
                Notification(
                    user=u,
                    course=course,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                )
                for u in enrolled
            ]
            if notifications:
                Notification.objects.bulk_create(notifications)
        except Exception as e:
            return Response({"detail": f"Failed to send notifications: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"sent_to": len(enrolled)}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_course_feedback(request, course_id):
    try:
        course = Course.objects.select_related("instructor").get(id=course_id)
    except Course.DoesNotExist:
        return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

    if not course.instructor:
        return Response({"detail": "This course has no instructor."}, status=status.HTTP_400_BAD_REQUEST)

    rating = request.data.get("rating")
    message = str(request.data.get("message", "")).strip()

    if not rating or not message:
        return Response({"detail": "Rating and message are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rating = int(rating)
        if not (1 <= rating <= 5):
            raise ValueError
    except (ValueError, TypeError):
        return Response({"detail": "Rating must be a number between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

    member_name = request.user.get_full_name() or get_member_id(request.user)

    Notification.objects.create(
        user=course.instructor,
        course=course,
        notification_type="feedback",
        title=f"Feedback on \"{course.name}\"",
        message=f"From {member_name} — Rating: {rating}/5\n\n{message}",
    )

    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_item_progress(request, item_id):
    try:
        item = Item.objects.select_related("module__course").get(id=item_id)
    except Item.DoesNotExist:
        return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    course = item.module.course

    if not (course_matches_user(course, request.user) or is_admin(request.user)):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    if not item_matches_user(item, request.user):
        return Response({"detail": "Not allowed for this item."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ItemProgressSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    status_value = serializer.validated_data["status"]

    progress, _ = ItemProgress.objects.get_or_create(user=request.user, item=item)
    progress.status = status_value
    progress.last_activity = timezone.now()
    progress.completed_at = timezone.now() if status_value == "completed" else None
    progress.save()

    return Response({
        "ok": True,
        "item_id": item.id,
        "status": progress.status,
        "completed_at": progress.completed_at,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_quiz(request, item_id):
    try:
        item = Item.objects.select_related("module__course").get(id=item_id)
    except Item.DoesNotExist:
        return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    if item.item_type != "quiz":
        return Response({"detail": "This item is not a quiz."}, status=status.HTTP_400_BAD_REQUEST)

    course = item.module.course
    if not (course_matches_user(course, request.user) or is_admin(request.user)):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    if not item_matches_user(item, request.user):
        return Response({"detail": "Not allowed for this item."}, status=status.HTTP_403_FORBIDDEN)

    quiz_data = item.quiz_data or {}
    max_attempts = int(quiz_data.get("maxAttempts", 0))  # 0 = unlimited
    attempts_used = QuizAttempt.objects.filter(user=request.user, item=item).count()

    if max_attempts > 0 and attempts_used >= max_attempts:
        return Response(
            {
                "detail": "You have reached the maximum number of attempts for this quiz.",
                "attempts_used": attempts_used,
                "max_attempts": max_attempts,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    answers = request.data.get("answers", {})
    questions = quiz_data.get("questions", [])
    passing_grade = quiz_data.get("passingGrade", 70)
    total = len(questions)

    mc_correct = 0
    sa_question_ids = []
    responses = {}

    for q in questions:
        q_id = str(q["id"])
        q_type = q.get("question_type", "multiple_choice")
        answer_val = answers.get(q_id)
        responses[q_id] = str(answer_val) if answer_val is not None else ""

        if q_type == "multiple_choice":
            if str(answer_val) == str(q.get("correctOptionId")):
                mc_correct += 1
        else:
            sa_question_ids.append(q_id)

    has_sa = len(sa_question_ids) > 0

    if has_sa:
        # Provisional score: MC-correct share of total questions; not final until graded
        percent = round((mc_correct / total) * 100) if total else 0
        passed = False
        submission_status = "pending_review"
    else:
        # MC-only: keep existing count-based behaviour for backward compat
        percent = round((mc_correct / total) * 100) if total else 0
        passed = percent >= passing_grade
        submission_status = "graded"

    QuizAttempt.objects.create(
        user=request.user,
        item=item,
        score_percent=percent,
        passed=passed,
        submission_status=submission_status,
        responses=responses,
    )
    attempts_used += 1

    progress, _ = ItemProgress.objects.get_or_create(user=request.user, item=item)
    if has_sa:
        # Mark as pending_review until instructor grades
        if progress.status != "completed":
            progress.status = "pending_review"
            progress.last_activity = timezone.now()
            progress.save()
    else:
        if passed or progress.status != "completed":
            progress.status = "completed" if passed else "in_progress"
            progress.last_activity = timezone.now()
            if passed:
                progress.completed_at = timezone.now()
            progress.save()

    return Response({
        "correct": mc_correct,
        "total": total,
        "percent": percent if not has_sa else None,
        "passed": passed,
        "attempts_used": attempts_used,
        "max_attempts": max_attempts,
        "submission_status": submission_status,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def instructor_quiz_submissions(request, item_id):
    """
    GET /api/training/instructor/items/<item_id>/quiz-submissions/
    Returns all quiz attempts for a quiz item (instructor/admin only).
    """
    try:
        item = Item.objects.select_related("module__course").get(id=item_id)
    except Item.DoesNotExist:
        return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    if not can_manage_course(request.user, item.module.course):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    if item.item_type != "quiz":
        return Response({"detail": "This item is not a quiz."}, status=status.HTTP_400_BAD_REQUEST)

    # One latest attempt per user
    attempts = (
        QuizAttempt.objects.filter(item=item)
        .select_related("user__profile")
        .order_by("user_id", "-created_at")
    )
    seen = set()
    latest_attempts = []
    for attempt in attempts:
        if attempt.user_id not in seen:
            seen.add(attempt.user_id)
            latest_attempts.append(attempt)

    quiz_data = item.quiz_data or {}
    questions = quiz_data.get("questions", [])

    submissions = []
    for attempt in latest_attempts:
        profile = getattr(attempt.user, "profile", None)
        submissions.append({
            "attempt_id": attempt.id,
            "trainee_name": attempt.user.get_full_name() or attempt.user.username,
            "trainee_member_id": profile.member_id if profile else attempt.user.username,
            "submitted_at": attempt.created_at,
            "submission_status": attempt.submission_status,
            "score_percent": attempt.score_percent,
            "passed": attempt.passed,
            "responses": attempt.responses,
            "short_answer_scores": attempt.short_answer_scores,
        })

    return Response({
        "questions": questions,
        "submissions": submissions,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grade_quiz_attempt(request, attempt_id):
    """
    POST /api/training/instructor/quiz-attempts/<attempt_id>/grade/
    Body: { short_answer_scores: { <questionId>: <points_awarded> } }
    """
    try:
        attempt = QuizAttempt.objects.select_related(
            "item__module__course", "user"
        ).get(id=attempt_id)
    except QuizAttempt.DoesNotExist:
        return Response({"detail": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

    if not can_manage_course(request.user, attempt.item.module.course):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    if attempt.submission_status != "pending_review":
        return Response(
            {"detail": "This attempt has already been graded."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    sa_scores_input = request.data.get("short_answer_scores", {})
    quiz_data = attempt.item.quiz_data or {}
    questions = quiz_data.get("questions", [])
    passing_grade = quiz_data.get("passingGrade", 70)

    # Build per-question maps from stored quiz_data
    total_possible_points = 0.0
    mc_points_earned = 0.0
    sa_max_points = {}

    for q in questions:
        q_id = str(q["id"])
        q_type = q.get("question_type", "multiple_choice")
        q_points = float(q.get("points", 1))
        total_possible_points += q_points

        if q_type == "multiple_choice":
            stored_answer = attempt.responses.get(q_id, "")
            if str(stored_answer) == str(q.get("correctOptionId")):
                mc_points_earned += q_points
        else:
            sa_max_points[q_id] = q_points

    # Validate and clamp SA scores
    validated_scores = {}
    for q_id, awarded in sa_scores_input.items():
        max_pts = sa_max_points.get(str(q_id), 0)
        try:
            awarded = float(awarded)
        except (TypeError, ValueError):
            awarded = 0.0
        validated_scores[str(q_id)] = min(max(awarded, 0.0), max_pts)

    sa_points_earned = sum(validated_scores.values())
    total_earned = mc_points_earned + sa_points_earned

    if total_possible_points > 0:
        percent = round((total_earned / total_possible_points) * 100)
    else:
        percent = 0

    passed = percent >= passing_grade

    attempt.score_percent = percent
    attempt.passed = passed
    attempt.submission_status = "graded"
    attempt.short_answer_scores = validated_scores
    attempt.save()

    # Update ItemProgress
    progress, _ = ItemProgress.objects.get_or_create(user=attempt.user, item=attempt.item)
    progress.status = "completed" if passed else "in_progress"
    progress.last_activity = timezone.now()
    if passed:
        progress.completed_at = timezone.now()
    progress.save()

    return Response({
        "ok": True,
        "score_percent": percent,
        "passed": passed,
        "submission_status": "graded",
    })


def _get_track_name(user):
    """Derive the training track name from the user's position."""
    if hasattr(user, "profile") and user.profile.position:
        return f"{user.profile.position} Training"
    return "Leadership Training"


def _check_track_completion(user):
    """
    Returns (accessible_courses, all_complete).
    accessible_courses = list of (course, visible_items) for all courses
    assigned to the user that have at least one visible item.
    all_complete = True only when every accessible course is fully completed.
    """
    courses = Course.objects.filter(status="Published").prefetch_related(
        "position_targets",
        "member_targets",
        "modules__items",
    )

    accessible = []
    for course in courses:
        if not (course_matches_user(course, user) or is_admin(user)):
            continue
        visible_items = visible_items_for_user(course, user)
        if not visible_items:
            continue
        accessible.append((course, visible_items))

    if not accessible:
        return accessible, False

    all_complete = True
    for course, visible_items in accessible:
        item_ids = [item.id for item in visible_items]
        completed_count = ItemProgress.objects.filter(
            user=user,
            item_id__in=item_ids,
            status="completed",
        ).count()
        if completed_count < len(visible_items):
            all_complete = False
            break

    return accessible, all_complete


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_certificate(request):
    user = request.user

    accessible, all_complete = _check_track_completion(user)

    if not accessible:
        return Response(
            {"detail": "No courses are assigned to your training track."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not all_complete:
        return Response(
            {"detail": "Complete all courses in your training track to earn a certificate."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    track_name = _get_track_name(user)
    certificate_data = {
        "certificate": {
            "user": user.get_full_name() or user.username,
            "member_id": get_member_id(user),
            "track": track_name,
            "issued_date": timezone.now().strftime("%B %d, %Y"),
            "certificate_code": f"NCBW-{user.id}-{timezone.now().year}",
        }
    }

    return Response(certificate_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_certificate_pdf(request):
    user = request.user

    accessible, all_complete = _check_track_completion(user)

    if not accessible:
        return Response(
            {"detail": "No courses are assigned to your training track."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not all_complete:
        return Response(
            {"detail": "Complete all courses in your training track to download your certificate."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    track_name = _get_track_name(user)
    user_name = user.get_full_name() or user.username
    member_id = get_member_id(user)
    completion_date = timezone.now().strftime("%B %d, %Y")
    certificate_code = f"NCBW-{user.id}-{timezone.now().year}"

    pdf_buffer = generate_certificate_pdf(
        user_name=user_name,
        member_id=member_id,
        track_name=track_name,
        completion_date=completion_date,
        certificate_code=certificate_code,
    )

    response = HttpResponse(pdf_buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="certificate_{user.id}.pdf"'
    return response