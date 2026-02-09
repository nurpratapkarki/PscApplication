from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


class Branch(models.Model):
    """
    Main examination branches (e.g., Nasu, Kharidar, Engineering, Technical)
    Some branches have sub-branches, others don't
    """

    name_en = models.CharField(
        max_length=255, unique=True, help_text="Branch name in English"
    )
    name_np = models.CharField(max_length=255, help_text="Branch name in Nepali")
    slug = models.SlugField(max_length=255, unique=True)
    description_en = models.TextField(null=True, blank=True)
    description_np = models.TextField(null=True, blank=True)
    icon = models.ImageField(upload_to="branch_icons/", null=True, blank=True)
    has_sub_branches = models.BooleanField(
        default=False, help_text="Does this branch have specializations?"
    )
    display_order = models.IntegerField(
        default=0, help_text="Order for displaying in UI"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "branches"
        verbose_name = "Branch"
        verbose_name_plural = "Branches"
        ordering = ["display_order", "name_en"]

    def __str__(self):
        return self.name_en

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_en)
        super().save(*args, **kwargs)

    def get_active_sub_branches(self):
        return self.sub_branches.filter(is_active=True)

    def get_total_questions(self):
        from .question_answer import Question

        return Question.objects.filter(category__target_branch=self).count()

    def get_active_users_count(self):
        return self.target_users.filter(is_active=True).count()


class Category(models.Model):
    """
    Question categories with flexible scope (Universal/Branch/SubBranch)
    CRITICAL: Validation logic ensures proper FK relationships based on scope_type

    Examples:
    - General Knowledge: scope=UNIVERSAL, both targets null
    - Basic Engineering: scope=BRANCH, target_branch=Engineering
    - Structural Analysis: scope=SUBBRANCH, both targets required
    """

    SCOPE_CHOICES = [
        ("UNIVERSAL", "Universal - All Branches"),
        ("BRANCH", "Branch Specific"),
        ("SUBBRANCH", "Sub-Branch Specific"),
    ]

    TYPE_CHOICES = [
        ("GENERAL", "General - Common across branches"),
        ("SPECIAL", "Special - Technical/Specialized"),
    ]

    name_en = models.CharField(max_length=255)
    name_np = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description_en = models.TextField(null=True, blank=True)
    description_np = models.TextField(null=True, blank=True)
    scope_type = models.CharField(
        max_length=20,
        choices=SCOPE_CHOICES,
        help_text="Defines where this category applies",
    )
    target_branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="categories",
        help_text="Required if scope is BRANCH or SUBBRANCH",
    )
    target_sub_branch = models.ForeignKey(
        "SubBranch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="categories",
        help_text="Required only if scope is SUBBRANCH",
    )
    category_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default="GENERAL"
    )
    is_public = models.BooleanField(
        default=True, help_text="Premade categories are public"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_categories",
        help_text="null for system/admin created categories",
    )
    icon = models.ImageField(upload_to="category_icons/", null=True, blank=True)
    color_code = models.CharField(
        max_length=7,
        null=True,
        blank=True,
        help_text="Hex color for UI (e.g., #FF5733)",
    )
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["display_order", "name_en"]
        indexes = [
            models.Index(fields=["scope_type", "is_public"]),
            models.Index(fields=["target_branch", "target_sub_branch"]),
        ]

    def __str__(self):
        return f"{self.name_en} ({self.get_scope_type_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_en)
        super().save(*args, **kwargs)

    def clean(self):
        """
        Validation logic for scope-based FK requirements
        """
        if self.scope_type == "UNIVERSAL":
            if self.target_branch or self.target_sub_branch:
                raise ValidationError(
                    "Universal categories cannot have target branch or sub-branch"
                )
        elif self.scope_type == "BRANCH":
            if not self.target_branch:
                raise ValidationError(
                    "Branch-specific categories must have a target branch"
                )
            if self.target_sub_branch:
                raise ValidationError(
                    "Branch-specific categories cannot have target sub-branch"
                )
        elif self.scope_type == "SUBBRANCH":
            if not self.target_branch or not self.target_sub_branch:
                raise ValidationError(
                    "Sub-branch categories must have both target branch and sub-branch"
                )

    def get_questions(self, include_private=False):
        qs = self.questions.all()
        if not include_private:
            qs = qs.filter(status="PUBLIC")
        return qs

    def user_can_access(self, user):
        if self.is_public:
            return True
        if user.is_authenticated and (self.created_by == user or user.is_superuser):
            return True
        return False

    @staticmethod
    def get_categories_for_user(user):
        from django.db.models import Q

        if not user.is_authenticated or not hasattr(user, "profile"):
            return Category.objects.filter(scope_type="UNIVERSAL", is_active=True)

        profile = user.profile
        query = Q(scope_type="UNIVERSAL")

        if profile.target_branch:
            query |= Q(scope_type="BRANCH") & Q(target_branch=profile.target_branch)

        if profile.target_sub_branch:
            query |= Q(scope_type="SUBBRANCH") & Q(  # pyright: ignore[reportOperatorIssue]
                target_sub_branch=profile.target_sub_branch
            )

        return Category.objects.filter(query, is_active=True)


class SubBranch(models.Model):
    """
    Specializations within branches (e.g., Civil Engineering, Electrical Engineering)
    Only exists for branches where has_sub_branches=True
    """

    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="sub_branches"
    )
    name_en = models.CharField(max_length=255)
    name_np = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description_en = models.TextField(null=True, blank=True)
    description_np = models.TextField(null=True, blank=True)
    icon = models.ImageField(upload_to="subbranch_icons/", null=True, blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sub_branches"
        verbose_name = "Sub Branch"
        verbose_name_plural = "Sub Branches"
        unique_together = [["branch", "slug"]]
        ordering = ["branch", "display_order", "name_en"]

    def __str__(self):
        return f"{self.branch.name_en} - {self.name_en}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_en)
        super().save(*args, **kwargs)

    def get_total_questions(self):
        from .question_answer import Question

        return Question.objects.filter(category__target_sub_branch=self).count()
