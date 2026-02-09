from django.core.management.base import BaseCommand
from django.utils import timezone

from src.models.analytics import DailyActivity, LeaderBoard
from src.models.branch import Branch
from src.models.platform_stats import PlatformStats


class Command(BaseCommand):
    help = (
        "Runs heavy background tasks like ranking recalculation and stats aggregation"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Run all heavy tasks",
        )
        parser.add_argument(
            "--rankings",
            action="store_true",
            help="Recalculate leaderboard rankings",
        )
        parser.add_argument(
            "--stats",
            action="store_true",
            help="Refresh platform statistics and daily activity",
        )

    def handle(self, *args, **options):
        run_all = options["all"]
        run_rankings = options["rankings"] or run_all
        run_stats = options["stats"] or run_all

        self.stdout.write(
            self.style.SUCCESS(f"Starting heavy tasks at {timezone.now()}")
        )

        if run_stats:
            self.run_stats_tasks()

        if run_rankings:
            self.run_rankings_tasks()

        self.stdout.write(
            self.style.SUCCESS(f"Finished heavy tasks at {timezone.now()}")
        )

    def run_stats_tasks(self):
        self.stdout.write("Refreshing Platform Stats...")
        try:
            PlatformStats.scheduled_update()
            self.stdout.write(self.style.SUCCESS("Platform stats refreshed"))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Failed to refresh platform stats: {e}")
            )

        self.stdout.write("Recording Daily Activity...")
        try:
            DailyActivity.record_today_activity()
            self.stdout.write(self.style.SUCCESS("Daily activity recorded"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to record daily activity: {e}"))

    def run_rankings_tasks(self):
        self.stdout.write("Recalculating Rankings...")

        # We need to iterate over branches for accurate leaderboards
        branches = Branch.objects.filter(is_active=True)
        periods = [
            "WEEKLY",
            "MONTHLY",
        ]  # ALL_TIME might be too heavy or run less frequently

        for branch in branches:
            for period in periods:
                self.stdout.write(f"Processing {period} for {branch.name_en}...")
                try:
                    LeaderBoard.recalculate_rankings(time_period=period, branch=branch)
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error for {branch.name_en} {period}: {e}")
                    )

        self.stdout.write(self.style.SUCCESS("Rankings recalculation complete"))
