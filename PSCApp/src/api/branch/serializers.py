from rest_framework import serializers

from src.models.branch import Branch, Category, SubBranch


class SubBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubBranch
        fields = [
            "id",
            "branch",
            "name_en",
            "name_np",
            "slug",
            "description_en",
            "description_np",
            "icon",
            "display_order",
            "is_active",
        ]
        read_only_fields = ["slug"]


class BranchSerializer(serializers.ModelSerializer):
    sub_branches = SubBranchSerializer(many=True, read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id",
            "name_en",
            "name_np",
            "slug",
            "description_en",
            "description_np",
            "icon",
            "has_sub_branches",
            "sub_branches",
            "display_order",
            "is_active",
        ]
        read_only_fields = ["slug"]


class CategorySerializer(serializers.ModelSerializer):
    target_branch_name = serializers.CharField(
        source="target_branch.name_en", read_only=True
    )
    target_sub_branch_name = serializers.CharField(
        source="target_sub_branch.name_en", read_only=True
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "name_en",
            "name_np",
            "slug",
            "description_en",
            "description_np",
            "scope_type",
            "target_branch",
            "target_branch_name",
            "target_sub_branch",
            "target_sub_branch_name",
            "category_type",
            "is_public",
            "created_by",
            "icon",
            "color_code",
            "display_order",
            "is_active",
        ]
        read_only_fields = ["slug", "created_by"]

    def validate(self, data):
        # Call model's clean method or replicate logic
        instance = Category(**data)
        instance.clean()
        return data
