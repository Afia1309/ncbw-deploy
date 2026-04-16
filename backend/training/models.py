from django.contrib.auth.models import User
from django.db import models

from accounts.models import Course, Profile


class Module(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="modules",
    )
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.course.name} - {self.title}"


class Item(models.Model):
    ITEM_TYPE_CHOICES = [
        ("pdf", "PDF"),
        ("video", "Video"),
        ("external_video", "External Video"),
        ("quiz", "Quiz"),
        ("text", "Text Content"),
        ("link", "Link"),
    ]

    AUDIENCE_TYPE_CHOICES = [
        ("all", "All"),
        ("role", "Role"),
        ("member", "Member"),
    ]

    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="items",
    )
    title = models.CharField(max_length=255)
    item_type = models.CharField(max_length=30, choices=ITEM_TYPE_CHOICES)
    file = models.FileField(upload_to="course_items/", null=True, blank=True)
    external_url = models.URLField(blank=True, default="")
    text_content = models.TextField(blank=True, default="")
    quiz_data = models.JSONField(blank=True, default=dict)
    due_date = models.DateField(null=True, blank=True)
    order = models.PositiveIntegerField(default=1)
    is_visible = models.BooleanField(default=True)
    audience_type = models.CharField(
        max_length=20,
        choices=AUDIENCE_TYPE_CHOICES,
        default="all",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class CoursePositionAccess(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="position_targets",
    )
    position = models.CharField(
        max_length=50,
        choices=Profile.POSITION_CHOICES,
    )

    class Meta:
        unique_together = ("course", "position")
        ordering = ["position"]

    def __str__(self):
        return f"{self.course.name} -> {self.position}"


class CourseMemberAccess(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="member_targets",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="course_member_access",
    )

    class Meta:
        unique_together = ("course", "user")
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.course.name} -> {self.user.username}"


class ItemPositionAccess(models.Model):
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="position_targets",
    )
    position = models.CharField(
        max_length=50,
        choices=Profile.POSITION_CHOICES,
    )

    class Meta:
        unique_together = ("item", "position")
        ordering = ["position"]

    def __str__(self):
        return f"{self.item.title} -> {self.position}"


class ItemMemberAccess(models.Model):
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="member_targets",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="item_member_access",
    )

    class Meta:
        unique_together = ("item", "user")
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.item.title} -> {self.user.username}"


class QuizAttempt(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    score_percent = models.FloatField(default=0)
    passed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.item.title} - {self.score_percent}%"


class ItemProgress(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="item_progress",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="progress_rows",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="not_started",
    )
    last_activity = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "item")

    def __str__(self):
        return f"{self.user.username} - {self.item.title} - {self.status}"