from django.db import models

from src.models.branch import Branch, Category, SubBranch


class TimeConfiguration(models.Model):
    """
    Stores official PSC exam timing patterns
    Used when MockTest.use_standard_duration=True
    """

    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="time_configs"
    )
    sub_branch = models.ForeignKey(
        SubBranch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="time_configs",
        help_text="Branch-wide or sub-branch specific timing",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="time_configs",
        help_text="Specific category timing (e.g., IQ gets more time)",
    )
    standard_duration_minutes = models.IntegerField(
        help_text="Official time limit in minutes"
    )
    questions_count = models.IntegerField(
        help_text="Standard number of questions for this configuration"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Context about this configuration (e.g., 'PSC 2078 Pattern')",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "time_configurations"
        verbose_name = "Time Configuration"
        verbose_name_plural = "Time Configurations"
        ordering = ["branch", "sub_branch", "category"]
        indexes = [
            models.Index(fields=["branch", "is_active"]),
            models.Index(fields=["sub_branch", "is_active"]),
        ]

    def __str__(self):
        parts = [self.branch.name_en]
        if self.sub_branch:
            parts.append(self.sub_branch.name_en)
        if self.category:
            parts.append(self.category.name_en)
        return f"{' > '.join(parts)} - {self.standard_duration_minutes}min"

    @staticmethod
    def get_config_for_test(branch, sub_branch=None, category=None):
        # Specificity order:
        # 1. Branch + SubBranch + Category
        # 2. Branch + SubBranch
        # 3. Branch + Category
        # 4. Branch only

        configs = TimeConfiguration.objects.filter(branch=branch, is_active=True)

        # Try finding most specific match
        if sub_branch and category:
            match = configs.filter(sub_branch=sub_branch, category=category).first()
            if match:
                return match

        if sub_branch:
            match = configs.filter(sub_branch=sub_branch, category__isnull=True).first()
            if match:
                return match

        if category:
            match = configs.filter(category=category, sub_branch__isnull=True).first()
            if match:
                return match

        # Fallback to general branch config
        return configs.filter(sub_branch__isnull=True, category__isnull=True).first()
