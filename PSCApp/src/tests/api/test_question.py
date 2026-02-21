import json
from uuid import uuid4

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.analytics import Contribution
from src.models.branch import Category
from src.models.question_answer import Question


class QuestionApiTests(APITestCase):
    def setUp(self):
        self.email = f"user_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="user", password="password", email=self.email
        )
        self.client = APIClient()
        self.category = Category.objects.create(
            name_en="GK", scope_type="UNIVERSAL", slug="gk"
        )
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse("question-list")

    def test_create_question_with_answers(self):
        payload = {
            "question_text_en": "What is the capital of Nepal?",
            "question_text_np": "नेपालको राजधानी कहाँ हो?",
            "category": self.category.id,
            "difficulty_level": "EASY",
            "explanation_en": "Kathmandu is the capital.",
            "explanation_np": "काठमाडौं राजधानी हो।",
            "answers": [
                {
                    "answer_text_en": "Kathmandu",
                    "answer_text_np": "काठमाडौं",
                    "is_correct": True,
                },
                {
                    "answer_text_en": "Pokhara",
                    "answer_text_np": "पोखरा",
                    "is_correct": False,
                },
                {
                    "answer_text_en": "Lalitpur",
                    "answer_text_np": "ललितपुर",
                    "is_correct": False,
                },
                {
                    "answer_text_en": "Bhaktapur",
                    "answer_text_np": "भक्तपुर",
                    "is_correct": False,
                },
            ],
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        question_id = response.data["id"]
        question = Question.objects.get(id=question_id)
        self.assertEqual(question.answers.count(), 4)
        self.assertTrue(question.answers.filter(is_correct=True).exists())
        self.assertEqual(question.created_by, self.user)

    def test_list_questions_visibility(self):
        # Create public question
        public_q = Question.objects.create(
            question_text_en="Public Q",
            category=self.category,
            status="PUBLIC",
            created_by=self.user,
        )
        # Create private/draft question (owned by user)
        draft_q = Question.objects.create(
            question_text_en="Draft Q",
            category=self.category,
            status="DRAFT",
            created_by=self.user,
        )

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        ids = [q["id"] for q in results]

        self.assertIn(public_q.id, ids)
        self.assertIn(draft_q.id, ids)  # User should see their draft

        # Test as another user
        other_email = f"other_{uuid4().hex[:8]}@example.com"
        other_user = User.objects.create_user(
            username="other", password="password", email=other_email
        )
        self.client.force_authenticate(user=other_user)
        response = self.client.get(self.list_url)

        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        ids = [q["id"] for q in results]

        self.assertIn(public_q.id, ids)
        self.assertNotIn(draft_q.id, ids)  # Should not see other's draft

    def test_consent_action(self):
        q = Question.objects.create(
            question_text_en="My Q", category=self.category, created_by=self.user
        )
        url = reverse("question-consent", args=[q.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        q.refresh_from_db()
        self.assertTrue(q.consent_given)

    def test_consent_permission(self):
        other_email = f"other2_{uuid4().hex[:8]}@example.com"
        other_user = User.objects.create_user(
            username="other", password="password", email=other_email
        )
        q = Question.objects.create(
            question_text_en="Other Q", category=self.category, created_by=other_user
        )
        url = reverse("question-consent", args=[q.id])
        response = self.client.post(url)
        # Should be 404 because user can't see DRAFT/Other questions in queryset
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_bulk_upload_creates_contribution_records(self):
        bulk_url = reverse("question-bulk-upload")
        answers = json.dumps(
            [
                {
                    "answer_text_en": "Kathmandu",
                    "answer_text_np": "काठमाडौं",
                    "is_correct": True,
                },
                {
                    "answer_text_en": "Pokhara",
                    "answer_text_np": "पोखरा",
                    "is_correct": False,
                },
                {
                    "answer_text_en": "Lalitpur",
                    "answer_text_np": "ललितपुर",
                    "is_correct": False,
                },
                {
                    "answer_text_en": "Bhaktapur",
                    "answer_text_np": "भक्तपुर",
                    "is_correct": False,
                },
            ]
        )
        csv_content = (
            "question_text_en,question_text_np,explanation_en,explanation_np,"
            "difficulty_level,answers\n"
            "\"What is the capital of Nepal?\",\"नेपालको राजधानी कहाँ हो?\","
            "\"Kathmandu is the capital.\",\"काठमाडौं राजधानी हो।\","
            "\"EASY\",\""
            + answers.replace('"', '""')
            + "\"\n"
        )
        upload = SimpleUploadedFile(
            "questions.csv",
            csv_content.encode("utf-8"),
            content_type="text/csv",
        )

        response = self.client.post(
            bulk_url,
            {"file": upload, "category": self.category.id},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["uploaded_count"], 1)
        self.assertEqual(response.data["failed_count"], 0)

        question = Question.objects.get(question_text_en="What is the capital of Nepal?")
        self.assertEqual(question.answers.count(), 4)
        self.assertTrue(
            Contribution.objects.filter(user=self.user, question=question).exists()
        )

        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.total_contributions, 1)
