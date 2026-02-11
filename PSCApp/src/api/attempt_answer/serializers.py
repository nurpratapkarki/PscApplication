from rest_framework import serializers

from src.models.attempt_answer import UserAnswer, UserAttempt


class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.SerializerMethodField()
    selected_answer_text = serializers.SerializerMethodField()
    correct_answer_text = serializers.SerializerMethodField()

    class Meta:
        model = UserAnswer
        fields = [
            "id",
            "user_attempt",
            "question",
            "question_text",
            "selected_answer",
            "selected_answer_text",
            "correct_answer_text",
            "is_correct",
            "time_taken_seconds",
            "is_skipped",
            "is_marked_for_review",
            "created_at",
        ]
        read_only_fields = ["is_correct", "created_at"]

    def get_question_text(self, obj):
        return obj.question.question_text_en if obj.question else None

    def get_selected_answer_text(self, obj):
        if obj.selected_answer:
            return obj.selected_answer.answer_text_en
        return None

    def get_correct_answer_text(self, obj):
        if obj.question:
            correct = obj.question.answers.filter(is_correct=True).first()
            if correct:
                return correct.answer_text_en
        return None


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
