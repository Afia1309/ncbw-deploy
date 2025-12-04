from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class LoginSecurity(models.Model):
    """
    Tracks failed login attempts and lockout period for each user.
    Lock user after 5 failed attempts for 10 minutes.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='login_security'
    )
    failed_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    def register_failure(self):
        """Increment failed attempts and lock account after 5 tries."""
        now = timezone.now()

        # Already locked → nothing to do
        if self.locked_until and self.locked_until > now:
            return

        self.failed_attempts += 1

        # Lock user for 10 minutes after 5 failed attempts
        if self.failed_attempts >= 5:
            self.locked_until = now + timedelta(minutes=10)
            self.failed_attempts = 0  # reset counter after lockout

        self.save()

    def reset(self):
        """Reset failure count and clear lockout after successful login."""
        self.failed_attempts = 0
        self.locked_until = None
        self.save()

    def is_locked(self):
        """Check whether the account is currently locked."""
        return self.locked_until and self.locked_until > timezone.now()

    def __str__(self):
        return f"LoginSecurity({self.user.username})"


# -------------------
# SIGNALS
# -------------------

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_login_security(sender, instance, created, **kwargs):
    """
    Automatically create a LoginSecurity entry whenever a User is created.
    """
    if created:
        LoginSecurity.objects.create(user=instance)
