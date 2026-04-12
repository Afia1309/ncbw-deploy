"""
Notification utility functions.

These are called from training/views.py and accounts/views.py to create
in-platform notifications when courses are assigned or due dates approach.
"""

from django.utils import timezone


# ---------------------------------------------------------------------------
# Course assignment notifications
# ---------------------------------------------------------------------------

def notify_trainee_course_assigned(user, course):
    """
    Create a one-time 'assigned' notification for a trainee when they gain
    access to a course (via position or direct member assignment).
    Idempotent — safe to call multiple times; will not create duplicates.
    """
    from .models import Notification

    if Notification.objects.filter(
        user=user,
        course=course,
        notification_type="assigned",
    ).exists():
        return

    due_str = (
        f" Due: {course.due_date.strftime('%B %d, %Y')}."
        if course.due_date
        else ""
    )

    Notification.objects.create(
        user=user,
        course=course,
        title=f"New Course Assigned: {course.name}",
        message=f"You have been assigned to '{course.name}'.{due_str}",
        notification_type="assigned",
    )


def notify_instructor_course_assigned(instructor, course):
    """
    Create a one-time in-platform notification for the instructor when
    an admin assigns them to a course.
    """
    from .models import Notification

    if Notification.objects.filter(
        user=instructor,
        course=course,
        notification_type="assigned",
    ).exists():
        return

    Notification.objects.create(
        user=instructor,
        course=course,
        title=f"Course Assigned: {course.name}",
        message=f"You have been assigned to instruct '{course.name}'.",
        notification_type="assigned",
    )


# ---------------------------------------------------------------------------
# Due-date notifications (called when trainee loads notifications/courses)
# ---------------------------------------------------------------------------

def check_due_date_notifications(user):
    """
    Inspect every Published course assigned to this user.
    - If due_date == today → create/ensure a 'due_today' notification.
    - If due_date is within the next 7 days → create/ensure a 'due_soon' notification.

    One notification per type per course per calendar day — no spam.
    Skips courses the user has already completed.
    """
    from .models import Notification
    from accounts.models import Course

    today = timezone.now().date()
    window_end = today + timezone.timedelta(days=7)

    courses = (
        Course.objects.filter(
            status="Published",
            due_date__gte=today,
            due_date__lte=window_end,
        )
        .prefetch_related("position_targets", "member_targets")
    )

    for course in courses:
        if not _course_matches_user(course, user):
            continue

        if _user_completed_course(course, user):
            continue

        if course.due_date == today:
            notif_type = "due_today"
            title = f"Due Today: {course.name}"
            message = f"'{course.name}' is due today. Don't forget to complete it."
        else:
            days_left = (course.due_date - today).days
            notif_type = "due_soon"
            title = f"Due Soon: {course.name}"
            message = (
                f"'{course.name}' is due in {days_left} "
                f"day{'s' if days_left != 1 else ''}."
            )

        # One per type per day — avoid duplicates on repeated page loads
        already_sent_today = Notification.objects.filter(
            user=user,
            course=course,
            notification_type=notif_type,
            created_at__date=today,
        ).exists()

        if not already_sent_today:
            Notification.objects.create(
                user=user,
                course=course,
                title=title,
                message=message,
                notification_type=notif_type,
            )


# ---------------------------------------------------------------------------
# Private helpers (duplicated from training.views to avoid circular imports)
# ---------------------------------------------------------------------------

def _course_matches_user(course, user):
    if not hasattr(user, "profile"):
        return False

    position_targets = list(course.position_targets.values_list("position", flat=True))
    member_target_ids = list(course.member_targets.values_list("user_id", flat=True))

    if not position_targets and not member_target_ids:
        return False

    if user.id in member_target_ids:
        return True

    return user.profile.position in position_targets


def _user_completed_course(course, user):
    """Return True if the user has completed every visible item assigned to them."""
    from training.models import ItemProgress

    item_ids = _visible_item_ids_for_user(course, user)
    if not item_ids:
        return False

    completed = ItemProgress.objects.filter(
        user=user,
        item_id__in=item_ids,
        status="completed",
    ).count()

    return completed == len(item_ids)


def _visible_item_ids_for_user(course, user):
    from training.models import Item

    item_ids = []
    modules = course.modules.filter(is_visible=True).prefetch_related(
        "items__position_targets",
        "items__member_targets",
    )
    for module in modules:
        for item in module.items.filter(is_visible=True).order_by("order", "id"):
            if _item_matches_user(item, user):
                item_ids.append(item.id)
    return item_ids


def _item_matches_user(item, user):
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
