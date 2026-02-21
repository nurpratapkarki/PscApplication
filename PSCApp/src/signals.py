from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from django.db.models.signals import post_save
from django.dispatch import receiver

from src.models import (
    Contribution,
    LeaderBoard,
    Notification,
    Question,
    UserAnswer,
    UserAttempt,
    UserProfile,
    UserProgress,
    UserStatistics,
)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create UserProfile automatically for every new User (including Google OAuth users).
    Also handles linking existing profiles when a Google user logs in with an email
    that already exists from a regular signup.
    """

    if created:
        # First, check if a profile already exists with this email (from a previous signup)
        existing_profile = UserProfile.objects.filter(email=instance.email).first()

        if existing_profile:
            # Link the existing profile to this new user (Google OAuth login with existing email)
            if existing_profile.google_auth_user is None or existing_profile.google_auth_user == instance:
                existing_profile.google_auth_user = instance
                existing_profile.save(update_fields=["google_auth_user"])
            # If profile is linked to a different user, we have a conflict - log it but don't crash
            else:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"UserProfile with email {instance.email} already linked to user {existing_profile.google_auth_user.id}. "
                    f"New user {instance.id} was not linked."
                )
        else:
            # No existing profile, create a new one
            UserProfile.objects.create(
                google_auth_user=instance,
                email=instance.email,
                full_name=f"{instance.first_name} {instance.last_name}".strip() or instance.username,
            )
    else:
        # User updated - sync profile if it exists
        try:
            profile = instance.profile
            # Optionally sync email if changed
            if profile.email != instance.email and instance.email:
                # Check if the new email would conflict
                if not UserProfile.objects.filter(email=instance.email).exclude(pk=profile.pk).exists():
                    profile.email = instance.email
                    profile.save(update_fields=["email"])
        except UserProfile.DoesNotExist:
            pass


@receiver(post_save, sender=UserAnswer)
def handle_user_answer_save(sender, instance, created, **kwargs):
    """
    Update Question stats and UserProgress when an answer is saved.
    """
    question = instance.question
    question_counts = question.user_responses.filter(is_skipped=False).aggregate(
        attempted=Count("id"),
        correct=Count("id", filter=Q(is_correct=True)),
    )
    question.times_attempted = question_counts["attempted"] or 0
    question.times_correct = question_counts["correct"] or 0
    question.save(update_fields=["times_attempted", "times_correct"])

    # Update User Progress
    if instance.question.category:
        user_progress, _ = UserProgress.objects.get_or_create(
            user=instance.user_attempt.user, category=instance.question.category
        )
        progress_counts = UserAnswer.objects.filter(
            user_attempt__user=instance.user_attempt.user,
            question__category=instance.question.category,
            is_skipped=False,
        ).aggregate(
            attempted=Count("id"),
            correct=Count("id", filter=Q(is_correct=True)),
            avg_time=Avg("time_taken_seconds"),
        )
        attempted = progress_counts["attempted"] or 0
        correct = progress_counts["correct"] or 0
        user_progress.questions_attempted = attempted
        user_progress.correct_answers = correct
        user_progress.accuracy_percentage = (correct / attempted) * 100 if attempted else 0
        user_progress.average_time_seconds = (
            int(progress_counts["avg_time"]) if progress_counts["avg_time"] is not None else None
        )
        user_progress.last_attempted_date = instance.updated_at
        user_progress.save(
            update_fields=[
                "questions_attempted",
                "correct_answers",
                "accuracy_percentage",
                "average_time_seconds",
                "last_attempted_date",
            ]
        )

    # Update User Statistics (Questions Answered counting)
    user_stats, _ = UserStatistics.objects.get_or_create(
        user=instance.user_attempt.user
    )
    user_counts = UserAnswer.objects.filter(
        user_attempt__user=instance.user_attempt.user,
        is_skipped=False,
    ).aggregate(
        answered=Count("id"),
        correct=Count("id", filter=Q(is_correct=True)),
    )
    user_stats.questions_answered = user_counts["answered"] or 0
    user_stats.correct_answers = user_counts["correct"] or 0

    # Update daily streak on any activity
    user_stats.update_streak()
    user_stats.check_badge_eligibility()
    user_stats.save()


@receiver(post_save, sender=Contribution)
def handle_contribution_save(sender, instance, created, **kwargs):
    """
    Update UserProfile contribution counts and notify on approval.
    """
    user = instance.user
    if not user:
        return

    profile = getattr(user, "profile", None)
    if not profile:
        return

    # Update total contributions count if it's a new valid contribution
    if created:
        profile.total_contributions += 1
        profile.award_experience_points(
            50, "New Contribution Submitted"
        )  # 50 XP for contributing
        profile.save()

    # Create approval notification
    if instance.status == "APPROVED":
        Notification.objects.create(
            user=user,
            notification_type="CONTRIBUTION_APPROVED",
            title_en="Contribution Approved",
            title_np="योगदान स्वीकृत भयो",
            message_en=f"Your question '{instance.question.question_text_en[:30]}...' has been approved!",
            message_np=f"तपाईंको प्रश्न '{instance.question.question_text_en[:30]}...' स्वीकृत भएको छ!",
            related_question=instance.question,
        )


@receiver(post_save, sender=UserAttempt)
def handle_user_attempt_save(sender, instance, created, **kwargs):
    """
    Update LeaderBoard and Stats when attempt is completed.
    """
    if instance.status == "COMPLETED" and not created:
        # Skip leaderboard/stats if user answered zero questions (quit early)
        answered_count = instance.user_answers.filter(is_skipped=False).count()
        if answered_count == 0:
            return

        # Update LeaderBoard
        if instance.mock_test and instance.mock_test.branch:
            LeaderBoard.update_score(
                user=instance.user,
                branch=instance.mock_test.branch,
                score_delta=instance.score_obtained,
            )

        # Update Stats
        user_stats, _ = UserStatistics.objects.get_or_create(user=instance.user)
        if instance.mock_test:
            user_stats.mock_tests_completed += 1
        user_stats.update_streak()
        user_stats.check_badge_eligibility()
        user_stats.save()

        # Award XP based on score
        xp = int(instance.score_obtained * 2)  # e.g. 2x score
        instance.user.profile.award_experience_points(xp, "Test Completion")


@receiver(post_save, sender=Question)
def handle_question_save(sender, instance, created, **kwargs):
    """
    Update PlatformStats when question becomes public.
    Notify contributor when their question is created.
    """
    from django.db.models import F

    from src.models.platform_stats import PlatformStats

    if instance.status == "PUBLIC":
        PlatformStats.objects.filter(id=1).update(
            total_questions_public=F("total_questions_public") + 1
        )

    if created and instance.created_by:
        # Increment questions_contributed counter
        user_stats, _ = UserStatistics.objects.get_or_create(
            user=instance.created_by
        )
        user_stats.questions_contributed += 1
        user_stats.update_streak()
        user_stats.check_badge_eligibility()
        user_stats.save()

        Notification.objects.create(
            user=instance.created_by,
            notification_type="GENERAL",
            title_en="Question Submitted",
            title_np="प्रश्न पेश गरियो",
            message_en=f"Your question '{instance.question_text_en[:50]}' has been submitted for review.",
            message_np=f"तपाईंको प्रश्न '{instance.question_text_en[:50]}' समीक्षाको लागि पेश गरिएको छ।",
            related_question=instance,
        )
