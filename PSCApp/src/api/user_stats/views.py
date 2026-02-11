from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from src.api.permissions import IsOwnerOrReadOnly
from src.api.user_stats.serializers import (
    LeaderBoardSerializer,
    StudyCollectionSerializer,
    UserProgressSerializer,
    UserStatisticsSerializer,
)
from src.models.analytics import LeaderBoard
from src.models.user_stats import StudyCollection, UserProgress, UserStatistics


class UserStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Get statistics for current user.
    Only list/retrieve allowed (actually just 'me' logic mostly).
    """

    serializer_class = UserStatisticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserStatistics.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        stats, created = UserStatistics.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="by-category")
    def by_category(self, request):
        """Return per-category performance for the current user."""
        progress = UserProgress.objects.filter(
            user=request.user
        ).select_related("category")
        serializer = UserProgressSerializer(progress, many=True)
        return Response(serializer.data)


class UserProgressViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProgress.objects.all()
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category"]

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)


class StudyCollectionViewSet(viewsets.ModelViewSet):
    serializer_class = StudyCollectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        return StudyCollection.objects.filter(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def add_questions(self, request, pk=None):
        collection = self.get_object()
        question_ids = request.data.get("question_ids", [])
        if not isinstance(question_ids, list):
            return Response(
                {"detail": "question_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        collection.add_questions(question_ids)
        return Response({"status": "questions added"})

    @action(detail=True, methods=["post"])
    def remove_questions(self, request, pk=None):
        collection = self.get_object()
        question_ids = request.data.get("question_ids", [])
        if not isinstance(question_ids, list):
            return Response(
                {"detail": "question_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        collection.remove_questions(question_ids)
        return Response({"status": "questions removed"})


class LeaderBoardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LeaderBoard.objects.all().order_by("rank")
    serializer_class = LeaderBoardSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["time_period", "branch", "sub_branch"]


class RankingsView(APIView):
    """
    GET /api/rankings/?type=answers       → Top 100 by questions answered
    GET /api/rankings/?type=contributions  → Top 100 by questions contributed

    Returns the current user's rank (if authenticated) and top 100 entries.
    """

    permission_classes = [permissions.AllowAny]

    RANKING_TYPES = {
        "answers": {
            "order_field": "questions_answered",
            "label": "Most Questions Answered",
        },
        "contributions": {
            "order_field": "questions_contributed",
            "label": "Top Contributors",
        },
    }

    def _serialize_entry(self, stat, rank, request):
        profile = getattr(stat.user, "profile", None)
        profile_picture = None
        if profile and profile.profile_picture:
            profile_picture = request.build_absolute_uri(
                profile.profile_picture.url
            )
        return {
            "rank": rank,
            "user_name": profile.full_name if profile else stat.user.username,
            "profile_picture": profile_picture,
            "questions_answered": stat.questions_answered,
            "correct_answers": stat.correct_answers,
            "accuracy_percentage": round(stat.get_accuracy_percentage(), 1),
            "questions_contributed": stat.questions_contributed,
            "study_streak_days": stat.study_streak_days,
            "mock_tests_completed": stat.mock_tests_completed,
        }

    def get(self, request):
        ranking_type = request.query_params.get("type", "answers")

        if ranking_type not in self.RANKING_TYPES:
            return Response(
                {"detail": f"Invalid type. Choose from: {', '.join(self.RANKING_TYPES)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        field = self.RANKING_TYPES[ranking_type]["order_field"]

        # Top 100 users with at least 1 in the ranking field
        top_stats = (
            UserStatistics.objects.filter(**{f"{field}__gt": 0})
            .select_related("user", "user__profile")
            .order_by(f"-{field}")[:100]
        )

        top_users = [
            self._serialize_entry(stat, rank, request)
            for rank, stat in enumerate(top_stats, 1)
        ]

        # Current user's rank
        my_entry = None
        if request.user.is_authenticated:
            try:
                my_stat = UserStatistics.objects.select_related(
                    "user", "user__profile"
                ).get(user=request.user)
                my_value = getattr(my_stat, field)
                # Count how many users have a higher value
                my_rank = (
                    UserStatistics.objects.filter(**{f"{field}__gt": my_value}).count()
                    + 1
                )
                my_entry = self._serialize_entry(my_stat, my_rank, request)
            except UserStatistics.DoesNotExist:
                pass

        return Response(
            {
                "type": ranking_type,
                "label": self.RANKING_TYPES[ranking_type]["label"],
                "my_entry": my_entry,
                "top_users": top_users,
            }
        )
