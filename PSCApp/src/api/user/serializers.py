from rest_framework import serializers

from src.models.user import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    experience_points = serializers.IntegerField(read_only=True)
    total_contributions = serializers.IntegerField(read_only=True)
    branch_name = serializers.SerializerMethodField()
    sub_branch_name = serializers.SerializerMethodField()

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
            "is_active",
            "date_joined",
            "branch_name",
            "sub_branch_name",
        ]
        read_only_fields = [
            "id",
            "email",
            "experience_points",
            "level",
            "total_contributions",
            "date_joined",
        ]

    def get_branch_name(self, obj):
        if obj.target_branch:
            return obj.target_branch.name_en
        return None

    def get_sub_branch_name(self, obj):
        if obj.target_sub_branch:
            return obj.target_sub_branch.name_en
        return None
