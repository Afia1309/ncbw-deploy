# Resets training progress for users inactive beyond a given threshold
# NOTE: Currently based on last_login
# (!) Change based on specifications (last activity, etc.) (!)

from django.core.management.base import BaseCommand # base class for creating custom Django management commands
from django.contrib.auth import get_user_model # retrieve active user model
from django.utils import timezone # timezone utilites
from datetime import timedelta # date/time utilites

from training.models import UserTrainingProgress # Import UserTrainingProgress class from models.py (in training folder in backend)

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

        inactive_users = User.objects.filter(
            # Query for inactive users
            last_login__lt=cutoff_date,
            is_active=True,
        )

        # No inactive users, exit early
        if not inactive_users.exists():
            self.stdout.write(self.style.SUCCESS("No inactive users found."))
            return

        total_resets = 0 # initalize (0)

        # Loop through each inactive user
        for user in inactive_users:
            progress_qs = UserTrainingProgress.objects.filter(user=user)

            if not progress_qs.exists():
                continue  # User has no training progress to reset

            for progress in progress_qs:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would reset progress: {user} → {progress.module}"
                    )
                else:
                    progress.reset_progress()
                    total_resets += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"Reset progress: {user} → {progress.module}"
                        )
                    )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry run complete. {total_resets} progress records would be reset."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Completed resetting progress for users inactive for {days}+ days."
                )
            )
