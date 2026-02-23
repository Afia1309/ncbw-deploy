# training/commands/seed_training.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from training.models import Track, Module, Enrollment

class Command(BaseCommand):
    help = "Seed default track and modules"

    def handle(self, *args, **kwargs):
        track, _ = Track.objects.get_or_create(name="Leadership Track")

        modules = [
            (1, "Leadership & Strategic Visioning"),
            (2, "Effective Public Speaking & Communication"),
            (3, "Conflict Resolution & Mediation"),
            (4, "Delegation & Time Management"),
            (5, "Organizational Culture & Ethics"),
        ]

        for order, title in modules:
            Module.objects.get_or_create(
                track=track,
                order=order,
                defaults={"title": title, "required": True},
            )
        
        # Create enrollment for test user if exists
        try:
            test_user = User.objects.get(username='testuser')
            Enrollment.objects.get_or_create(
                user=test_user,
                defaults={
                    'track': track,
                    'cohort': '2026',
                    'phase': 'Phase 1'
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Enrolled {test_user.username} in {track.name}"))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("No testuser found. Create one with: python manage.py createsuperuser"))
        
        self.stdout.write(self.style.SUCCESS("Seeded track + modules"))