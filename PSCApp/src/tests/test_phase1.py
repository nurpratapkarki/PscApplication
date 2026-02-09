from uuid import uuid4

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from src.models.analytics import LeaderBoard
from src.models.attempt_answer import UserAnswer, UserAttempt
from src.models.branch import Branch, Category, SubBranch
from src.models.mocktest import MockTest, MockTestQuestion
from src.models.platform_stats import PlatformStats
from src.models.question_answer import Answer, Question


class Phase1LogicTests(TestCase):
    def setUp(self):
        # Setup basic data
        self.email = f"test_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="testuser", email=self.email, password="password"
        )
        # Profile is created by signal
        self.profile = self.user.profile
        self.profile.full_name = "Test User"
        self.profile.save()

        self.branch = Branch.objects.create(name_en="Branch 1", name_np="Branch 1")
        self.sub_branch = SubBranch.objects.create(
            name_en="SubBranch 1", name_np="SubBranch 1", branch=self.branch
        )
        self.category = Category.objects.create(
            name_en="Category 1",
            name_np="Category 1",
            target_branch=self.branch,
            scope_type="BRANCH",
        )

        self.profile.target_branch = self.branch
        self.profile.save()

    def test_user_profile_logic(self):
        """Test UserProfile methods: calculate_level, award_experience_points"""
        # Initial state
        self.assertEqual(self.profile.level, 1)
        self.assertEqual(self.profile.experience_points, 0)

        # Award XP
        self.profile.award_experience_points(150, "Test Award")

        # Check level calculation (1 + 150//100 = 2)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.experience_points, 150)
        self.assertEqual(self.profile.level, 2)

        # Check rank (only one user, so rank 1)
        self.assertEqual(self.profile.get_current_rank(), 1)

        # Add another user with more XP
        email2 = f"user2_{uuid4().hex[:8]}@example.com"
        user2 = User.objects.create_user(username="user2", email=email2)
        # Profile created by signal
        user2.profile.experience_points = 200
        user2.profile.save()

        self.assertEqual(self.profile.get_current_rank(), 2)

    def test_question_logic(self):
        """Test Question methods: get_accuracy_rate"""
        question = Question.objects.create(
            question_text_en="Test Q",
            question_text_np="Test Q",
            category=self.category,
            created_by=self.user,
            status="PUBLIC",
            is_public=True,
        )

        self.assertEqual(question.get_accuracy_rate(), 0.0)

        question.times_attempted = 10
        question.times_correct = 8
        question.save()

        self.assertEqual(question.get_accuracy_rate(), 80.0)

    def test_mock_test_generation(self):
        """Test MockTest generation from categories"""
        # Create some public questions
        for i in range(5):
            Question.objects.create(
                question_text_en=f"Q{i}",
                question_text_np=f"Q{i}",
                category=self.category,
                status="PUBLIC",
                is_public=True,
            )

        public_count = Question.objects.filter(
            category=self.category, status="PUBLIC"
        ).count()
        self.assertEqual(public_count, 5, "Setup failed to create 5 public questions")

        mock_test = MockTest.objects.create(
            title_en="Test Mock",
            title_np="Test Mock",
            branch=self.branch,
            total_questions=3,
        )

        # Generate
        mock_test.generate_from_categories({self.category.id: 3})

        self.assertEqual(mock_test.test_questions.count(), 3)

    def test_user_attempt_logic_and_signals(self):
        """Test UserAttempt completion, scoring, and signals updating stats"""
        # Create a mock test and question
        question = Question.objects.create(
            question_text_en="Q1",
            question_text_np="Q1",
            category=self.category,
            status="PUBLIC",
            is_public=True,
        )
        mock_test = MockTest.objects.create(
            title_en="Attempt Test",
            title_np="Attempt Test",
            branch=self.branch,
            total_questions=1,
        )
        MockTestQuestion.objects.create(
            mock_test=mock_test, question=question, question_order=1
        )

        # Start attempt
        attempt = UserAttempt.objects.create(
            user=self.user, mock_test=mock_test, status="IN_PROGRESS", total_score=1.0
        )

        # Create Correct Answer
        correct_ans = Answer.objects.create(
            question=question,
            answer_text_en="Ans",
            answer_text_np="Ans",
            is_correct=True,
        )

        # Submit Answer (should trigger signals)
        UserAnswer.objects.create(
            user_attempt=attempt, question=question, selected_answer=correct_ans
        )

        # Verify Question stats updated by signal
        question.refresh_from_db()
        self.assertEqual(question.times_attempted, 1)
        self.assertEqual(question.times_correct, 1)

        # Complete attempt (should trigger signals for LeaderBoard)
        attempt.score_obtained = 1.0
        attempt.status = "COMPLETED"
        attempt.save()  # Signal triggers here

        # Verify LeaderBoard updated
        leaderboard_entry = LeaderBoard.objects.filter(
            user=self.user, branch=self.branch
        ).first()
        self.assertIsNotNone(leaderboard_entry)
        self.assertEqual(leaderboard_entry.total_score, 1.0)
        self.assertEqual(leaderboard_entry.tests_completed, 1)

    def test_platform_stats(self):
        """Test PlatformStats refresh"""
        PlatformStats.objects.create(
            id=1
        )  # Ensure singleton exists if code assumes it ID 1

        # Create data
        Question.objects.create(category=self.category, status="PUBLIC", is_public=True)
        UserAttempt.objects.create(user=self.user, status="COMPLETED", total_score=10.0)

        PlatformStats.scheduled_update()

        stats = PlatformStats.objects.first()
        self.assertGreaterEqual(stats.total_questions_public, 1)
        self.assertGreaterEqual(stats.total_mock_tests_taken, 1)

    def test_leaderboard_recalculation(self):
        """Test LeaderBoard.recalculate_rankings"""
        # Create 2 users with attempts
        email2 = f"u2_{uuid4().hex[:8]}@e.com"
        user2 = User.objects.create_user(username="user2_lb", email=email2)

        mt = MockTest.objects.create(
            title_en="Lb Test",
            title_np="Lb Test",
            branch=self.branch,
            total_questions=1,
        )

        # User 1: Score 10
        UserAttempt.objects.create(
            user=self.user,
            mock_test=mt,
            status="COMPLETED",
            score_obtained=10,
            start_time=timezone.now(),
            total_score=20,
        )

        # User 2: Score 20
        UserAttempt.objects.create(
            user=user2,
            mock_test=mt,
            status="COMPLETED",
            score_obtained=20,
            start_time=timezone.now(),
            total_score=20,
        )

        # Recalculate
        LeaderBoard.recalculate_rankings("WEEKLY", branch=self.branch)

        # Check ranks
        lb1 = LeaderBoard.objects.get(
            user=self.user, time_period="WEEKLY", branch=self.branch
        )
        lb2 = LeaderBoard.objects.get(
            user=user2, time_period="WEEKLY", branch=self.branch
        )

        self.assertEqual(lb2.rank, 1)  # Higher score
        self.assertEqual(lb1.rank, 2)
