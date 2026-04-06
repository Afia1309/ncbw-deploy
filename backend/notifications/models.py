from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("info", "Info"),
        ("assigned", "Course Assigned"),
        ("due_soon", "Due Soon"),
        ("due_today", "Due Today"),
        ("warning", "Warning"),
        ("success", "Success"),
        # Instructor-to-member types
        ("announcement", "Announcement"),
        ("reminder", "Reminder"),
        ("general", "General Message"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    # Optional: link back to the relevant course
    course = models.ForeignKey(
        "accounts.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    title = models.CharField(max_length=255)
    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default="info",
    )

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def mark_read(self):
        self.is_read = True
        self.save(update_fields=["is_read"])

    def __str__(self):
        return f"{self.user} - {self.title}"
