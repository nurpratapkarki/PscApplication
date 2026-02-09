from rest_framework import serializers

from src.models.question_answer import Answer, Question, QuestionReport


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = [
            "id",
            "answer_text_en",
            "answer_text_np",
            "is_correct",
            "display_order",
        ]


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, required=False)
    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    category_name = serializers.CharField(source="category.name_en", read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "question_text_en",
            "question_text_np",
            "category",
            "category_name",
            "difficulty_level",
            "question_type",
            "explanation_en",
            "explanation_np",
            "image",
            "status",
            "created_by",
            "created_by_name",
            "is_public",
            "consent_given",
            "scheduled_public_date",
            "source_reference",
            "times_attempted",
            "times_correct",
            "answers",
            "created_at",
        ]
        read_only_fields = [
            "status",
            "created_by",
            "is_public",
            "scheduled_public_date",
            "times_attempted",
            "times_correct",
            "created_at",
        ]

    def create(self, validated_data):
        answers_data = validated_data.pop("answers", [])
        question = Question.objects.create(**validated_data)
        for index, answer_data in enumerate(answers_data):
            # Auto-assign display_order if not provided
            if "display_order" not in answer_data:
                answer_data["display_order"] = index + 1
            Answer.objects.create(question=question, **answer_data)
        return question

    def update(self, instance, validated_data):
        answers_data = validated_data.pop("answers", None)
        instance = super().update(instance, validated_data)

        if answers_data is not None:
            # For simplicity, we replace all answers
            instance.answers.all().delete()
            for index, answer_data in enumerate(answers_data):
                if "display_order" not in answer_data:
                    answer_data["display_order"] = index + 1
                Answer.objects.create(question=instance, **answer_data)
        return instance


class QuestionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionReport
        fields = [
            "id",
            "question",
            "reported_by",
            "reason",
            "description",
            "status",
            "created_at",
        ]
        read_only_fields = ["reported_by", "status", "created_at"]
