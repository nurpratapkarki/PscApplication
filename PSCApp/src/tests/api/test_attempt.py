from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.branch import Branch, Category
from src.models.mocktest import MockTest, MockTestQuestion
from src.models.question_answer import Answer, Question
from src.models.user_stats import UserStatistics


class AttemptApiTests(APITestCase):
    def setUp(self):
        self.email = f"test_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="testuser", password="password", email=self.email
        )
        # Profile is created by signal
        self.profile = self.user.profile
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.branch = Branch.objects.create(name_en="B1", slug="b1")
        self.category = Category.objects.create(name_en="C1", slug="c1")
        self.question = Question.objects.create(
            question_text_en="Q1", category=self.category, status="PUBLIC"
        )
        self.correct_ans = Answer.objects.create(
            question=self.question,
            answer_text_en="Correct",
            is_correct=True,
            display_order=1,
        )
        self.wrong_ans = Answer.objects.create(
            question=self.question,
            answer_text_en="Wrong",
            is_correct=False,
            display_order=2,
        )

        self.mock_test = MockTest.objects.create(
            title_en="Test 1", branch=self.branch, total_questions=1
        )
        MockTestQuestion.objects.create(
            mock_test=self.mock_test,
            question=self.question,
            question_order=1,
            marks_allocated=2.0,
        )

    def test_start_attempt(self):
        url = reverse("attempt-start-attempt")
        payload = {"mock_test_id": self.mock_test.id, "mode": "MOCK_TEST"}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "IN_PROGRESS")
        return response.data["id"]

    def test_submit_answers_and_complete(self):
        attempt_id = self.test_start_attempt()

        # Submit Answer
        ans_url = reverse("useranswer-list")
        payload = {
            "user_attempt": attempt_id,
            "question": self.question.id,
            "selected_answer": self.correct_ans.id,
        }
        response = self.client.post(ans_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Complete Attempt
        complete_url = reverse("attempt-submit-attempt", args=[attempt_id])
        response = self.client.post(complete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify Score
        self.assertEqual(
            float(response.data["score_obtained"]), 2.0
        )  # 2 marks for correct answer
        self.assertEqual(response.data["status"], "COMPLETED")

    def test_skipped_answer_does_not_increment_questions_answered(self):
        attempt_id = self.test_start_attempt()

        ans_url = reverse("useranswer-list")
        payload = {
            "user_attempt": attempt_id,
            "question": self.question.id,
            "selected_answer": None,
            "is_skipped": True,
        }
        response = self.client.post(ans_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_skipped"])

        stats = UserStatistics.objects.get(user=self.user)
        self.assertEqual(stats.questions_answered, 0)
        self.assertEqual(stats.correct_answers, 0)

    def test_changing_skipped_to_answered_updates_statistics(self):
        attempt_id = self.test_start_attempt()
        ans_url = reverse("useranswer-list")

        skipped_payload = {
            "user_attempt": attempt_id,
            "question": self.question.id,
            "selected_answer": None,
            "is_skipped": True,
        }
        response = self.client.post(ans_url, skipped_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        answered_payload = {
            "user_attempt": attempt_id,
            "question": self.question.id,
            "selected_answer": self.correct_ans.id,
        }
        response = self.client.post(ans_url, answered_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_skipped"])
        self.assertTrue(response.data["is_correct"])

        stats = UserStatistics.objects.get(user=self.user)
        self.assertEqual(stats.questions_answered, 1)
        self.assertEqual(stats.correct_answers, 1)
