import logging

from django.core.management import call_command

from celery import shared_task
from src.models import Branch, DailyActivity, LeaderBoard, PlatformStats

logger = logging.getLogger(__name__)


@shared_task
def update_platform_stats():
    """
    Refresh platform-wide statistics counters
    """
    logger.info("Starting platform stats update")
    PlatformStats.scheduled_update()
    logger.info("Platform stats update completed")


@shared_task
def create_daily_activity():
    """
    Snapshot daily metrics at midnight
    """
    logger.info("Creating daily activity snapshot")
    DailyActivity.record_today_activity()
    logger.info("Daily activity snapshot completed")


@shared_task
def update_user_streaks():
    """
    Update user streaks via management command logic
    """
    logger.info("Starting user streak updates")
    call_command("update_user_streaks")
    logger.info("User streak updates completed")


@shared_task
def recalculate_rankings():
    """
    Heavy task: Recalculate leaderboards
    """
    logger.info("Starting leaderboard recalculation")
    branches = Branch.objects.filter(is_active=True)
    count = 0
    for branch in branches:
        LeaderBoard.recalculate_rankings("WEEKLY", branch=branch)
        LeaderBoard.recalculate_rankings("MONTHLY", branch=branch)
        count += 1
    logger.info("Leaderboard recalculation completed for %d branches", count)


@shared_task
def process_publications():
    """
    Publish approved questions
    """
    logger.info("Starting monthly publication processing")
    call_command("process_monthly_publications")
    logger.info("Monthly publication processing completed")


@shared_task
def monthly_maintenance():
    """
    Perform monthly maintenance tasks:
    - Reset stats
    - Clean up old weekly leaderboard entries
    - Generate top contributor shoutout notifications
    """
    from datetime import timedelta

    from django.utils import timezone

    from src.models import Notification
    from src.models.analytics import Contribution

    logger.info("Starting monthly maintenance")

    # 1. Reset Monthly Counters (PlatformStats)
    stats = PlatformStats.objects.first()
    if stats:
        stats.reset_monthly_stats()
        logger.info("Monthly stats reset completed")

    # 2. Clean up old WEEKLY leaderboard entries (older than 3 months)
    three_months_ago = timezone.now() - timedelta(days=90)
    deleted_count, _ = LeaderBoard.objects.filter(
        time_period="WEEKLY",
        last_updated__lt=three_months_ago,
    ).delete()
    logger.info("Cleaned up %d old weekly leaderboard entries", deleted_count)

    # 3. Generate top contributor shoutout
    now = timezone.now()
    top_contributors = Contribution.get_top_contributors(
        year=now.year, month=now.month, limit=5
    )
    if top_contributors:
        Notification.create_bulk_notifications(
            users=list(top_contributors),
            notification_type="MILESTONE",
            title_en="Top Contributor This Month!",
            title_np="यस महिनाको शीर्ष योगदानकर्ता!",
            message_en="Congratulations! You're one of the top contributors this month. Keep it up!",
            message_np="बधाई छ! तपाईं यस महिनाको शीर्ष योगदानकर्ता मध्ये एक हुनुहुन्छ। जारी राख्नुहोस्!",
        )
        logger.info("Top contributor notifications sent to %d users", len(list(top_contributors)))

    logger.info("Monthly maintenance completed")


@shared_task
def send_weekly_summary():
    """
    Create in-app weekly summary notifications for active users.
    """
    from datetime import timedelta

    from django.utils import timezone

    from src.models import Notification, UserStatistics
    from src.models.attempt_answer import UserAnswer

    logger.info("Starting weekly summary generation")

    two_weeks_ago = (timezone.now() - timedelta(days=14)).date()
    one_week_ago = timezone.now() - timedelta(days=7)

    active_stats = UserStatistics.objects.filter(
        last_activity_date__gte=two_weeks_ago,
    ).select_related("user")

    count = 0
    for stats in active_stats:
        weekly_answers = UserAnswer.objects.filter(
            user_attempt__user=stats.user,
            user_attempt__created_at__gte=one_week_ago,
        ).count()

        weekly_correct = UserAnswer.objects.filter(
            user_attempt__user=stats.user,
            user_attempt__created_at__gte=one_week_ago,
            is_correct=True,
        ).count()

        msg_en = (
            f"This week: {weekly_answers} questions answered, "
            f"{weekly_correct} correct. "
            f"Current streak: {stats.study_streak_days} days."
        )
        msg_np = (
            f"यो हप्ता: {weekly_answers} प्रश्नहरू उत्तर दिइयो, "
            f"{weekly_correct} सही। "
            f"हालको स्ट्रिक: {stats.study_streak_days} दिन।"
        )

        Notification.objects.create(
            user=stats.user,
            notification_type="GENERAL",
            title_en="Your Weekly Summary",
            title_np="तपाईंको साप्ताहिक सारांश",
            message_en=msg_en,
            message_np=msg_np,
        )
        count += 1

    logger.info("Weekly summaries sent to %d users", count)


@shared_task
def check_streak_notifications():
    """
    Daily check to notify users whose streaks are about to break.
    """
    from datetime import timedelta

    from django.utils import timezone

    from src.models import Notification, UserStatistics

    logger.info("Starting streak notification check")

    yesterday = (timezone.now() - timedelta(days=1)).date()

    at_risk = UserStatistics.objects.filter(
        last_activity_date=yesterday,
        study_streak_days__gte=3,
    ).select_related("user")

    count = 0
    for stats in at_risk:
        Notification.objects.create(
            user=stats.user,
            notification_type="STREAK_ALERT",
            title_en="Don't lose your streak!",
            title_np="आफ्नो स्ट्रिक नगुमाउनुहोस्!",
            message_en=f"You have a {stats.study_streak_days}-day streak. Practice today to keep it going!",
            message_np=f"तपाईंको {stats.study_streak_days} दिनको स्ट्रिक छ। जारी राख्न आज अभ्यास गर्नुहोस्!",
        )
        count += 1

    logger.info("Streak notifications sent to %d at-risk users", count)
