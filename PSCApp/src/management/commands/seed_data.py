import random
from datetime import timedelta
from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from PIL import Image, ImageDraw

from src.models.analytics import Contribution, DailyActivity, LeaderBoard
from src.models.attempt_answer import UserAnswer, UserAttempt
from src.models.branch import Branch, Category, SubBranch
from src.models.mocktest import MockTest, MockTestQuestion
from src.models.notification import Notification
from src.models.platform_stats import PlatformStats
from src.models.question_answer import Answer, Question, QuestionReport
from src.models.user import UserProfile
from src.models.user_stats import (StudyCollection, UserProgress,
                                   UserStatistics)

fake = Faker()

class Command(BaseCommand):
    help = "Seeds the database with fake data for testing and development"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=10, help="Number of users to create")
        parser.add_argument("--questions", type=int, default=50, help="Number of questions to create")
        parser.add_argument("--tests", type=int, default=5, help="Number of mock tests to create")

    def generate_fake_image(self, name="image.png", size=(200, 200), color=None):
        if color is None:
            color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        
        img = Image.new("RGB", size, color=color)
        draw = ImageDraw.Draw(img)
        draw.text((size[0]//4, size[1]//2), name, fill=(255, 255, 255))
        
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        return ContentFile(buffer.getvalue(), name=name)

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # 1. Create Users
        self.stdout.write("Creating users...")
        users = []
        for i in range(options["users"]):
            username = fake.user_name() + str(i)
            email = f"{username}@example.com"
            user = User.objects.create_user(
                username=username,
                email=email,
                password="password123"
            )
            # UserProfile is likely created by signals, but let's ensure it has data
            profile = user.profile
            profile.full_name = fake.name()
            profile.email = email
            profile.profile_picture.save(f"profile_{user.id}.png", self.generate_fake_image(f"User {user.id}"))
            profile.save()
            users.append(user)

        # 2. Create Branches, SubBranches, Categories
        self.stdout.write("Creating branches and categories...")
        branches = []
        for name in ["Civil Service", "Engineering", "Technical", "Security Forces"]:
            branch = Branch.objects.create(
                name_en=name,
                name_np=f"NP {name}",
                has_sub_branches=True,
                display_order=len(branches)
            )
            branch.icon.save(f"branch_{branch.id}.png", self.generate_fake_image(name))
            branches.append(branch)

        sub_branches = []
        for branch in branches:
            for sub_name in ["Level 4", "Level 5", "Officer"]:
                sub = SubBranch.objects.create(
                    branch=branch,
                    name_en=f"{branch.name_en} {sub_name}",
                    name_np=f"NP {branch.name_en} {sub_name}",
                    display_order=len(sub_branches)
                )
                sub.icon.save(f"sub_{sub.id}.png", self.generate_fake_image(sub_name))
                sub_branches.append(sub)

        categories = []
        for i in range(5):
            cat = Category.objects.create(
                name_en=fake.word().capitalize(),
                name_np="NP " + fake.word(),
                scope_type="UNIVERSAL",
                display_order=i
            )
            cat.icon.save(f"cat_{cat.id}.png", self.generate_fake_image(cat.name_en))
            categories.append(cat)

        # 3. Create Questions and Answers
        self.stdout.write("Creating questions and answers...")
        questions = []
        for i in range(options["questions"]):
            q = Question.objects.create(
                question_text_en=fake.sentence() + "?",
                question_text_np=fake.sentence() + " (NP)?",
                category=random.choice(categories),
                difficulty_level=random.choice(["EASY", "MEDIUM", "HARD"]),
                status="PUBLIC",
                is_public=True,
                created_by=random.choice(users),
                explanation_en=fake.paragraph(),
                explanation_np="NP " + fake.paragraph()
            )
            if random.random() > 0.7:
                q.image.save(f"q_{q.id}.png", self.generate_fake_image("Question Image"))
            
            # Create 4 answers, one correct
            correct_idx = random.randint(0, 3)
            for j in range(4):
                Answer.objects.create(
                    question=q,
                    answer_text_en=fake.word(),
                    answer_text_np="NP " + fake.word(),
                    is_correct=(j == correct_idx),
                    display_order=j
                )
            questions.append(q)

        # 4. Create MockTests
        self.stdout.write("Creating mock tests...")
        mock_tests = []
        for i in range(options["tests"]):
            branch = random.choice(branches)
            mt = MockTest.objects.create(
                title_en=f"{branch.name_en} Practice Test {i+1}",
                title_np=f"NP {branch.name_en} Test {i+1}",
                test_type="OFFICIAL",
                branch=branch,
                total_questions=20,
                duration_minutes=60,
                is_public=True
            )
            mock_tests.append(mt)
            
            # Add questions to test
            test_questions = random.sample(questions, 20)
            for idx, q in enumerate(test_questions):
                MockTestQuestion.objects.create(
                    mock_test=mt,
                    question=q,
                    question_order=idx + 1,
                    marks_allocated=1.0
                )

        # 5. Create UserAttempts and UserAnswers
        self.stdout.write("Creating user attempts...")
        for user in users:
            for _ in range(random.randint(1, 3)):
                mt = random.choice(mock_tests)
                attempt = UserAttempt.objects.create(
                    user=user,
                    mock_test=mt,
                    status="COMPLETED",
                    total_score=mt.total_questions,
                    mode="MOCK_TEST",
                    start_time=timezone.now() - timedelta(hours=random.randint(1, 100)),
                )
                attempt.end_time = attempt.start_time + timedelta(minutes=random.randint(20, 50))
                
                # Create answers for this attempt
                score = 0
                for mq in mt.test_questions.all():
                    selected_answer = random.choice(list(mq.question.answers.all()))
                    is_correct = selected_answer.is_correct
                    if is_correct: score += 1
                    
                    UserAnswer.objects.create(
                        user_attempt=attempt,
                        question=mq.question,
                        selected_answer=selected_answer,
                        is_correct=is_correct,
                        time_taken_seconds=random.randint(10, 60)
                    )
                
                attempt.score_obtained = score
                attempt.percentage = (score / mt.total_questions) * 100
                attempt.total_time_taken = int((attempt.end_time - attempt.start_time).total_seconds())
                attempt.save()

        # 6. Metadata/Stats
        self.stdout.write("Generating stats and reports...")
        for q in random.sample(questions, 5):
            QuestionReport.objects.create(
                question=q,
                reported_by=random.choice(users),
                reason=random.choice(["INCORRECT_ANSWER", "TYPO"]),
                description=fake.sentence(),
                status="PENDING"
            )

        for user in users:
            Notification.objects.create(
                user=user,
                notification_type="GENERAL",
                title_en="Welcome to PSC App!",
                title_np="PSC एपमा स्वागत छ!",
                message_en="Happy studying!",
                message_np="शुभ अध्ययन!"
            )
            
            # UserStatistics
            stats, _ = UserStatistics.objects.get_or_create(user=user)
            stats.questions_answered = UserAnswer.objects.filter(user_attempt__user=user).count()
            stats.correct_answers = UserAnswer.objects.filter(user_attempt__user=user, is_correct=True).count()
            stats.mock_tests_completed = UserAttempt.objects.filter(user=user, status="COMPLETED").count()
            stats.save()

        # Platform Stats
        PlatformStats.scheduled_update()
        
        # Daily Activity
        DailyActivity.record_today_activity()

        self.stdout.write(self.style.SUCCESS("Successfully seeded database!"))
