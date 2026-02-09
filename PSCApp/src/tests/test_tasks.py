from django.test import TestCase

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
        """Test monthly maintenance task logic"""
        from src.models.platform_stats import PlatformStats
        from src.tasks import monthly_maintenance

        # Setup
        PlatformStats.objects.create(id=1, total_contributions_this_month=10)

        # Execute
        monthly_maintenance()

        # Verify
        stats = PlatformStats.objects.first()
        self.assertEqual(stats.total_contributions_this_month, 0)
