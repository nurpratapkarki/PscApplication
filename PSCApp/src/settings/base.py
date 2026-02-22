"""
generated with djinit
Common settings shared between development and production environment
"""

from datetime import timedelta
from pathlib import Path

import environ
from celery.schedules import crontab

env = environ.Env()
environ.Env.read_env()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/


# Application definition
THIRD_PARTY_APPS = [
    "channels",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth.socialaccount.providers.google",
]

USER_DEFINED_APPS = [
    "src.apps.SrcConfig",
]

BUILT_IN_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

INSTALLED_APPS = BUILT_IN_APPS + THIRD_PARTY_APPS + USER_DEFINED_APPS
INSTALLED_APPS.insert(0, "jazzmin")

# Jazzmin Admin Theme Settings
JAZZMIN_SETTINGS = {
    # Title of the window (Will default to current_admin_site.site_title)
    "site_title": "PSC App Admin",
    # Title on the brand (Will default to current_admin_site.site_header)
    "site_header": "PSC App",
    # Logo to use for your site
    "site_logo": None,
    # Welcome text on the login screen
    "welcome_sign": "Welcome to PSC Exam Preparation Admin",
    # Copyright on the footer
    "copyright": "PSC Exam Prep Platform",
    # List of model admins to search from the search bar
    "search_model": ["auth.User", "src.Question", "src.Contribution", "src.Note"],
    # Field name on user model that contains avatar
    "user_avatar": None,
    #############
    # Top Menu #
    #############
    # Links to put along the top menu
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Dashboard", "url": "/dashboard/", "new_window": False},
        {"app": "src"},
    ],
    #############
    # Side Menu #
    #############
    # Whether to display the side menu
    "show_sidebar": True,
    # Whether to auto expand the menu
    "navigation_expanded": True,
    # Custom links to append to app groups
    "custom_links": {
        "src": [
            {
                "name": "Dashboard",
                "url": "/dashboard/",
                "icon": "fas fa-chart-line",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "Contributions",
                "url": "/dashboard/contributions/",
                "icon": "fas fa-file-alt",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "Questions Manager",
                "url": "/dashboard/questions/",
                "icon": "fas fa-question-circle",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "Notes Review",
                "url": "/dashboard/notes/",
                "icon": "fas fa-book-open",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "Question Reports",
                "url": "/dashboard/reports/",
                "icon": "fas fa-flag",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "Mock Tests",
                "url": "/dashboard/mock-tests/",
                "icon": "fas fa-clipboard-list",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "User Management",
                "url": "/dashboard/users/",
                "icon": "fas fa-users",
                "permissions": ["auth.view_user"],
            },
        ],
    },
    # Custom icons for side menu apps/models
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "src.Question": "fas fa-question-circle",
        "src.Answer": "fas fa-check-circle",
        "src.QuestionReport": "fas fa-flag",
        "src.Note": "fas fa-book-open",
        "src.Branch": "fas fa-sitemap",
        "src.Category": "fas fa-folder",
        "src.SubBranch": "fas fa-folder-open",
        "src.MockTest": "fas fa-clipboard-list",
        "src.UserAttempt": "fas fa-edit",
        "src.UserAnswer": "fas fa-check-double",
        "src.Contribution": "fas fa-file-alt",
        "src.DailyActivity": "fas fa-calendar-day",
        "src.LeaderBoard": "fas fa-trophy",
        "src.PlatformStats": "fas fa-chart-bar",
        "src.StudyCollection": "fas fa-bookmark",
        "src.UserProgress": "fas fa-chart-line",
        "src.UserStatistics": "fas fa-user-chart",
        "src.Notification": "fas fa-bell",
        "src.AppSettings": "fas fa-cog",
        "src.TimeConfiguration": "fas fa-clock",
        "src.UserProfile": "fas fa-id-card",
    },
    # Default icon classes
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    #############
    # UI Tweaks #
    #############
    # Relative paths to custom CSS/JS scripts (must be present in static files)
    "custom_css": None,
    "custom_js": None,
    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,
    ###############
    # Change view #
    ###############
    # Render out the change view as a single form, or in tabs
    "changeform_format": "horizontal_tabs",
    # Override change forms on a per modeladmin basis
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
}

# Jazzmin UI Tweaks
JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark navbar-primary",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}

# django.contrib.sites
SITE_ID = 1

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "src.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "src" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "src.wsgi.application"
ASGI_APPLICATION = "src.asgi.application"

CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kathmandu"
USE_I18N = True
USE_TZ = True

# Static files and media files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework Settings
REST_FRAMEWORK = {
    # "DEFAULT_RENDERER_CLASSES": [
    # "rest_framework.renderers.JSONRenderer",
    # ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "120/minute",
    },
}

# DRF Spectacular settings
SPECTACULAR_SETTINGS = {
    "TITLE": "src API",
    "DESCRIPTION": "API documentation for src",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/",
}

# JWT Settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=3),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# CORS Settings
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours
# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Celery Configuration
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE


CELERY_BEAT_SCHEDULE = {
    "update-platform-stats-hourly": {
        "task": "src.tasks.update_platform_stats",
        "schedule": crontab(minute=0),
    },
    "create-daily-activity-midnight": {
        "task": "src.tasks.create_daily_activity",
        "schedule": crontab(hour=0, minute=0),
    },
    "update-user-streaks-midnight": {
        "task": "src.tasks.update_user_streaks",
        "schedule": crontab(hour=0, minute=5),
    },
    "check-streak-notifications-daily": {
        "task": "src.tasks.check_streak_notifications",
        "schedule": crontab(hour=18, minute=0),  # e.g., 6 PM
    },
    "recalculate-rankings-weekly": {
        "task": "src.tasks.recalculate_rankings",
        "schedule": crontab(hour=2, minute=0, day_of_week=1),  # Weekly on Monday
    },
    "send-weekly-summary": {
        "task": "src.tasks.send_weekly_summary",
        "schedule": crontab(hour=9, minute=0, day_of_week=0),  # Sunday morning
    },
    "process-monthly-publications": {
        "task": "src.tasks.process_publications",
        "schedule": crontab(day_of_month=1, hour=3, minute=0),
    },
    "monthly-maintenance": {
        "task": "src.tasks.monthly_maintenance",
        "schedule": crontab(day_of_month=1, hour=4, minute=0),
    },
    "send-daily-reminder-evening": {
        "task": "src.tasks.send_daily_reminder",
        "schedule": crontab(hour=19, minute=30),  # 7:30 PM daily
    },
}


# Logging configuration (overridden in production.py)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "src": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}


## Django-AllAuth
ACCOUNT_LOGIN_METHODS = {"email"}  # Use Email / Password authentication
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_SIGNUP_FIELDS = ["email"]  # Passwords are handled automatically
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False

# dj-rest-auth settings
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": "psc-auth",
    "JWT_AUTH_REFRESH_COOKIE": "psc-refresh-token",
    "JWT_AUTH_HTTPONLY": False,  # Allow JS access to tokens
    "SESSION_LOGIN": False,  # Disable session login for API
}
# Authenticate if local account with this email address already exists
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
# Connect local account and social account if local account with that email address already exists
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
# Social Account Providers
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": env("GOOGLE_CLIENT_ID", default=""),
            "secret": env("GOOGLE_SECRET", default=""),
            "key": "",
        },
        "SCOPE": [
            "profile",
            "email",
        ],
        "AUTH_PARAMS": {
            "access_type": "online",
        },
    }
}
