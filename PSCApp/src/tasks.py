from django.core.management import call_command

from celery import shared_task
from src.models import Branch, DailyActivity, LeaderBoard, PlatformStats


@shared_task
def update_platform_stats():
    """
    Refresh platform-wide statistics counters
    """
    PlatformStats.scheduled_update()


@shared_task
def create_daily_activity():
    """
    Snapshot daily metrics at midnight
    """
    DailyActivity.record_today_activity()


@shared_task
def update_user_streaks():
    """
    Update user streaks via management command logic
    """
    call_command("update_user_streaks")


@shared_task
def recalculate_rankings():
    """
    Heavy task: Recalculate leaderboards
    """
    # Recalculate for active branches
    branches = Branch.objects.filter(is_active=True)
    for branch in branches:
        # Weekly
        LeaderBoard.recalculate_rankings("WEEKLY", branch=branch)
        # Monthly - could schedule separately or check date, but OK to run weekly too if acceptable
        LeaderBoard.recalculate_rankings("MONTHLY", branch=branch)


@shared_task
def process_publications():
    """
    Publish approved questions
    """
    call_command("process_monthly_publications")


@shared_task
def monthly_maintenance():
    """
    Perform monthly maintenance tasks:
    - Reset stats
    - Archive leaderboards
    - Generate shoutout lists
    """
    # 1. Reset Monthly Counters (PlatformStats)
    PlatformStats.objects.first().reset_monthly_stats()

    # 2. Archive Leaderboards (Example logic: Copy to history table or just rely on 'time_period' logic)
    # Since existing logic uses time_period specific entries, current month becomes 'past' implicitly
    # when recalculate_rankings is called for the new month.
    # But we might want to clean up old 'WEEKLY' entries?

    # 3. Generate Shoutout List (Log for now)
    # top_contributors = Contribution.get_top_contributors(...)
    pass


@shared_task
def send_weekly_summary():
    """
    Send weekly summary emails to users
    """
    # Placeholder for email service
    pass


@shared_task
def check_streak_notifications():
    """
    Daily check to notify users whose streaks are about to break
    """
    # Placeholder for notification service
    pass
