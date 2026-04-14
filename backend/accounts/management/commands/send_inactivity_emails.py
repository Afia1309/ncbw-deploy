# This file is in charge of automatically sending an email reminder to trainees who have been inactive for a certain period of time
# This command DOES NOT modify training progress

from django.core.management.base import BaseCommand # base class for creating custom Django management commands
from django.contrib.auth import get_user_model # retrieve active user model
from django.core.mail import send_mail # email utility
from django.utils import timezone # timezone utilites
from datetime import timedelta # date/time utilites
from django.conf import settings
from django.db.models import Max

from notifications.models import Notification
from training.models import ItemProgress

User = get_user_model() # get project's user model


class Command(BaseCommand):
    help = "Send reminder emails to users inactive for a specified number of days"

    # Optional cmd arguments (for testing)
    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days of inactivity before sending reminder email",
        )
        parser.add_argument(
            "--minutes",
            type=int,
            default=None,
            help="For testing only: number of minutes of inactivity"
        )

    # Main method
    def handle(self, *args, **options):
        days = options["days"] # Read number of inactive days
        minutes = options["minutes"] # Read number of inactive minutes

        if minutes is not None:
            cutoff_date = timezone.now() - timedelta(minutes=minutes)
        else:
            cutoff_date = timezone.now() - timedelta(days=days) # Calculate cutoff date

        # Determine last module activity per user
        user_activity = ItemProgress.objects.exclude(
            last_activity__isnull=True
        ).values("user").annotate(
            last_activity=Max("last_activity")
        )

        # Find users whose last activity is older than cutoff
        inactive_user_ids = [
            entry["user"]
            for entry in user_activity
            if entry["last_activity"] < cutoff_date
        ]

        # Query for inactive users
        inactive_users = User.objects.filter(
            id__in=inactive_user_ids,
            is_active=True,
            profile__inactivity_reminder_sent_at__isnull=True,
            profile__role='trainee',    # Additional safety filter (trainees-only)
        )

        # No inactive users, exit early
        if not inactive_users.exists():
            self.stdout.write(self.style.SUCCESS("No inactive users found."))
            return

        # Loop through each inactive user
        for user in inactive_users:
            if not user.email:
                continue # Skip users without email addresses (unlikely to ever happen, but for safety)

            #in_progress_modules = ItemProgress.objects.filter(user=user).exclude(status="completed") # Only send emails for incomplete modules
            in_progress_modules = ItemProgress.objects.filter(user=user, status="in_progress")

            # Send reminder email
            send_mail(
                subject="Training Portal Reminder",
                message=(
                    "Hello,\n\n"
                    "Our records show that you have not logged into the Training Portal recently.\n"
                    "Please log in to complete your required training.\n\n"
                    "Thank you."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                #from_email="training@portal.local",
                recipient_list=[user.email],
                fail_silently=False,
            )

            # Mark reminder timestamp
            user.profile.inactivity_reminder_sent_at = timezone.now()
            user.profile.save(update_fields=["inactivity_reminder_sent_at"])

            # Send reminder notification in dashboard
            Notification.objects.create(
                user=user,
                title="Inactivity Reminder",
                message="You have been inactive. Please log in to complete your required training.",
                notification_type="warning",
                is_read=False,
            )

            # Output confirmation to terminal
            self.stdout.write(
                self.style.WARNING(f"Reminder email sent to {user.email}")
            )

	# Success message
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed sending inactivity reminders for users inactive for {days}+ days."
            )
        )
