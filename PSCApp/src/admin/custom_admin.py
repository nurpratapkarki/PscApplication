from django.contrib import admin
from django.utils.translation import gettext_lazy as _


class CustomAdminSite(admin.AdminSite):
    site_header = _("PSC App Administration")
    site_title = _("PSC App Admin")
    index_title = _("Management Dashboard")

    def get_app_list(self, request, app_label=None):
        app_dict = self._build_app_dict(request, app_label)

        # Define categories and their models
        categories = {
            "User Management": ["User", "UserProfile"],
            "Content Structure": ["Branch", "Category", "SubBranch"],
            "Question Bank": ["Question", "Answer", "QuestionReport"],
            "Exam & Tests": ["MockTest", "UserAttempt"],
            "Analytics & Activity": [
                "Contribution",
                "DailyActivity",
                "LeaderBoard",
                "PlatformStats",
                "StudyCollection",
                "UserProgress",
                "UserStatistics",
            ],
            "Communication": ["Notification"],
            "Settings": ["AppSettings", "TimeConfiguration"],
        }

        # Create the custom app list
        custom_app_list = []

        # Flattened models map for quick lookup
        model_map = {}
        for app in app_dict.values():
            for model in app["models"]:
                model_map[model["object_name"]] = model

        for category_name, model_names in categories.items():
            category_models = []
            for name in model_names:
                if name in model_map:
                    category_models.append(model_map[name])

            if category_models:
                custom_app_list.append(
                    {
                        "name": category_name,
                        "app_label": "src",  # Or whatever label makes sense
                        "app_url": "#",
                        "has_module_perms": True,
                        "models": category_models,
                    }
                )

        return custom_app_list


CustomAdmin = CustomAdminSite(name="custom_admin")
