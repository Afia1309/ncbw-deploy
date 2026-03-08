from django.db import models
from django.conf import settings
from django.utils import timezone


# Dashboard notifications
# Includes: user, message, is_read, & created_at fields
class Notification(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    # Categorization
    notification_type = models.CharField(
        max_length=50,
        default="info"
    )

    is_read = models.BooleanField(default=False) # Has the user seen this notification?
    created_at = models.DateTimeField(default=timezone.now)

    def mark_read(self):
        self.is_read = True
        self.save(update_fields=["is_read"])

    def __str__(self):
        return f"{self.user} - {self.title}"
