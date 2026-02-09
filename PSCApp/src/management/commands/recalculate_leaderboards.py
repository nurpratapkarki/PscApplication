"""
Management command to recalculate leaderboards.
Run weekly via Celery or cron.
"""

from django.core.management.base import BaseCommand

from src.models import Branch, LeaderBoard


class Command(BaseCommand):
    help = "Recalculates leaderboard rankings for all branches and time periods"

    def add_arguments(self, parser):
        parser.add_argument(
            "--period",
            type=str,
            choices=["WEEKLY", "MONTHLY", "ALL_TIME", "all"],
            default="all",
            help="Time period to recalculate (default: all)",
        )
        parser.add_argument(
            "--branch",
            type=int,
            default=None,
            help="Branch ID to recalculate (default: all branches)",
        )

    def handle(self, *args, **options):
        period = options["period"]
        branch_id = options["branch"]

        # Get branches
        if branch_id:
            branches = Branch.objects.filter(id=branch_id, is_active=True)
        else:
            branches = Branch.objects.filter(is_active=True)

        if not branches.exists():
            self.stdout.write(self.style.WARNING("No active branches found."))
            return

        # Determine time periods
        if period == "all":
            periods = ["WEEKLY", "MONTHLY", "ALL_TIME"]
        else:
            periods = [period]

        total_recalculated = 0

        for branch in branches:
            for time_period in periods:
                self.stdout.write(
                    f"Recalculating {time_period} leaderboard for {branch.name_en}..."
                )
                LeaderBoard.recalculate_rankings(time_period, branch=branch)
                total_recalculated += 1

                # Count entries
                count = LeaderBoard.objects.filter(
                    time_period=time_period, branch=branch
                ).count()
                self.stdout.write(f"  - {count} entries created/updated")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully recalculated {total_recalculated} leaderboards."
            )
        )
