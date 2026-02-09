from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.branch import Branch, Category
from src.models.mocktest import MockTest
from src.models.question_answer import Question


class MockTestApiTests(APITestCase):
    def setUp(self):
        self.email = f"user_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="user", password="password", email=self.email
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.branch = Branch.objects.create(name_en="B1", slug="b1")
        self.category = Category.objects.create(
            name_en="C1", slug="c1", scope_type="UNIVERSAL"
        )

        # Create some public questions
        for i in range(5):
            Question.objects.create(
                question_text_en=f"Q{i}",
                category=self.category,
                status="PUBLIC",
                created_by=self.user,
            )

    def test_list_mock_tests(self):
        MockTest.objects.create(
            title_en="Public Test",
            branch=self.branch,
            total_questions=10,
            is_public=True,
        )
        url = reverse("mocktest-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_generate_mock_test(self):
        url = reverse("mocktest-generate")
        payload = {
            "title_en": "My Generated Test",
            "branch_id": self.branch.id,
            "category_distribution": {str(self.category.id): 3},
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        test_id = response.data["id"]
        test = MockTest.objects.get(id=test_id)
        self.assertEqual(test.test_questions.count(), 3)
        self.assertEqual(test.created_by, self.user)
        self.assertFalse(test.is_public)  # Generated should be private
