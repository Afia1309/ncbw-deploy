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



class Profile(models.Model):
    """Extended user profile for member ID, role, position, etc."""
    
    ROLE_CHOICES = [
        ('trainee', 'Trainee'),
        ('instructor', 'Instructor'),
        ('admin', 'Administrator'),
    ]
    
    POSITION_CHOICES = [
        ('President', 'President'),
        ('Vice President', 'Vice President'),
        ('Treasurer', 'Treasurer'),
        ('Secretary', 'Secretary'),
        ('Chaplain', 'Chaplain'),
        ('Parliamentarian', 'Parliamentarian'),
        ('General Member', 'General Member'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='profile'
    )
    member_id = models.CharField(
        max_length=50, 
        unique=True,
        null=True,
        blank=True,
        help_text="Unique member identifier"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='trainee'
    )
    position = models.CharField(
        max_length=50,
        choices=POSITION_CHOICES,
        blank=True,
        default='General Member'
    )
    phone = models.CharField(
        max_length=20, 
        blank=True,
        default=''
    )
    department = models.CharField(
        max_length=100, 
        blank=True,
        default=''
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
      
        if not self.member_id:
            self.member_id = f"MEM{self.user.id:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.member_id or 'No ID'}"



from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_related(sender, instance, created, **kwargs):
    """
    Automatically create LoginSecurity and Profile when a User is created.
    """
    if created:
        LoginSecurity.objects.create(user=instance)
        Profile.objects.create(user=instance)
    else:
        # Ensure profile exists even for existing users
        if not hasattr(instance, 'profile'):
            Profile.objects.create(user=instance)
        if not hasattr(instance, 'login_security'):
            LoginSecurity.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_related(sender, instance, **kwargs):
    """Save related models when User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
    if hasattr(instance, 'login_security'):
        instance.login_security.save()