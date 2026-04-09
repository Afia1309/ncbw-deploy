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

from .models import (
    CourseMemberAccess,
    CoursePositionAccess,
    Item,
    ItemProgress,
    Module,
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
        progress_rows = ItemProgress.objects.filter(
            user=request.user,
            item_id__in=[item.id for item in visible_items],
        )
        progress_map = {row.item_id: row.status for row in progress_rows}

        modules = course.modules.filter(is_visible=True).order_by("order", "id")
        modules_data = TraineeModuleSerializer(
            modules,
            many=True,
            context={
                "request": request,
                "user": request.user,
                "progress_map": progress_map,
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

       
        trainees = User.objects.filter(
            profile__role="trainee",
            profile__status="active",
        ).select_related("profile")

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
        Notification.objects.bulk_create(notifications)

        return Response({"sent_to": len(enrolled)}, status=status.HTTP_201_CREATED)


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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_certificate(request):
    user = request.user
    
    courses = Course.objects.filter(status="Published").prefetch_related(
        "position_targets",
        "member_targets",
        "modules__items"
    )
    
    eligible_courses = []
    for course in courses:
        if not (course_matches_user(course, user) or is_admin(user)):
            continue
        
        visible_items = visible_items_for_user(course, user)
        if not visible_items:
            continue
        
        item_ids = [item.id for item in visible_items]
        completed_count = ItemProgress.objects.filter(
            user=user,
            item_id__in=item_ids,
            status='completed'
        ).count()
        
        if completed_count == len(visible_items) and len(visible_items) > 0:
            eligible_courses.append(course)
    
    if not eligible_courses:
        return Response(
            {"detail": "Complete all items in a course first to earn a certificate."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    first_course = eligible_courses[0]
    certificate_data = {
        "certificate": {
            "user": user.get_full_name() or user.username,
            "member_id": get_member_id(user),
            "track": "Leadership Training Program",
            "issued_date": timezone.now().strftime("%B %d, %Y"),
            "certificate_code": f"NCBW-{user.id}-{first_course.id}-{timezone.now().year}"
        }
    }
    
    return Response(certificate_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_certificate_pdf(request):
    user = request.user
    
    courses = Course.objects.filter(status="Published").prefetch_related(
        "position_targets",
        "member_targets",
        "modules__items"
    )
    
    eligible_course = None
    for course in courses:
        if not (course_matches_user(course, user) or is_admin(user)):
            continue
        
        visible_items = visible_items_for_user(course, user)
        if not visible_items:
            continue
        
        item_ids = [item.id for item in visible_items]
        completed_count = ItemProgress.objects.filter(
            user=user,
            item_id__in=item_ids,
            status='completed'
        ).count()
        
        if completed_count == len(visible_items) and len(visible_items) > 0:
            eligible_course = course
            break
    
    if not eligible_course:
        return Response(
            {"detail": "Complete all items in a course first to download certificate."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user_name = user.get_full_name() or user.username
    member_id = get_member_id(user)
    course_name = eligible_course.name
    completion_date = timezone.now().strftime("%B %d, %Y")
    certificate_code = f"NCBW-{user.id}-{eligible_course.id}-{timezone.now().year}"
    
    pdf_buffer = generate_certificate_pdf(
        user_name=user_name,
        member_id=member_id,
        course_name=course_name,
        completion_date=completion_date,
        certificate_code=certificate_code
    )
    
    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="certificate_{user.id}_{eligible_course.id}.pdf"'
    return response