from django.core.management.base import BaseCommand

from src.models import UserStatistics


class Command(BaseCommand):
    help = "Updates streak counts and resets broken streaks"

    def handle(self, *args, **options):
        # The UserStatistics.update_streak() method handles incrementing if active today/yesterday.
        # But we also need to RESET streaks if they missed a day.
        # This command runs daily.

        self.stdout.write("Updating user streaks...")

        # logic: if last_activity_date < yesterday, streak = 0?
        # The model method `update_streak` is usually called when user does an action.
        # But if they DON'T do an action, we need a cron to reset them?
        # Actually lazy reset is fine (reset on next activity), but for leaderboard/stats consistency
        # we might want to proactively zero them out if we display "Current Streak" on public profiles.

        # For now, let's assume we rely on lazy updates or just run a pass.
        # Iterating all users is expensive.
        # Better: Filter users who have streak > 0 AND last_activity_date < yesterday

        from datetime import timedelta

        from django.utils import timezone

        today = timezone.now().date()
        yesterday = today - timedelta(days=1)

        # Find broken streaks
        broken_streaks = UserStatistics.objects.filter(
            study_streak_days__gt=0, last_activity_date__lt=yesterday
        )

        count = broken_streaks.update(study_streak_days=0)

        self.stdout.write(self.style.SUCCESS(f"Reset {count} broken streaks."))
