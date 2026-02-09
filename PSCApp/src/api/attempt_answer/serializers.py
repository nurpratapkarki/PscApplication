from rest_framework import serializers

from src.models.attempt_answer import UserAnswer, UserAttempt


class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = [
            "id",
            "user_attempt",
            "question",
            "selected_answer",
            "is_correct",
            "time_taken_seconds",
            "is_skipped",
            "is_marked_for_review",
            "created_at",
        ]
        read_only_fields = ["is_correct", "created_at"]


class UserAttemptSerializer(serializers.ModelSerializer):
    mock_test_title = serializers.CharField(source="mock_test.title_en", read_only=True)
    user_answers = UserAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = UserAttempt
        fields = [
            "id",
            "user",
            "mock_test",
            "mock_test_title",
            "start_time",
            "end_time",
            "total_time_taken",
            "score_obtained",
            "total_score",
            "percentage",
            "status",
            "mode",
            "user_answers",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "start_time",
            "end_time",
            "total_time_taken",
            "score_obtained",
            "total_score",
            "percentage",
            "status",
            "user_answers",
            "created_at",
        ]


class StartAttemptSerializer(serializers.Serializer):
    mock_test_id = serializers.IntegerField(required=False)
    mode = serializers.ChoiceField(
        choices=UserAttempt.MODE_CHOICES, default="MOCK_TEST"
    )
