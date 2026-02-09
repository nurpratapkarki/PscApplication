from django.core.management.base import BaseCommand
from django.utils import timezone

from src.models import Question


class Command(BaseCommand):
    help = "Publishes approved questions scheduled for the current month"

    def handle(self, *args, **options):
        today = timezone.now().date()

        # Find questions scheduled for publication today or in the past that aren't public yet
        # AND are approved/pending review (depending on workflow).
        # Assuming 'PENDING_REVIEW' with a date means "ready to go on that date"
        # OR we have a dedicated status.
        # The schema says: scheduled_public_date is set, status is PENDING_REVIEW.

        questions_to_publish = Question.objects.filter(
            scheduled_public_date__lte=today, status="PENDING_REVIEW"
        )

        count = questions_to_publish.count()

        if count == 0:
            self.stdout.write("No questions to publish today.")
            return

        self.stdout.write(f"Publishing {count} questions...")

        for q in questions_to_publish:
            q.status = "PUBLIC"
            q.is_public = True
            q.save(update_fields=["status", "is_public"])
            self.stdout.write(f"Published Q{q.id}")

        self.stdout.write(
            self.style.SUCCESS(f"Successfully published {count} questions.")
        )
