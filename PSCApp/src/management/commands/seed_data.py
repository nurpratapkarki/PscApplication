"""
Seeds the database with realistic Nepal PSC (Loksewa) exam data.

Usage:
    python manage.py seed_data                    # Full seed (idempotent)
    python manage.py seed_data --flush            # Clear and recreate
    python manage.py seed_data --skip-users       # Structure only, no test users
    python manage.py seed_data --skip-attempts    # Skip mock test attempts
    python manage.py seed_data --questions-per-category 25
"""

import random
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from src.models.analytics import DailyActivity, LeaderBoard
from src.models.attempt_answer import UserAnswer, UserAttempt
from src.models.branch import Branch, Category, SubBranch
from src.models.mocktest import MockTest, MockTestQuestion
from src.models.notification import Notification
from src.models.platform_stats import PlatformStats
from src.models.question_answer import Answer, Question, QuestionReport
from src.models.time_config import TimeConfiguration
from src.models.user import UserProfile
from src.models.user_stats import UserProgress, UserStatistics

from src.seed_data.branches import BRANCHES
from src.seed_data.categories import (
    BRANCH_CATEGORIES,
    SUBBRANCH_CATEGORIES,
    UNIVERSAL_CATEGORIES,
)
from src.seed_data.generators import QUANT_GENERATORS, REASONING_GENERATORS
from src.seed_data.mock_tests import MOCK_TESTS
from src.seed_data.time_configs import TIME_CONFIGS


class Command(BaseCommand):
    help = "Seeds the database with realistic Nepal PSC exam data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Clear existing seed data before creating",
        )
        parser.add_argument(
            "--users",
            type=int,
            default=10,
            help="Number of test users to create (default: 10)",
        )
        parser.add_argument(
            "--questions-per-category",
            type=int,
            default=0,
            help="Max questions per category (0 = use all available templates)",
        )
        parser.add_argument(
            "--skip-users",
            action="store_true",
            help="Skip user/attempt creation (structure only)",
        )
        parser.add_argument(
            "--skip-attempts",
            action="store_true",
            help="Skip mock test attempt generation",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding Nepal PSC exam data..."))

        if options["flush"]:
            self._flush_data()

        # Load question templates lazily
        from src.seed_data.questions import CATEGORY_QUESTIONS

        self.category_questions = CATEGORY_QUESTIONS
        self.max_per_category = options["questions_per_category"]

        with transaction.atomic():
            branches = self._create_branches()
            sub_branches = self._create_sub_branches(branches)
            categories = self._create_categories(branches, sub_branches)
            self._create_questions(categories)
            self._create_mock_tests(branches, sub_branches, categories)
            self._create_time_configs(branches, sub_branches, categories)

            if not options["skip_users"]:
                users = self._create_users(options["users"], branches, sub_branches)
                if not options["skip_attempts"]:
                    self._create_attempts(users)

            self._update_platform_stats()

        self.stdout.write(self.style.SUCCESS("\nSeeding complete!"))
        self._print_summary()

    # ─── FLUSH ───────────────────────────────────────────────────────────

    def _flush_data(self):
        self.stdout.write(self.style.WARNING("Flushing existing data..."))
        # Delete in reverse dependency order to handle PROTECT constraints
        models_to_flush = [
            UserAnswer, UserAttempt, MockTestQuestion, MockTest,
            TimeConfiguration, Answer, Question, QuestionReport, Notification,
            LeaderBoard, UserProgress, DailyActivity,
            Category, SubBranch, Branch,
        ]
        for model in models_to_flush:
            count, _ = model.objects.all().delete()
            if count:
                self.stdout.write(f"  Deleted {count} {model.__name__} records")

        # Delete seed users (not superusers)
        count, _ = User.objects.filter(is_superuser=False, is_staff=False).delete()
        if count:
            self.stdout.write(f"  Deleted {count} test User records")

        PlatformStats.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("  Flush complete."))

    # ─── BRANCHES ────────────────────────────────────────────────────────

    def _create_branches(self):
        self.stdout.write("Creating branches...")
        branches = {}
        for data in BRANCHES:
            branch, created = Branch.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name_en": data["name_en"],
                    "name_np": data["name_np"],
                    "description_en": data.get("description_en", ""),
                    "description_np": data.get("description_np", ""),
                    "has_sub_branches": data["has_sub_branches"],
                    "display_order": data["display_order"],
                    "is_active": True,
                },
            )
            branches[data["slug"]] = branch
            status = "created" if created else "exists"
            self.stdout.write(f"  Branch: {data['name_en']} [{status}]")
        return branches

    # ─── SUB-BRANCHES ────────────────────────────────────────────────────

    def _create_sub_branches(self, branches):
        self.stdout.write("Creating sub-branches...")
        sub_branches = {}
        for branch_data in BRANCHES:
            branch = branches[branch_data["slug"]]
            for sb_data in branch_data.get("sub_branches", []):
                sub, created = SubBranch.objects.get_or_create(
                    branch=branch,
                    slug=sb_data["slug"],
                    defaults={
                        "name_en": sb_data["name_en"],
                        "name_np": sb_data["name_np"],
                        "description_en": sb_data.get("description_en", ""),
                        "description_np": sb_data.get("description_np", ""),
                        "display_order": sb_data["display_order"],
                        "is_active": True,
                    },
                )
                key = (branch_data["slug"], sb_data["slug"])
                sub_branches[key] = sub
                status = "created" if created else "exists"
                self.stdout.write(f"  SubBranch: {sb_data['name_en']} [{status}]")
        return sub_branches

    # ─── CATEGORIES ──────────────────────────────────────────────────────

    def _create_categories(self, branches, sub_branches):
        self.stdout.write("Creating categories...")
        categories = {}

        # Universal categories
        for cat_data in UNIVERSAL_CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name_en": cat_data["name_en"],
                    "name_np": cat_data["name_np"],
                    "description_en": cat_data.get("description_en", ""),
                    "description_np": cat_data.get("description_np", ""),
                    "scope_type": "UNIVERSAL",
                    "category_type": cat_data.get("category_type", "GENERAL"),
                    "color_code": cat_data.get("color_code", "#4CAF50"),
                    "display_order": cat_data.get("display_order", 0),
                    "is_public": True,
                    "is_active": True,
                },
            )
            categories[cat_data["slug"]] = cat
            status = "created" if created else "exists"
            self.stdout.write(f"  UNIVERSAL: {cat_data['name_en']} [{status}]")

        # Branch-scoped categories
        for branch_slug, cat_list in BRANCH_CATEGORIES.items():
            branch = branches.get(branch_slug)
            if not branch:
                self.stdout.write(
                    self.style.WARNING(f"  Skipping branch categories: unknown branch {branch_slug}")
                )
                continue
            for cat_data in cat_list:
                cat, created = Category.objects.get_or_create(
                    slug=cat_data["slug"],
                    defaults={
                        "name_en": cat_data["name_en"],
                        "name_np": cat_data["name_np"],
                        "description_en": cat_data.get("description_en", ""),
                        "description_np": cat_data.get("description_np", ""),
                        "scope_type": "BRANCH",
                        "target_branch": branch,
                        "category_type": cat_data.get("category_type", "SPECIAL"),
                        "color_code": cat_data.get("color_code", "#FF9800"),
                        "display_order": cat_data.get("display_order", 0),
                        "is_public": True,
                        "is_active": True,
                    },
                )
                categories[cat_data["slug"]] = cat
                status = "created" if created else "exists"
                self.stdout.write(f"  BRANCH ({branch_slug}): {cat_data['name_en']} [{status}]")

        # SubBranch-scoped categories
        for (branch_slug, sb_slug), cat_list in SUBBRANCH_CATEGORIES.items():
            branch = branches.get(branch_slug)
            sb_key = (branch_slug, sb_slug)
            sub_branch = sub_branches.get(sb_key)
            if not branch or not sub_branch:
                self.stdout.write(
                    self.style.WARNING(f"  Skipping subbranch categories: unknown {sb_key}")
                )
                continue
            for cat_data in cat_list:
                cat, created = Category.objects.get_or_create(
                    slug=cat_data["slug"],
                    defaults={
                        "name_en": cat_data["name_en"],
                        "name_np": cat_data["name_np"],
                        "description_en": cat_data.get("description_en", ""),
                        "description_np": cat_data.get("description_np", ""),
                        "scope_type": "SUBBRANCH",
                        "target_branch": branch,
                        "target_sub_branch": sub_branch,
                        "category_type": cat_data.get("category_type", "SPECIAL"),
                        "color_code": cat_data.get("color_code", "#9C27B0"),
                        "display_order": cat_data.get("display_order", 0),
                        "is_public": True,
                        "is_active": True,
                    },
                )
                categories[cat_data["slug"]] = cat
                status = "created" if created else "exists"
                self.stdout.write(f"  SUBBRANCH ({sb_slug}): {cat_data['name_en']} [{status}]")

        return categories

    # ─── QUESTIONS & ANSWERS ─────────────────────────────────────────────

    def _create_questions(self, categories):
        self.stdout.write("Creating questions and answers...")
        total_created = 0
        total_skipped = 0

        for cat_slug, cat_obj in categories.items():
            templates = self._get_templates_for_category(cat_slug)
            if not templates:
                continue

            if self.max_per_category > 0:
                templates = templates[: self.max_per_category]

            questions_to_create = []
            answers_map = []

            for tpl in templates:
                # Skip duplicates
                if Question.objects.filter(
                    question_text_en=tpl["question_text_en"],
                    category=cat_obj,
                ).exists():
                    total_skipped += 1
                    continue

                q = Question(
                    question_text_en=tpl["question_text_en"],
                    question_text_np=tpl.get("question_text_np", ""),
                    category=cat_obj,
                    difficulty_level=tpl.get("difficulty", "MEDIUM"),
                    question_type="MCQ",
                    explanation_en=tpl.get("explanation_en", ""),
                    explanation_np=tpl.get("explanation_np", ""),
                    status="PUBLIC",
                    is_public=True,
                    source_reference=tpl.get("source_reference", "PSC Exam"),
                    created_by=None,
                )
                questions_to_create.append(q)
                answers_map.append(tpl["answers"])

            if not questions_to_create:
                continue

            # Bulk create questions (bypasses post_save signals — no notification spam)
            Question.objects.bulk_create(questions_to_create)

            # Now create answers for each question
            answers_to_create = []
            for q_obj, answer_list in zip(questions_to_create, answers_map):
                # Shuffle answer order so correct isn't always first
                shuffled_answers = list(answer_list)
                random.shuffle(shuffled_answers)
                for display_order, ans in enumerate(shuffled_answers):
                    answers_to_create.append(
                        Answer(
                            question=q_obj,
                            answer_text_en=ans["text_en"],
                            answer_text_np=ans.get("text_np", ""),
                            is_correct=ans["is_correct"],
                            display_order=display_order,
                        )
                    )

            Answer.objects.bulk_create(answers_to_create)
            created_count = len(questions_to_create)
            total_created += created_count
            self.stdout.write(f"  {cat_obj.name_en}: {created_count} questions")

        if total_skipped:
            self.stdout.write(f"  ({total_skipped} duplicate questions skipped)")
        self.stdout.write(self.style.SUCCESS(f"  Total: {total_created} questions created"))

    def _get_templates_for_category(self, cat_slug):
        """Get question templates: static from files + dynamically generated."""
        templates = []

        # Static templates from question files
        static = self.category_questions.get(cat_slug)
        if static and isinstance(static, list):
            templates.extend(static)

        # Generated questions for math/reasoning categories
        if cat_slug == "quantitative-aptitude":
            for gen_func in QUANT_GENERATORS:
                for _ in range(2):
                    try:
                        templates.append(gen_func())
                    except Exception:
                        pass

        elif cat_slug == "reasoning-mental-ability":
            for gen_func in REASONING_GENERATORS:
                for _ in range(3):
                    try:
                        templates.append(gen_func())
                    except Exception:
                        pass

        return templates

    # ─── MOCK TESTS ──────────────────────────────────────────────────────

    def _create_mock_tests(self, branches, sub_branches, categories):
        self.stdout.write("Creating mock tests...")

        for mt_data in MOCK_TESTS:
            branch = branches.get(mt_data["branch_slug"])
            if not branch:
                continue

            sub_branch = None
            if mt_data.get("sub_branch_slug"):
                sb_key = (mt_data["branch_slug"], mt_data["sub_branch_slug"])
                sub_branch = sub_branches.get(sb_key)

            # Generate slug from title
            test_slug = slugify(mt_data["title_en"])

            mt, created = MockTest.objects.get_or_create(
                slug=test_slug,
                defaults={
                    "title_en": mt_data["title_en"],
                    "title_np": mt_data.get("title_np", ""),
                    "description_en": mt_data.get("description_en", ""),
                    "description_np": mt_data.get("description_np", ""),
                    "test_type": mt_data.get("test_type", "OFFICIAL"),
                    "branch": branch,
                    "sub_branch": sub_branch,
                    "total_questions": mt_data["total_questions"],
                    "duration_minutes": mt_data["duration_minutes"],
                    "pass_percentage": mt_data.get("pass_percentage", 40.0),
                    "is_public": True,
                    "is_active": True,
                },
            )

            if not created:
                self.stdout.write(f"  MockTest: {mt_data['title_en']} [exists]")
                continue

            # Add questions based on category distribution
            question_order = 1
            distribution = mt_data.get("category_distribution", {})

            for cat_slug, count in distribution.items():
                cat = categories.get(cat_slug)
                if not cat:
                    continue

                available = list(
                    Question.objects.filter(category=cat, status="PUBLIC")
                    .exclude(mock_test_appearances__mock_test=mt)
                    .order_by("?")[:count]
                )

                for q in available:
                    MockTestQuestion.objects.create(
                        mock_test=mt,
                        question=q,
                        question_order=question_order,
                        marks_allocated=2.0,  # PSC standard: 2 marks per MCQ
                    )
                    question_order += 1

            actual = mt.test_questions.count()
            self.stdout.write(
                f"  MockTest: {mt_data['title_en']} [created, {actual}/{mt_data['total_questions']} Qs]"
            )

    # ─── TIME CONFIGS ────────────────────────────────────────────────────

    def _create_time_configs(self, branches, sub_branches, categories):
        self.stdout.write("Creating time configurations...")
        for tc_data in TIME_CONFIGS:
            branch = branches.get(tc_data["branch_slug"])
            if not branch:
                continue

            sub_branch = None
            if tc_data.get("sub_branch_slug"):
                sb_key = (tc_data["branch_slug"], tc_data["sub_branch_slug"])
                sub_branch = sub_branches.get(sb_key)

            category = None
            if tc_data.get("category_slug"):
                category = categories.get(tc_data["category_slug"])

            exists = TimeConfiguration.objects.filter(
                branch=branch, sub_branch=sub_branch, category=category,
            ).exists()

            if not exists:
                TimeConfiguration.objects.create(
                    branch=branch,
                    sub_branch=sub_branch,
                    category=category,
                    standard_duration_minutes=tc_data["standard_duration_minutes"],
                    questions_count=tc_data["questions_count"],
                    description=tc_data.get("description", ""),
                    is_active=True,
                )
                desc = tc_data.get("description", "")[:60]
                self.stdout.write(f"  TimeConfig: {desc} [created]")

    # ─── USERS ───────────────────────────────────────────────────────────

    def _create_users(self, count, branches, sub_branches):
        self.stdout.write(f"Creating {count} test users...")
        users = []
        branch_list = list(branches.values())

        for i in range(count):
            username = f"testuser{i + 1}"
            email = f"{username}@pscapp.test"

            if User.objects.filter(username=username).exists():
                users.append(User.objects.get(username=username))
                continue

            user = User.objects.create_user(
                username=username,
                email=email,
                password="testpass123",
                first_name="Test",
                last_name=f"User {i + 1}",
            )
            # Signal auto-creates UserProfile; update it
            profile = user.profile
            profile.full_name = f"Test User {i + 1}"
            profile.email = email
            branch = random.choice(branch_list)
            profile.target_branch = branch

            if branch.has_sub_branches:
                sbs = [sb for key, sb in sub_branches.items() if key[0] == branch.slug]
                if sbs:
                    profile.target_sub_branch = random.choice(sbs)

            profile.save()
            users.append(user)

        self.stdout.write(self.style.SUCCESS(f"  {len(users)} users ready"))
        return users

    # ─── ATTEMPTS ────────────────────────────────────────────────────────

    def _create_attempts(self, users):
        self.stdout.write("Creating mock test attempts...")
        mock_tests = list(MockTest.objects.filter(is_active=True))
        if not mock_tests:
            self.stdout.write(self.style.WARNING("  No mock tests available"))
            return

        attempt_count = 0
        for user in users:
            tests_to_attempt = random.sample(
                mock_tests, min(random.randint(1, 3), len(mock_tests))
            )
            for mt in tests_to_attempt:
                if UserAttempt.objects.filter(
                    user=user, mock_test=mt, status="COMPLETED"
                ).exists():
                    continue

                start = timezone.now() - timedelta(hours=random.randint(1, 200))
                attempt = UserAttempt.objects.create(
                    user=user,
                    mock_test=mt,
                    status="IN_PROGRESS",
                    total_score=mt.total_questions * 2,
                    mode="MOCK_TEST",
                    start_time=start,
                )

                score = 0
                test_questions = list(mt.test_questions.select_related("question").all())
                for mq in test_questions:
                    answers = list(mq.question.answers.all())
                    if not answers:
                        continue
                    selected = random.choice(answers)
                    UserAnswer.objects.create(
                        user_attempt=attempt,
                        question=mq.question,
                        selected_answer=selected,
                        is_correct=selected.is_correct,
                        time_taken_seconds=random.randint(15, 90),
                    )
                    if selected.is_correct:
                        score += 2

                attempt.end_time = start + timedelta(minutes=random.randint(20, 45))
                attempt.score_obtained = score
                attempt.total_time_taken = int(
                    (attempt.end_time - attempt.start_time).total_seconds()
                )
                total_possible = len(test_questions) * 2
                attempt.percentage = (score / total_possible * 100) if total_possible else 0
                attempt.status = "COMPLETED"
                attempt.save()
                attempt_count += 1

        self.stdout.write(self.style.SUCCESS(f"  {attempt_count} attempts created"))

    # ─── PLATFORM STATS ──────────────────────────────────────────────────

    def _update_platform_stats(self):
        self.stdout.write("Updating platform stats...")
        stats, _ = PlatformStats.objects.get_or_create(id=1)
        stats.total_questions_public = Question.objects.filter(status="PUBLIC").count()
        stats.total_questions_pending = Question.objects.filter(status="PENDING_REVIEW").count()
        stats.total_users_active = User.objects.filter(is_active=True).count()
        stats.total_mock_tests_taken = UserAttempt.objects.filter(status="COMPLETED").count()
        stats.total_answers_submitted = UserAnswer.objects.count()
        stats.save()

        DailyActivity.record_today_activity()
        self.stdout.write(self.style.SUCCESS("  Platform stats updated"))

    # ─── SUMMARY ─────────────────────────────────────────────────────────

    def _print_summary(self):
        self.stdout.write("\n" + self.style.MIGRATE_HEADING("=== Seed Data Summary ==="))
        self.stdout.write(f"  Branches:        {Branch.objects.count()}")
        self.stdout.write(f"  SubBranches:     {SubBranch.objects.count()}")
        u = Category.objects.filter(scope_type="UNIVERSAL").count()
        b = Category.objects.filter(scope_type="BRANCH").count()
        s = Category.objects.filter(scope_type="SUBBRANCH").count()
        self.stdout.write(f"  Categories:      {u + b + s} (U:{u} B:{b} S:{s})")
        self.stdout.write(f"  Questions:       {Question.objects.filter(status='PUBLIC').count()}")
        self.stdout.write(f"  Mock Tests:      {MockTest.objects.count()}")
        self.stdout.write(f"  Time Configs:    {TimeConfiguration.objects.count()}")
        self.stdout.write(f"  Users:           {User.objects.filter(is_superuser=False).count()}")
        self.stdout.write(f"  Attempts:        {UserAttempt.objects.filter(status='COMPLETED').count()}")
