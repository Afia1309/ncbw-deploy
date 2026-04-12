from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class LoginSecurity(models.Model):
    """
    Tracks failed login attempts and lockout period for each user.
    Lock user after 5 failed attempts for 10 minutes.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="login_security",
    )
    failed_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    def register_failure(self):
        now = timezone.now()

        if self.locked_until and self.locked_until > now:
            return

        self.failed_attempts += 1

        if self.failed_attempts >= 5:
            self.locked_until = now + timedelta(minutes=10)
            self.failed_attempts = 0

        self.save()

    def reset(self):
        self.failed_attempts = 0
        self.locked_until = None
        self.save()

    def is_locked(self):
        return bool(self.locked_until and self.locked_until > timezone.now())

    def __str__(self):
        return f"LoginSecurity({self.user.username})"


class Profile(models.Model):
    ROLE_CHOICES = [
        ("trainee", "Trainee"),
        ("instructor", "Instructor"),
        ("admin", "Administrator"),
    ]

    POSITION_CHOICES = [
        ("President", "President"),
        ("Vice President", "Vice President"),
        ("Treasurer", "Treasurer"),
        ("Secretary", "Secretary"),
        ("Chaplain", "Chaplain"),
        ("Parliamentarian", "Parliamentarian"),
        ("General Member", "General Member"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("in_progress", "In Progress"),
        ("inactive", "Inactive"),
        ("deleted", "Deleted"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    member_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text="Unique login/member identifier, e.g. N12345678",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="trainee",
    )

    position = models.CharField(
        max_length=50,
        choices=POSITION_CHOICES,
        blank=True,
        default="General Member",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    department = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invited_users",
    )

    invited_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    inactivity_reminder_sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.user and self.user.username and not self.member_id:
            self.member_id = self.user.username
        super().save(*args, **kwargs)

    def soft_delete(self):
        self.status = "deleted"
        self.deleted_at = timezone.now()
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        self.save(update_fields=["status", "deleted_at"])

    def activate_account(self):
        self.status = "active"
        self.activated_at = timezone.now()
        self.user.is_active = True
        self.user.save(update_fields=["is_active"])
        self.save(update_fields=["status", "activated_at"])

    def __str__(self):
        return f"{self.user.username} - {self.role} - {self.status}"


class Course(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Published", "Published"),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, default="")
    description = models.TextField(blank=True, default="")
    image = models.URLField(blank=True, default="")

    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="courses_taught",
        limit_choices_to={"profile__role": "instructor"},
    )

    open_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    enrollment = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Draft",
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses_created",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.instructor.username}"


@receiver(post_save, sender=User)
def create_user_related(sender, instance, created, **kwargs):
    if created:
        LoginSecurity.objects.create(user=instance)
        
        # Default profile values
        role = "trainee"
        status = "pending"

        # Superuser values
        if instance.is_superuser:
            role = "admin"
            status = "active"

        Profile.objects.create(
            user=instance,
            member_id=instance.username or None,
            role=role,
            status=status,
        )

    else:
        if not hasattr(instance, "profile"):
            role = "trainee"
            status = "pending"

            if instance.is_superuser:
                role = "admin"
                status = "active"
            
            Profile.objects.create(
                user=instance,
                member_id=instance.username or None,
                role=role,
                status=status,
            )
        if not hasattr(instance, "login_security"):
            LoginSecurity.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_related(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        profile = instance.profile
        if instance.username and profile.member_id != instance.username:
            profile.member_id = instance.username
        profile.save()

    if hasattr(instance, "login_security"):
        instance.login_security.save()