from django.urls import include, path
from rest_framework.routers import DefaultRouter

from src.api.analytics.views import ContributionViewSet, DailyActivityViewSet
from src.api.app_settings.views import AppSettingsViewSet
from src.api.attempt_answer.views import UserAnswerViewSet, UserAttemptViewSet
from src.api.branch.views import (BranchViewSet, CategoryViewSet,
                                  SubBranchViewSet)
from src.api.mocktest.views import MockTestViewSet
from src.api.notification.views import NotificationViewSet
from src.api.note.views import NoteViewSet
from src.api.platform_stats.views import PlatformStatsViewSet
from src.api.question_answer.views import (QuestionReportViewSet,
                                           QuestionViewSet)
from src.api.time_config.views import TimeConfigurationViewSet
from src.api.user_stats.views import (LeaderBoardViewSet, RankingsView,
                                      StudyCollectionViewSet,
                                      UserProgressViewSet, UserStatisticsViewSet)

router = DefaultRouter()

# Branch & Hierarchy
router.register(r"branches", BranchViewSet)
router.register(r"sub-branches", SubBranchViewSet)
router.register(r"categories", CategoryViewSet)

# Questions & Reports
router.register(r"questions", QuestionViewSet)
router.register(r"reports", QuestionReportViewSet)
router.register(r"notes", NoteViewSet)

# Mock Tests
router.register(r"mock-tests", MockTestViewSet)

# Attempts & Answers
router.register(r"attempts", UserAttemptViewSet, basename="attempt")
router.register(r"answers", UserAnswerViewSet)

# Stats & Analytics
router.register(r"platform-stats", PlatformStatsViewSet, basename="platform-stats")
router.register(r"daily-activity", DailyActivityViewSet)
router.register(r"contributions", ContributionViewSet)

# User Stats & Profile
router.register(r"statistics", UserStatisticsViewSet, basename="user-statistics")
router.register(r"progress", UserProgressViewSet, basename="user-progress")
router.register(r"collections", StudyCollectionViewSet, basename="study-collection")
router.register(r"leaderboard", LeaderBoardViewSet)

# Notifications & Settings
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"settings", AppSettingsViewSet)
router.register(r"time-configs", TimeConfigurationViewSet)

urlpatterns = [
    path("rankings/", RankingsView.as_view(), name="rankings"),
    path("", include(router.urls)),
]
