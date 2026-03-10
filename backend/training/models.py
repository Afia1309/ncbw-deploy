from django.db import models
from django.conf import settings


class Track(models.Model):
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name


class Module(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=200)
    required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=1)
    due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.track.name} - {self.title}"


class Enrollment(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    cohort = models.CharField(max_length=120, blank=True, default="")
    phase = models.CharField(max_length=120, blank=True, default="Phase 1")

    def __str__(self):
        return f"{self.user} -> {self.track.name}"


class ModuleProgress(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    last_activity = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "module")

    def reset_progress(self):
        self.status = "not_started"
        self.last_activity = None
        self.completed_at = None
        self.save()

    def __str__(self):
        return f"{self.user} {self.module.title} {self.status}"
