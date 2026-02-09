from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.api.mocktest.serializers import MockTestSerializer
from src.api.permissions import IsOwnerOrReadOnly
from src.models.mocktest import MockTest


class MockTestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MockTests.
    """

    queryset = (
        MockTest.objects.filter(is_active=True)
        .select_related("branch", "sub_branch")
        .order_by("-created_at")
    )
    serializer_class = MockTestSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["branch", "sub_branch", "test_type", "is_public"]
    search_fields = ["title_en", "title_np"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        # Public tests or own private tests
        if self.request.user.is_authenticated:
            return MockTest.objects.filter(is_public=True) | MockTest.objects.filter(
                created_by=self.request.user
            )
        return MockTest.objects.filter(is_public=True)

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """
        Generate a mock test from categories.
        Payload:
        {
            "title_en": "Generated Test",
            "branch_id": 1,
            "category_distribution": {"1": 5, "2": 3}  # category_id: count
        }
        """
        data = request.data
        title_en = data.get("title_en", "Generated Test")
        branch_id = data.get("branch_id")
        category_dist = data.get("category_distribution", {})

        if not branch_id or not category_dist:
            return Response(
                {"detail": "branch_id and category_distribution are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create basic test object
        test = MockTest.objects.create(
            title_en=title_en,
            title_np=title_en,  # Fallback
            branch_id=branch_id,
            total_questions=sum(category_dist.values()),
            created_by=request.user,
            test_type="CUSTOM",
            is_public=False,  # Generated tests are private by default
        )

        # Generate questions
        test.generate_from_categories(category_dist)

        serializer = self.get_serializer(test)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
