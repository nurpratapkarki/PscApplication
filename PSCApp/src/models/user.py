from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    """
    Extended user profile for PSC exam preparation tracking
    Links to Django's built-in User model (Google OAuth)
    """

    LANGUAGE_CHOICES = [
        ("EN", "English"),
        ("NP", "Nepali"),
    ]

    google_auth_user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", null=True, blank=True
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=15, null=True, blank=True, help_text="Optional contact number"
    )
    preferred_language = models.CharField(
        max_length=2, choices=LANGUAGE_CHOICES, default="EN"
    )
    target_branch = models.ForeignKey(
        "Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="target_users",
        help_text="What branch they're preparing for",
    )
    target_sub_branch = models.ForeignKey(
        "SubBranch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="target_users",
        help_text="Specific specialization within branch",
    )
    experience_points = models.IntegerField(
        default=0, help_text="Points earned through contributions and practice"
    )
    level = models.IntegerField(
        default=1, help_text="Calculated from experience points"
    )
    total_contributions = models.IntegerField(
        default=0, help_text="Total questions contributed by user"
    )
    total_questions_attempted = models.IntegerField(default=0)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["target_branch", "target_sub_branch"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    def calculate_level(self):
        # Simple progression: 100 XP per level
        return 1 + (self.experience_points // 100)

    def award_experience_points(self, points, reason=None):
        self.experience_points += points
        self.level = self.calculate_level()
        self.save(update_fields=["experience_points", "level"])

    def get_current_rank(self, time_period="ALL_TIME"):
        # Currently only supporting ALL_TIME based on total experience_points
        # For specific time periods, we would need to aggregate UserStats/DailyActivity
        if time_period == "ALL_TIME":
            return (
                UserProfile.objects.filter(
                    experience_points__gt=self.experience_points, is_active=True
                ).count()
                + 1
            )
        return None
