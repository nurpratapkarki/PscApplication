from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
