from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.api.branch.serializers import (
    BranchSerializer,
    CategorySerializer,
    SubBranchSerializer,
)
from src.models.branch import Branch, Category, SubBranch


class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Branches.
    Branches are typically managed via Admin.
    """

    queryset = Branch.objects.filter(is_active=True).order_by("display_order")
    serializer_class = BranchSerializer
    permission_classes = [permissions.AllowAny]


class SubBranchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for SubBranches.
    """

    queryset = SubBranch.objects.filter(is_active=True).order_by("display_order")
    serializer_class = SubBranchSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["branch"]


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Categories.
    """

    queryset = Category.objects.filter(is_active=True).order_by("display_order")
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["scope_type", "target_branch", "target_sub_branch"]
    search_fields = ["name_en", "name_np"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="for-user")
    def for_user(self, request):
        """
        Get categories relevant to the current user (Universal + Branch specific).
        """
        categories = Category.get_categories_for_user(request.user)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
