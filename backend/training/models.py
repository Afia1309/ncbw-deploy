# Skeleton framework (!)
# Will need to be tweaked when Modules are built
from django.conf import settings
from django.db import models
from django.utils import timezone


# Placeholder model for future training modules
# (Represents a single training course/module)
class TrainingModule(models.Model):

    title = models.CharField(max_length=255) # Name
    is_active = models.BooleanField(default=True) # Is module currently active/assigned
    created_at = models.DateTimeField(auto_now_add=True) # Timestamp

    def __str__(self):
        return self.title


# Tracks a user's progress in a training module.
class UserTrainingProgress(models.Model):

    # Which user/trainee
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
	#
    )
    # Which module
    module = models.ForeignKey(
        TrainingModule,
        on_delete=models.CASCADE
	#
    )
    # Additional variables
    progress_percent = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "module") # Prevent duplicate rows (same user + same module)

    # Mark when a user interacts with the module (video, question, etc.)
    def mark_activity(self):
        self.last_activity = timezone.now()
        self.save(update_fields=["last_activity"])

    # Reset progress due to inactivity
    def reset_progress(self):

        self.progress_percent = 0
        self.completed = False
        self.last_activity = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.user} - {self.module}"
