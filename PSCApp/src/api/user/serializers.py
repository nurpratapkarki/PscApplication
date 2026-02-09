from rest_framework import serializers

from src.models.user import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    experience_points = serializers.IntegerField(read_only=True)
    total_contributions = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "full_name",
            "email",
            "profile_picture",
            "phone_number",
            "preferred_language",
            "target_branch",
            "target_sub_branch",
            "experience_points",
            "level",
            "total_contributions",
            "profile_picture",
            "is_active",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "email",
            "experience_points",
            "level",
            "total_contributions",
            "date_joined",
        ]
