from django.core.management.base import BaseCommand
from django.db.models import Q

from src.models import Question


class Command(BaseCommand):
    help = "Scans for questions with similar text to detect duplicates"

    def handle(self, *args, **options):
        self.stdout.write("Scanning for potential duplicates...")

        questions = Question.objects.filter(status="PUBLIC")
        # Naive implementation: O(N^2) roughly, suitable for small batch or offline analysis.
        # For production with many questions, use Postgres Trigram search or separate search index.

        checked_ids = set()
        duplicates_found = 0

        for q1 in questions:
            if q1.id in checked_ids:
                continue

            # Check against others
            # Optimally we only check those created recently vs all?
            # Or just check exact string matches or containment

            # Using basic text matching for now as placeholder for advanced logic
            similar = Question.objects.filter(
                Q(question_text_en__icontains=q1.question_text_en)
                | Q(question_text_en__iexact=q1.question_text_en)
            ).exclude(id=q1.id)

            for q2 in similar:
                if q2.id in checked_ids:
                    continue

                self.stdout.write(
                    self.style.WARNING(f"Potential Duplicate: Q{q1.id} vs Q{q2.id}")
                )
                self.stdout.write(f"Text: {q1.question_text_en[:50]}...")
                duplicates_found += 1

            checked_ids.add(q1.id)

        self.stdout.write(
            self.style.SUCCESS(
                f"Scan complete. Found {duplicates_found} potential duplicates."
            )
        )
