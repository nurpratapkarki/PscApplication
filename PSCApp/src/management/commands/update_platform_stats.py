"""
Management command to update platform statistics.
Run hourly via Celery or cron.
"""

from django.core.management.base import BaseCommand

from src.models import PlatformStats


class Command(BaseCommand):
    help = "Updates platform-wide statistics counters"

    def handle(self, *args, **options):
        self.stdout.write("Updating platform statistics...")

        PlatformStats.scheduled_update()

        stats = PlatformStats.objects.first()
        if stats:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Statistics updated:\n"
                    f"  - Public questions: {stats.total_questions_public}\n"
                    f"  - Pending questions: {stats.total_questions_pending}\n"
                    f"  - Active users: {stats.total_users_active}\n"
                    f"  - Tests taken: {stats.total_mock_tests_taken}\n"
                    f"  - Questions added today: {stats.questions_added_today}"
                )
            )
        else:
            self.stdout.write(self.style.WARNING("No platform stats record found."))
