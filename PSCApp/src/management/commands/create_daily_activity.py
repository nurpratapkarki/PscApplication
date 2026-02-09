"""
Management command to create daily activity snapshot.
Run daily at midnight via Celery or cron.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from src.models import DailyActivity


class Command(BaseCommand):
    help = "Creates a daily activity snapshot for analytics"

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            default=None,
            help="Date to record activity for (YYYY-MM-DD, default: today)",
        )

    def handle(self, *args, **options):
        date_str = options["date"]

        if date_str:
            try:
                from datetime import datetime

                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                self.stdout.write(
                    self.style.ERROR("Invalid date format. Use YYYY-MM-DD.")
                )
                return
        else:
            target_date = timezone.now().date()

        self.stdout.write(f"Recording daily activity for {target_date}...")

        # Use the model's static method
        DailyActivity.record_today_activity()

        activity = DailyActivity.objects.filter(date=target_date).first()
        if activity:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Daily activity recorded:\n"
                    f"  - New users: {activity.new_users}\n"
                    f"  - Questions added: {activity.questions_added}\n"
                    f"  - Questions approved: {activity.questions_approved}\n"
                    f"  - Mock tests taken: {activity.mock_tests_taken}\n"
                    f"  - Answers submitted: {activity.total_answers_submitted}\n"
                    f"  - Active users: {activity.active_users}"
                )
            )
        else:
            self.stdout.write(self.style.WARNING("Failed to create activity record."))
