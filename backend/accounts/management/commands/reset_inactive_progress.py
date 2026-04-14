# Resets training progress for users inactive beyond a given threshold

from django.core.management.base import BaseCommand # base class for creating custom Django management commands
from django.contrib.auth import get_user_model # retrieve active user model
from django.utils import timezone # timezone utilites
from datetime import timedelta # date/time utilites
from django.db.models import Q, Max, F

from django.core.mail import send_mail
from django.conf import settings

from notifications.models import Notification # Import class from models.py (in notifications folder in backend)
from training.models import ItemProgress

User = get_user_model()


class Command(BaseCommand):
    help = "Reset training progress for users inactive for a specified number of days"

    # Optional cmd arguments (testing)
    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Number of days of inactivity before resetting progress",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be reset without modifying data",
        )

    # Main method
    def handle(self, *args, **options):
        days = options["days"] # Read number of inactive days
        dry_run = options["dry_run"]

        cutoff_date = timezone.now() - timedelta(days=days) # Calculate cutoff date

        # Determine last module activity per user
        user_activity = ItemProgress.objects.values("user").annotate(last_activity=Max("last_activity"))
        #user_activity = ItemProgress.objects.exclude(last_activity__isnull=True).values("user").annotate(last_activity=Max("last_activity"))

        # Find users whose last activity is older than cutoff
        inactive_user_ids = [
            entry["user"]
            for entry in user_activity
            if entry["last_activity"] and entry["last_activity"] < cutoff_date
        ]

        # Query for inactive users
        inactive_users = User.objects.filter(
            id__in=inactive_user_ids,
            is_active=True,
            profile__role='trainee',
            profile__inactivity_reminder_sent_at__isnull=False,
        )

        # No inactive users, exit early
        if not inactive_users.exists():
            self.stdout.write(self.style.SUCCESS("No inactive users found."))
            return

        total_resets = 0 # initalize (0)

        # Loop through each inactive user
        for user in inactive_users:

            modules = (
                ItemProgress.objects
                .filter(user=user)
                .values("item__module")
                .distinct()
            )

            reset_modules = [] # Track which modules were reset
            reset_happened = False

            for m in modules:
                module_progress = ItemProgress.objects.filter(
                    user=user,
                    item__module=m["item__module"]
                )

                if module_progress.filter(status="completed").count() == module_progress.count():
                    #self.stdout.write(self.style.SUCCESS(f"Skipping {user} (course fully completed)"))
                    continue # User has no training progress to reset/User has finished training

                reset_targets = module_progress.filter(status="in_progress")

                for progress in reset_targets:
                    reset_happened = True
                    total_resets += 1

                    module_name = str(progress.item)
                    reset_modules.append(module_name)

                    if dry_run:
                        self.stdout.write(
                            f"[DRY RUN] Would reset progress: {user} -> {progress.item}"
                        )
                    else:
                        progress.status = "not_started"
                        progress.completed_at = None
                        #progress.last_activity = None
                        #progress.last_activity = timezone.now()

                        progress.save(update_fields=["status", "completed_at"])

                        self.stdout.write(
                            self.style.WARNING(
                                f"Reset progress: {user} -> {progress.item}"
                            )
                        )

            if not dry_run and reset_happened:
                module_list = ", ".join(reset_modules)
                # Create notification (once per user)
                Notification.objects.create(
                    user=user,
                    title="Training Progress Reset",
                    message=(
                        #"Your training progress has been reset due to 30 days of inactivity. "
                        f"Your progress for the following modules has been reset due to inactivity: {module_list}.\n"
                        "Please log in to resume your assigned modules."
                    ),
                    notification_type="warning",
                    is_read=False,
                )

                # Send email(s)
                send_mail(
                    subject="Training Progress Reset",
                    message=(
                        "Hello,\n\n"
                        "Your training progress has been reset due to 30 days of inactivity.\n"
                        f"Affected modules: {module_list}\n"
                        "Please log in to resume your assigned modules.\n\n"
                        "Thank you."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )

                # Log confirmation in terminal
                self.stdout.write(self.style.WARNING(f"Reset email sent to {user.email}"))

                # Clear reminder timestamp after progress reset
                user.profile.inactivity_reminder_sent_at = None
                user.profile.save(update_fields=["inactivity_reminder_sent_at"])
 