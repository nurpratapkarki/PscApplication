from rest_framework import serializers

from src.models.analytics import LeaderBoard
from src.models.user_stats import StudyCollection, UserProgress, UserStatistics


class UserProgressSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name_en", read_only=True)

    class Meta:
        model = UserProgress
        fields = [
            "id",
            "category",
            "category_name",
            "questions_attempted",
            "correct_answers",
            "accuracy_percentage",
            "average_time_seconds",
            "last_attempted_date",
            "weak_topics",
        ]
        read_only_fields = [
            "questions_attempted",
            "correct_answers",
            "accuracy_percentage",
            "weak_topics",
        ]


class UserStatisticsSerializer(serializers.ModelSerializer):
    badges_earned = serializers.JSONField(read_only=True)
    accuracy_percentage = serializers.SerializerMethodField()
    total_correct_answers = serializers.IntegerField(
        source="correct_answers", read_only=True
    )
    contribution_rank = serializers.SerializerMethodField()
    answers_rank = serializers.SerializerMethodField()

    class Meta:
        model = UserStatistics
        fields = [
            "questions_contributed",
            "questions_made_public",
            "questions_answered",
            "correct_answers",
            "total_correct_answers",
            "mock_tests_completed",
            "study_streak_days",
            "longest_streak",
            "last_activity_date",
            "badges_earned",
            "contribution_rank",
            "answers_rank",
            "accuracy_percentage",
            "last_updated",
        ]
        read_only_fields = [
            "questions_contributed",
            "questions_made_public",
            "questions_answered",
            "correct_answers",
            "total_correct_answers",
            "mock_tests_completed",
            "study_streak_days",
            "longest_streak",
            "last_activity_date",
            "badges_earned",
            "contribution_rank",
            "answers_rank",
            "accuracy_percentage",
            "last_updated",
        ]

    def get_accuracy_percentage(self, obj):
        return obj.get_accuracy_percentage()

    def get_contribution_rank(self, obj):
        if obj.questions_contributed <= 0:
            return None
        return (
            UserStatistics.objects.filter(
                questions_contributed__gt=obj.questions_contributed
            ).count()
            + 1
        )

    def get_answers_rank(self, obj):
        if obj.questions_answered <= 0:
            return None
        return (
            UserStatistics.objects.filter(
                questions_answered__gt=obj.questions_answered
            ).count()
            + 1
        )


class StudyCollectionSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(
        source="get_question_count", read_only=True
    )

    class Meta:
        model = StudyCollection
        fields = [
            "id",
            "name",
            "description",
            "is_private",
            "icon",
            "color_code",
            "question_count",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class LeaderBoardSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.profile.full_name", read_only=True)
    profile_picture = serializers.ImageField(
        source="user.profile.profile_picture", read_only=True
    )

    class Meta:
        model = LeaderBoard
        fields = [
            "rank",
            "previous_rank",
            "user_name",
            "profile_picture",
            "total_score",
            "tests_completed",
            "accuracy_percentage",
            "time_period",
            "branch",
            "sub_branch",
        ]
