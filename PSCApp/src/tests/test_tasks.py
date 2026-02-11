from datetime import timedelta
from uuid import uuid4

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from src.celery import app


class ScheduledTasksTests(TestCase):
    def test_beat_schedule(self):
        """Verify that the beat schedule is configured correctly"""
        schedule = app.conf.beat_schedule
        self.assertIn("update-platform-stats-hourly", schedule)
        self.assertIn("create-daily-activity-midnight", schedule)
        self.assertIn("update-user-streaks-midnight", schedule)
        self.assertIn("check-streak-notifications-daily", schedule)
        self.assertIn("recalculate-rankings-weekly", schedule)
        self.assertIn("send-weekly-summary", schedule)
        self.assertIn("process-monthly-publications", schedule)
        self.assertIn("monthly-maintenance", schedule)

        # Verify task paths are importable
        from src import tasks

        self.assertTrue(hasattr(tasks, "update_platform_stats"))
        self.assertTrue(hasattr(tasks, "check_streak_notifications"))
        self.assertTrue(hasattr(tasks, "monthly_maintenance"))

    def test_monthly_maintenance_logic(self):
        """Test monthly maintenance task resets stats and cleans old leaderboards"""
        from src.models.platform_stats import PlatformStats
        from src.tasks import monthly_maintenance

        # Setup
        PlatformStats.objects.create(id=1, total_contributions_this_month=10)

        # Execute
        monthly_maintenance()

        # Verify stats reset
        stats = PlatformStats.objects.first()
        self.assertEqual(stats.total_contributions_this_month, 0)

    def test_check_streak_notifications(self):
        """Test streak notification task sends alerts to at-risk users"""
        from src.models import Notification, UserStatistics
        from src.tasks import check_streak_notifications

        # Create user with streak at risk (last active yesterday, streak >= 3)
        user = User.objects.create_user(
            username=f"streakuser_{uuid4().hex[:6]}",
            password="testpass",
        )
        stats, _ = UserStatistics.objects.get_or_create(user=user)
        stats.study_streak_days = 5
        stats.last_activity_date = (timezone.now() - timedelta(days=1)).date()
        stats.save()

        # Execute task
        check_streak_notifications()

        # Verify notification was created
        notif = Notification.objects.filter(
            user=user, notification_type="STREAK_ALERT"
        )
        self.assertEqual(notif.count(), 1)
        self.assertIn("5-day streak", notif.first().message_en)

    def test_check_streak_notifications_ignores_safe_users(self):
        """Users active today should NOT get streak alerts"""
        from src.models import Notification, UserStatistics
        from src.tasks import check_streak_notifications

        user = User.objects.create_user(
            username=f"safeuser_{uuid4().hex[:6]}",
            password="testpass",
        )
        stats, _ = UserStatistics.objects.get_or_create(user=user)
        stats.study_streak_days = 10
        stats.last_activity_date = timezone.now().date()  # active today
        stats.save()

        check_streak_notifications()

        notif_count = Notification.objects.filter(
            user=user, notification_type="STREAK_ALERT"
        ).count()
        self.assertEqual(notif_count, 0)

    def test_send_weekly_summary(self):
        """Test weekly summary task creates notifications for active users"""
        from src.models import Notification, UserStatistics
        from src.models.attempt_answer import UserAnswer, UserAttempt
        from src.models.branch import Branch, Category, SubBranch
        from src.models.question_answer import Answer, Question
        from src.tasks import send_weekly_summary

        # Create user active within last 2 weeks
        user = User.objects.create_user(
            username=f"weeklyuser_{uuid4().hex[:6]}",
            password="testpass",
        )
        stats, _ = UserStatistics.objects.get_or_create(user=user)
        stats.last_activity_date = timezone.now().date()
        stats.study_streak_days = 3
        stats.save()

        # Create a question for the attempt
        branch = Branch.objects.create(name_en="Test Branch", slug="test-branch")
        sub = SubBranch.objects.create(
            name_en="Test Sub", slug="test-sub", branch=branch
        )
        cat = Category.objects.create(
            name_en="Test Cat",
            slug="test-cat",
            scope_type="SUBBRANCH",
            target_branch=branch,
            target_sub_branch=sub,
        )
        question = Question.objects.create(
            question_text_en="Test Q?",
            question_text_np="टेस्ट?",
            explanation_en="Because A",
            explanation_np="किनभने A",
            category=cat,
            difficulty_level="EASY",
            status="PUBLIC",
            created_by=user,
        )
        answer = Answer.objects.create(
            question=question,
            answer_text_en="Answer A",
            answer_text_np="उत्तर A",
            is_correct=True,
        )

        # Create a recent attempt with answer
        attempt = UserAttempt.objects.create(
            user=user,
            mode="PRACTICE",
            status="COMPLETED",
            total_score=1,
            score_obtained=1,
            percentage=100,
        )
        UserAnswer.objects.create(
            user_attempt=attempt,
            question=question,
            selected_answer=answer,
            is_correct=True,
        )

        # Execute task
        send_weekly_summary()

        # Verify notification was created
        notif = Notification.objects.filter(
            user=user, notification_type="GENERAL", title_en="Your Weekly Summary"
        )
        self.assertEqual(notif.count(), 1)
        self.assertIn("1 questions answered", notif.first().message_en)
        self.assertIn("1 correct", notif.first().message_en)

    def test_send_weekly_summary_skips_inactive_users(self):
        """Users inactive for >2 weeks should NOT get weekly summary"""
        from src.models import Notification, UserStatistics
        from src.tasks import send_weekly_summary

        user = User.objects.create_user(
            username=f"inactiveuser_{uuid4().hex[:6]}",
            password="testpass",
        )
        stats, _ = UserStatistics.objects.get_or_create(user=user)
        stats.last_activity_date = (timezone.now() - timedelta(days=30)).date()
        stats.save()

        send_weekly_summary()

        notif_count = Notification.objects.filter(
            user=user, notification_type="GENERAL"
        ).count()
        self.assertEqual(notif_count, 0)

    def test_monthly_maintenance_cleans_old_leaderboards(self):
        """Monthly maintenance should delete WEEKLY leaderboard entries older than 3 months"""
        from src.models.analytics import LeaderBoard
        from src.models.branch import Branch
        from src.models.platform_stats import PlatformStats
        from src.tasks import monthly_maintenance

        PlatformStats.objects.create(id=1)
        branch = Branch.objects.create(name_en="LB Branch", slug="lb-branch")
        user = User.objects.create_user(
            username=f"lbuser_{uuid4().hex[:6]}", password="testpass"
        )

        # Create old weekly entry (4 months ago)
        old_entry = LeaderBoard.objects.create(
            user=user,
            branch=branch,
            time_period="WEEKLY",
            total_score=100,
            accuracy_percentage=80,
            rank=1,
        )
        # Force-update last_updated to 4 months ago
        four_months_ago = timezone.now() - timedelta(days=120)
        LeaderBoard.objects.filter(pk=old_entry.pk).update(
            last_updated=four_months_ago
        )

        # Create recent monthly entry
        recent_entry = LeaderBoard.objects.create(
            user=user,
            branch=branch,
            time_period="MONTHLY",
            total_score=200,
            accuracy_percentage=90,
            rank=1,
        )

        monthly_maintenance()

        # Old weekly entry should be deleted
        self.assertFalse(LeaderBoard.objects.filter(pk=old_entry.pk).exists())
        # Recent monthly entry should remain
        self.assertTrue(LeaderBoard.objects.filter(pk=recent_entry.pk).exists())
