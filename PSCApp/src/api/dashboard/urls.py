"""Dashboard URL configuration."""

from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    # Main dashboard
    path("", views.dashboard_index, name="index"),
    # Contributions
    path("contributions/", views.contributions_list, name="contributions"),
    path("notes/", views.notes_list, name="notes"),
    path("note/<int:pk>/", views.note_detail, name="note_detail"),
    path("note/<int:pk>/approve/", views.approve_note, name="approve_note"),
    path("note/<int:pk>/reject/", views.reject_note, name="reject_note"),
    path(
        "contribution/<int:pk>/",
        views.contribution_detail,
        name="contribution_detail",
    ),
    path(
        "contribution/<int:pk>/approve/",
        views.approve_contribution,
        name="approve_contribution",
    ),
    path(
        "contribution/reject/",
        views.reject_contribution,
        name="reject_contribution",
    ),
    path(
        "contribution/<int:pk>/make-public/",
        views.make_public,
        name="make_public",
    ),
    path(
        "contribution/<int:pk>/feature/",
        views.feature_contribution,
        name="feature_contribution",
    ),
    # Questions
    path("questions/", views.questions_list, name="questions"),
    path("question/<int:pk>/", views.question_detail, name="question_detail"),
    path(
        "question/<int:pk>/publish/",
        views.publish_question,
        name="publish_question",
    ),
    path(
        "question/<int:pk>/verify/",
        views.verify_question,
        name="verify_question",
    ),
    path(
        "question/<int:pk>/check-duplicate/",
        views.check_duplicate,
        name="check_duplicate",
    ),
    # Reports
    path("reports/", views.reports_list, name="reports"),
    path(
        "report/<int:pk>/resolve/",
        views.resolve_report,
        name="resolve_report",
    ),
    # Bulk Actions
    path(
        "bulk/contributions/approve/",
        views.bulk_approve_contributions,
        name="bulk_approve_contributions",
    ),
    path(
        "bulk/contributions/reject/",
        views.bulk_reject_contributions,
        name="bulk_reject_contributions",
    ),
    path(
        "bulk/contributions/make-public/",
        views.bulk_make_public,
        name="bulk_make_public",
    ),
    path(
        "bulk/reports/resolve/",
        views.bulk_resolve_reports,
        name="bulk_resolve_reports",
    ),
    path(
        "bulk/questions/publish/",
        views.bulk_publish_questions,
        name="bulk_publish_questions",
    ),
    # Mock Tests
    path("mock-tests/", views.mock_tests_list, name="mock_tests"),
    path(
        "mock-test/<int:pk>/",
        views.mock_test_detail,
        name="mock_test_detail",
    ),
    path(
        "mock-test/create/",
        views.create_mock_test,
        name="create_mock_test",
    ),
    path(
        "mock-test/<int:pk>/toggle-active/",
        views.toggle_mock_test_active,
        name="toggle_mock_test_active",
    ),
    # Users
    path("users/", views.users_list, name="users"),
    path("user/<int:pk>/", views.user_detail, name="user_detail"),
    path(
        "user/<int:pk>/toggle-staff/",
        views.toggle_user_staff,
        name="toggle_user_staff",
    ),
    # CSV Exports
    path(
        "export/contributions/",
        views.export_contributions_csv,
        name="export_contributions",
    ),
    path(
        "export/questions/",
        views.export_questions_csv,
        name="export_questions",
    ),
    path(
        "export/reports/",
        views.export_reports_csv,
        name="export_reports",
    ),
]
