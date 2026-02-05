# This file is in charge of automatically sending an email reminder to trainees who have been inactive for a certain period of time
# This command DOES NOT modify training progress
# (!) Currently it only tracks last login, but will be updated to track last time since a module was completed (!)

from django.core.management.base import BaseCommand # base class for creating custom Django management commands
from django.contrib.auth import get_user_model # retrieve active user model
from django.core.mail import send_mail # email utility
from django.utils import timezone # timezone utilites
from datetime import timedelta # date/time utilites

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

    # Main method
    def handle(self, *args, **options):
        days = options["days"] # Read number of inactive days
        cutoff_date = timezone.now() - timedelta(days=days) # Calculate cutoff date

        inactive_users = User.objects.filter(
            # Query for inactive users
            last_login__lt=cutoff_date,
            is_active=True,
        )

        # No inactive users, exit early
        if not inactive_users.exists():
            self.stdout.write(self.style.SUCCESS("No inactive users found."))
            return

        # Loop through each inactive user
        for user in inactive_users:
            if not user.email:
                continue # Skip users without email addresses (unlikely to ever happen, but for safety)

            # Send reminder email
            send_mail(
                subject="Training Portal Reminder",
                message=(
                    "Hello,\n\n"
                    "Our records show that you have not logged into the Training Portal recently.\n"
                    "Please log in to complete your required training.\n\n"
                    "Thank you."
                ),
                from_email="training@portal.local",
                recipient_list=[user.email],
                fail_silently=False,
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
