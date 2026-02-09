from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.branch import Branch, Category, SubBranch


class BranchApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(
            name_en="Engineering", name_np="इन्जिनियरिङ", slug="engineering"
        )
        self.sub_branch = SubBranch.objects.create(
            branch=self.branch, name_en="Civil", name_np="सिभिल", slug="civil"
        )
        self.category = Category.objects.create(
            name_en="General Knowledge",
            name_np="सामान्य ज्ञान",
            slug="gk",
            scope_type="UNIVERSAL",
        )
        self.branch_category = Category.objects.create(
            name_en="Engineering Basics",
            name_np="इन्जिनियरिङ आधारभूत",
            slug="eng-basics",
            scope_type="BRANCH",
            target_branch=self.branch,
        )

    def test_list_branches(self):
        url = reverse("branch-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle pagination
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name_en"], "Engineering")

    def test_list_sub_branches(self):
        url = reverse("subbranch-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name_en"], "Civil")

    def test_list_categories(self):
        url = reverse("category-list")
        # Categories might require auth depending on permission config (IsAuthenticatedOrReadOnly)
        # Assuming read-only is allowed for anyone or authenticated
        # In views.py: permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertTrue(len(results) >= 2)

    def test_categories_for_user(self):
        # Create a user with Engineering branch
        email = f"eng_{uuid4().hex[:8]}@test.com"
        user = User.objects.create_user(
            username="eng_user", password="password", email=email
        )
        # Profile created by signal
        user.profile.target_branch = self.branch
        user.profile.save()

        self.client.force_authenticate(user=user)
        url = reverse("category-for-user")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # User should see Universal + Branch specific (Engineering)
        # Check slugs
        # This custom action returns list (not paginated by default unless configured)
        # But if it uses ListModelMixin style, it might be. View says:
        # returns Response(serializer.data) -> ListSerializer -> List. So no pagination dict.
        data = response.data
        if isinstance(data, dict) and "results" in data:
            data = data["results"]

        slugs = [c["slug"] for c in data]
        self.assertIn("gk", slugs)
        self.assertIn("eng-basics", slugs)

    def test_create_category_permission(self):
        # Unauthenticated try
        data = {
            "name_en": "New Cat",
            "name_np": "New Cat NP",
            "scope_type": "UNIVERSAL",
        }
        url = reverse("category-list")
        response = self.client.post(url, data)
        # Accept 401 or 403
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

        # Authenticated user try
        email = f"user_{uuid4().hex[:8]}@example.com"
        user = User.objects.create_user(
            username="user", password="password", email=email
        )
        self.client.force_authenticate(user=user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.last().created_by, user)
