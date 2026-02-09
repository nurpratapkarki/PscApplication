from rest_framework import serializers

from src.api.question_answer.serializers import QuestionSerializer
from src.models.mocktest import MockTest, MockTestQuestion


class MockTestQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = MockTestQuestion
        fields = ["id", "question", "question_order", "marks_allocated"]


class MockTestSerializer(serializers.ModelSerializer):
    test_questions = MockTestQuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    branch_name = serializers.CharField(source="branch.name_en", read_only=True)

    class Meta:
        model = MockTest
        fields = [
            "id",
            "title_en",
            "title_np",
            "slug",
            "description_en",
            "description_np",
            "test_type",
            "branch",
            "branch_name",
            "sub_branch",
            "total_questions",
            "duration_minutes",
            "use_standard_duration",
            "pass_percentage",
            "created_by",
            "created_by_name",
            "is_public",
            "is_active",
            "attempt_count",
            "test_questions",
            "created_at",
        ]
        read_only_fields = [
            "slug",
            "created_by",
            "attempt_count",
            "test_questions",
            "created_at",
        ]

    def create(self, validated_data):
        return super().create(validated_data)
