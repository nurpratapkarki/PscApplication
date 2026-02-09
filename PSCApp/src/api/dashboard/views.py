"""
Dashboard views for managing contributions, questions, and platform analytics.
Provides a custom admin-like interface for moderation and monitoring.
"""

import csv
import json
import logging
from datetime import timedelta

from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from src.models import (
    Category,
    Contribution,
    DailyActivity,
    Notification,
    PlatformStats,
    Question,
    QuestionReport,
)

logger = logging.getLogger(__name__)

# PlatformStats uses singleton pattern with ID 1
PLATFORM_STATS_SINGLETON_ID = 1

# CSV export string length limits
CSV_QUESTION_TEXT_LIMIT = 200
CSV_SHORT_TEXT_LIMIT = 100


@staff_member_required
def dashboard_index(request):
    """Main dashboard view with platform statistics and recent activity."""
    # Get or create platform stats (singleton pattern)
    stats, _ = PlatformStats.objects.get_or_create(id=PLATFORM_STATS_SINGLETON_ID)

    # Recent contributions
    recent_contributions = Contribution.objects.select_related(
        "user", "question"
    ).order_by("-created_at")[:5]

    # Recent reports
    recent_reports = QuestionReport.objects.select_related(
        "question", "reported_by"
    ).order_by("-created_at")[:5]

    # Activity data for chart (last 7 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=6)
    activities = DailyActivity.objects.filter(
        date__range=[start_date, end_date]
    ).order_by("date")

    activity_data = {
        "labels": [],
        "new_users": [],
        "questions_added": [],
        "tests_taken": [],
    }

    # Build date range with zeros for missing days
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current)
        current += timedelta(days=1)

    existing_dates = {a.date: a for a in activities}

    for d in all_dates:
        activity_data["labels"].append(d.strftime("%b %d"))
        if d in existing_dates:
            a = existing_dates[d]
            activity_data["new_users"].append(a.new_users)
            activity_data["questions_added"].append(a.questions_added)
            activity_data["tests_taken"].append(a.mock_tests_taken)
        else:
            activity_data["new_users"].append(0)
            activity_data["questions_added"].append(0)
            activity_data["tests_taken"].append(0)

    return render(
        request,
        "dashboard/index.html",
        {
            "stats": stats,
            "recent_contributions": recent_contributions,
            "recent_reports": recent_reports,
            "activity_data": json.dumps(activity_data),
        },
    )


@staff_member_required
def contributions_list(request):
    """List and filter contributions."""
    contributions = Contribution.objects.select_related(
        "user", "question", "question__category"
    ).order_by("-created_at")

    # Apply filters
    status = request.GET.get("status")
    month = request.GET.get("month")
    year = request.GET.get("year")

    if status:
        contributions = contributions.filter(status=status)
    if month:
        contributions = contributions.filter(contribution_month=int(month))
    if year:
        contributions = contributions.filter(contribution_year=int(year))

    # Get counts for stats
    pending_count = Contribution.objects.filter(status="PENDING").count()
    approved_count = Contribution.objects.filter(status="APPROVED").count()
    rejected_count = Contribution.objects.filter(status="REJECTED").count()
    public_count = Contribution.objects.filter(status="MADE_PUBLIC").count()

    # Pagination
    paginator = Paginator(contributions, 20)
    page = request.GET.get("page", 1)
    contributions = paginator.get_page(page)

    # Month and year choices
    current_year = timezone.now().year
    year_choices = list(range(current_year - 2, current_year + 1))
    month_choices = list(range(1, 13))

    return render(
        request,
        "dashboard/contributions.html",
        {
            "contributions": contributions,
            "pending_count": pending_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "public_count": public_count,
            "year_choices": year_choices,
            "month_choices": month_choices,
        },
    )


@staff_member_required
def contribution_detail(request, pk):
    """View contribution details."""
    contribution = get_object_or_404(
        Contribution.objects.select_related(
            "user", "user__profile", "question", "question__category"
        ).prefetch_related("question__answers"),
        pk=pk,
    )
    return render(
        request, "dashboard/contribution_detail.html", {"contribution": contribution}
    )


@staff_member_required
@require_POST
def approve_contribution(request, pk):
    """Approve a contribution."""
    contribution = get_object_or_404(Contribution, pk=pk)
    contribution.approve_contribution()

    # Create notification for contributor
    Notification.objects.create(
        user=contribution.user,
        notification_type="CONTRIBUTION_APPROVED",
        title_en="Contribution Approved!",
        title_np="योगदान स्वीकृत भयो!",
        message_en="Your question has been approved and will be made public soon.",
        message_np="तपाईंको प्रश्न स्वीकृत भएको छ र चाँडै सार्वजनिक गरिनेछ।",
        related_question=contribution.question,
    )

    messages.success(request, f"Contribution #{pk} has been approved.")
    return redirect("dashboard:contribution_detail", pk=pk)


@staff_member_required
@require_POST
def reject_contribution(request):
    """Reject a contribution with reason."""
    contribution_id = request.POST.get("contribution_id")
    rejection_reason = request.POST.get("rejection_reason", "")

    contribution = get_object_or_404(Contribution, pk=contribution_id)
    contribution.reject_contribution(rejection_reason)

    # Notify contributor
    Notification.objects.create(
        user=contribution.user,
        notification_type="GENERAL",
        title_en="Contribution Not Approved",
        title_np="योगदान स्वीकृत भएन",
        message_en=f"Your question was not approved. Reason: {rejection_reason}",
        message_np=f"तपाईंको प्रश्न स्वीकृत भएन। कारण: {rejection_reason}",
        related_question=contribution.question,
    )

    messages.warning(request, f"Contribution #{contribution_id} has been rejected.")
    return redirect("dashboard:contributions")


@staff_member_required
@require_POST
def make_public(request, pk):
    """Make an approved contribution public immediately."""
    contribution = get_object_or_404(Contribution, pk=pk)
    contribution.make_public()

    # Notify contributor
    Notification.objects.create(
        user=contribution.user,
        notification_type="QUESTION_PUBLIC",
        title_en="Your Question is Now Public!",
        title_np="तपाईंको प्रश्न अब सार्वजनिक छ!",
        message_en="Congratulations! Your contributed question is now available.",
        message_np="बधाई छ! तपाईंको योगदान गरिएको प्रश्न अब उपलब्ध छ।",
        related_question=contribution.question,
    )

    messages.success(request, f"Contribution #{pk} has been made public.")
    return redirect("dashboard:contribution_detail", pk=pk)


@staff_member_required
@require_POST
def feature_contribution(request, pk):
    """Feature a contribution for social media shoutout."""
    contribution = get_object_or_404(Contribution, pk=pk)
    contribution.feature_for_social()
    messages.success(request, f"Contribution #{pk} has been featured for shoutout.")
    return redirect("dashboard:contribution_detail", pk=pk)


@staff_member_required
def questions_list(request):
    """List and filter questions."""
    questions = Question.objects.select_related("category", "created_by").order_by(
        "-created_at"
    )

    # Apply filters
    status = request.GET.get("status")
    category = request.GET.get("category")
    difficulty = request.GET.get("difficulty")
    search = request.GET.get("search")

    if status:
        questions = questions.filter(status=status)
    if category:
        questions = questions.filter(category_id=int(category))
    if difficulty:
        questions = questions.filter(difficulty_level=difficulty)
    if search:
        questions = questions.filter(
            Q(question_text_en__icontains=search)
            | Q(question_text_np__icontains=search)
        )

    # Get counts
    public_count = Question.objects.filter(status="PUBLIC").count()
    pending_count = Question.objects.filter(status="PENDING_REVIEW").count()
    draft_count = Question.objects.filter(status="DRAFT").count()
    reported_count = Question.objects.filter(reported_count__gt=0).count()

    # Get categories for filter dropdown
    categories = Category.objects.filter(is_active=True).order_by("name_en")

    # Pagination
    paginator = Paginator(questions, 20)
    page = request.GET.get("page", 1)
    questions = paginator.get_page(page)

    return render(
        request,
        "dashboard/questions.html",
        {
            "questions": questions,
            "categories": categories,
            "public_count": public_count,
            "pending_count": pending_count,
            "draft_count": draft_count,
            "reported_count": reported_count,
        },
    )


@staff_member_required
def question_detail(request, pk):
    """View question details."""
    question = get_object_or_404(
        Question.objects.select_related("category", "created_by").prefetch_related(
            "answers"
        ),
        pk=pk,
    )
    reports = question.reports.select_related("reported_by").order_by("-created_at")

    return render(
        request,
        "dashboard/question_detail.html",
        {"question": question, "reports": reports},
    )


@staff_member_required
@require_POST
def publish_question(request, pk):
    """Make a question public."""
    question = get_object_or_404(Question, pk=pk)
    question.status = "PUBLIC"
    question.is_public = True
    question.save(update_fields=["status", "is_public"])

    messages.success(request, f"Question #{pk} is now public.")
    return redirect("dashboard:question_detail", pk=pk)


@staff_member_required
@require_POST
def verify_question(request, pk):
    """Mark a question as verified."""
    question = get_object_or_404(Question, pk=pk)
    question.is_verified = True
    question.save(update_fields=["is_verified"])

    messages.success(request, f"Question #{pk} has been verified.")
    return redirect("dashboard:question_detail", pk=pk)


@staff_member_required
def check_duplicate(request, pk):
    """Check for duplicate questions."""
    question = get_object_or_404(Question, pk=pk)

    # Find potential duplicates
    duplicates = []
    has_exact_match = False

    # Check exact match
    exact_matches = Question.objects.filter(
        Q(question_text_en__iexact=question.question_text_en)
        | Q(question_text_np__iexact=question.question_text_np)
    ).exclude(id=question.id)

    for match in exact_matches:
        duplicates.append({"question": match, "similarity": "exact", "score": 100})
        has_exact_match = True

    # Check partial matches (simple word overlap)
    words = set(question.question_text_en.lower().split())
    similar_questions = (
        Question.objects.filter(category=question.category)
        .exclude(id=question.id)[:100]
    )

    for similar in similar_questions:
        if similar.id in [d["question"].id for d in duplicates]:
            continue
        similar_words = set(similar.question_text_en.lower().split())
        if words and similar_words:
            overlap = len(words & similar_words) / max(len(words), len(similar_words))
            if overlap > 0.5:
                score = int(overlap * 100)
                similarity = "high" if overlap > 0.7 else "medium"
                duplicates.append(
                    {"question": similar, "similarity": similarity, "score": score}
                )

    # Sort by score
    duplicates.sort(key=lambda x: x["score"], reverse=True)
    duplicates = duplicates[:10]  # Limit to top 10

    return render(
        request,
        "dashboard/check_duplicate.html",
        {
            "question": question,
            "duplicates": duplicates,
            "has_exact_match": has_exact_match,
        },
    )


@staff_member_required
def reports_list(request):
    """List and filter question reports."""
    reports = QuestionReport.objects.select_related(
        "question", "reported_by", "reviewed_by"
    ).order_by("-created_at")

    # Apply filters
    status = request.GET.get("status")
    reason = request.GET.get("reason")
    search = request.GET.get("search")

    if status:
        reports = reports.filter(status=status)
    if reason:
        reports = reports.filter(reason=reason)
    if search:
        reports = reports.filter(
            Q(description__icontains=search)
            | Q(question__question_text_en__icontains=search)
        )

    # Get counts
    pending_count = QuestionReport.objects.filter(status="PENDING").count()
    under_review_count = QuestionReport.objects.filter(status="UNDER_REVIEW").count()
    resolved_count = QuestionReport.objects.filter(status="RESOLVED").count()
    high_priority_count = Question.objects.filter(reported_count__gte=3).count()

    # Pagination
    paginator = Paginator(reports, 20)
    page = request.GET.get("page", 1)
    reports = paginator.get_page(page)

    return render(
        request,
        "dashboard/reports.html",
        {
            "reports": reports,
            "pending_count": pending_count,
            "under_review_count": under_review_count,
            "resolved_count": resolved_count,
            "high_priority_count": high_priority_count,
        },
    )


@staff_member_required
@require_POST
def resolve_report(request, pk):
    """Resolve a question report."""
    report = get_object_or_404(QuestionReport, pk=pk)
    admin_notes = request.POST.get("admin_notes", "Resolved via dashboard.")

    report.resolve_report(request.user, admin_notes)
    report.notify_creator()

    messages.success(request, f"Report #{pk} has been resolved.")

    # Redirect back to referring page or reports list
    next_url = request.META.get("HTTP_REFERER", None)
    if next_url:
        return redirect(next_url)
    return redirect("dashboard:reports")


# =============================================================================
# BULK ACTIONS
# =============================================================================


@staff_member_required
@require_POST
def bulk_approve_contributions(request):
    """Approve multiple contributions at once."""
    contribution_ids = request.POST.getlist("contribution_ids")
    if not contribution_ids:
        messages.error(request, "No contributions selected.")
        return redirect("dashboard:contributions")

    # Convert to integers and filter valid IDs
    valid_ids = []
    for cid in contribution_ids:
        try:
            valid_ids.append(int(cid))
        except (ValueError, TypeError):
            logger.warning("Invalid contribution ID: %s", cid)

    # Fetch all contributions in a single query
    contributions = Contribution.objects.filter(
        pk__in=valid_ids, status="PENDING"
    ).select_related("user", "question")

    approved_count = 0
    notifications_to_create = []

    for contribution in contributions:
        contribution.approve_contribution()
        notifications_to_create.append(
            Notification(
                user=contribution.user,
                notification_type="CONTRIBUTION_APPROVED",
                title_en="Contribution Approved!",
                title_np="योगदान स्वीकृत भयो!",
                message_en="Your question has been approved.",
                message_np="तपाईंको प्रश्न स्वीकृत भएको छ।",
                related_question=contribution.question,
            )
        )
        approved_count += 1

    # Bulk create notifications
    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)

    messages.success(request, f"{approved_count} contributions have been approved.")
    return redirect("dashboard:contributions")


@staff_member_required
@require_POST
def bulk_reject_contributions(request):
    """Reject multiple contributions at once."""
    contribution_ids = request.POST.getlist("contribution_ids")
    rejection_reason = request.POST.get(
        "rejection_reason", "Did not meet quality standards."
    )

    if not contribution_ids:
        messages.error(request, "No contributions selected.")
        return redirect("dashboard:contributions")

    # Convert to integers
    valid_ids = []
    for cid in contribution_ids:
        try:
            valid_ids.append(int(cid))
        except (ValueError, TypeError):
            logger.warning("Invalid contribution ID: %s", cid)

    # Fetch all contributions in a single query
    contributions = Contribution.objects.filter(
        pk__in=valid_ids, status="PENDING"
    ).select_related("user", "question")

    rejected_count = 0
    notifications_to_create = []

    for contribution in contributions:
        contribution.reject_contribution(rejection_reason)
        notifications_to_create.append(
            Notification(
                user=contribution.user,
                notification_type="GENERAL",
                title_en="Contribution Not Approved",
                title_np="योगदान स्वीकृत भएन",
                message_en=f"Your question was not approved. Reason: {rejection_reason}",
                message_np=f"तपाईंको प्रश्न स्वीकृत भएन। कारण: {rejection_reason}",
                related_question=contribution.question,
            )
        )
        rejected_count += 1

    # Bulk create notifications
    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)

    messages.warning(request, f"{rejected_count} contributions have been rejected.")
    return redirect("dashboard:contributions")


@staff_member_required
@require_POST
def bulk_make_public(request):
    """Make multiple approved contributions public at once."""
    contribution_ids = request.POST.getlist("contribution_ids")

    if not contribution_ids:
        messages.error(request, "No contributions selected.")
        return redirect("dashboard:contributions")

    # Convert to integers
    valid_ids = []
    for cid in contribution_ids:
        try:
            valid_ids.append(int(cid))
        except (ValueError, TypeError):
            logger.warning("Invalid contribution ID: %s", cid)

    # Fetch all contributions in a single query
    contributions = Contribution.objects.filter(
        pk__in=valid_ids, status="APPROVED"
    ).select_related("user", "question")

    public_count = 0
    notifications_to_create = []

    for contribution in contributions:
        contribution.make_public()
        notifications_to_create.append(
            Notification(
                user=contribution.user,
                notification_type="QUESTION_PUBLIC",
                title_en="Your Question is Now Public!",
                title_np="तपाईंको प्रश्न अब सार्वजनिक छ!",
                message_en="Congratulations! Your contributed question is now available.",
                message_np="बधाई छ! तपाईंको योगदान गरिएको प्रश्न अब उपलब्ध छ।",
                related_question=contribution.question,
            )
        )
        public_count += 1

    # Bulk create notifications
    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)

    messages.success(request, f"{public_count} contributions have been made public.")
    return redirect("dashboard:contributions")


@staff_member_required
@require_POST
def bulk_resolve_reports(request):
    """Resolve multiple reports at once."""
    report_ids = request.POST.getlist("report_ids")
    admin_notes = request.POST.get("admin_notes", "Bulk resolved via dashboard.")

    if not report_ids:
        messages.error(request, "No reports selected.")
        return redirect("dashboard:reports")

    # Convert to integers
    valid_ids = []
    for rid in report_ids:
        try:
            valid_ids.append(int(rid))
        except (ValueError, TypeError):
            logger.warning("Invalid report ID: %s", rid)

    # Fetch all reports in a single query (excluding already resolved)
    reports = QuestionReport.objects.filter(pk__in=valid_ids).exclude(
        status="RESOLVED"
    )

    resolved_count = 0
    for report in reports:
        report.resolve_report(request.user, admin_notes)
        report.notify_creator()
        resolved_count += 1

    messages.success(request, f"{resolved_count} reports have been resolved.")
    return redirect("dashboard:reports")


@staff_member_required
@require_POST
def bulk_publish_questions(request):
    """Publish multiple questions at once."""
    question_ids = request.POST.getlist("question_ids")

    if not question_ids:
        messages.error(request, "No questions selected.")
        return redirect("dashboard:questions")

    # Convert to integers
    valid_ids = []
    for qid in question_ids:
        try:
            valid_ids.append(int(qid))
        except (ValueError, TypeError):
            logger.warning("Invalid question ID: %s", qid)

    # Use bulk update for better performance
    published_count = Question.objects.filter(pk__in=valid_ids).exclude(
        status="PUBLIC"
    ).update(status="PUBLIC", is_public=True)

    messages.success(request, f"{published_count} questions have been published.")
    return redirect("dashboard:questions")


# =============================================================================
# EXPORT FUNCTIONS
# =============================================================================


@staff_member_required
def export_contributions_csv(request):
    """Export contributions to CSV file."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        'attachment; filename="contributions_export.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(
        [
            "ID",
            "Contributor",
            "Email",
            "Question ID",
            "Question (EN)",
            "Category",
            "Status",
            "Month",
            "Year",
            "Is Featured",
            "Created At",
            "Approval Date",
            "Public Date",
            "Rejection Reason",
        ]
    )

    contributions = Contribution.objects.select_related(
        "user", "question", "question__category"
    ).order_by("-created_at")

    # Apply filters from request
    status = request.GET.get("status")
    month = request.GET.get("month")
    year = request.GET.get("year")

    if status:
        contributions = contributions.filter(status=status)
    if month:
        contributions = contributions.filter(contribution_month=int(month))
    if year:
        contributions = contributions.filter(contribution_year=int(year))

    for contrib in contributions:
        writer.writerow(
            [
                contrib.id,
                contrib.user.username,
                contrib.user.email,
                contrib.question.id,
                contrib.question.question_text_en[:CSV_SHORT_TEXT_LIMIT],
                contrib.question.category.name_en if contrib.question.category else "",
                contrib.status,
                contrib.contribution_month,
                contrib.contribution_year,
                contrib.is_featured,
                contrib.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                (
                    contrib.approval_date.strftime("%Y-%m-%d %H:%M:%S")
                    if contrib.approval_date
                    else ""
                ),
                (
                    contrib.public_date.strftime("%Y-%m-%d %H:%M:%S")
                    if contrib.public_date
                    else ""
                ),
                contrib.rejection_reason or "",
            ]
        )

    return response


@staff_member_required
def export_questions_csv(request):
    """Export questions to CSV file."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="questions_export.csv"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "ID",
            "Question (EN)",
            "Question (NP)",
            "Category",
            "Difficulty",
            "Status",
            "Is Public",
            "Is Verified",
            "Times Attempted",
            "Times Correct",
            "Accuracy %",
            "Reported Count",
            "Created By",
            "Created At",
        ]
    )

    questions = Question.objects.select_related("category", "created_by").order_by(
        "-created_at"
    )

    # Apply filters
    status = request.GET.get("status")
    category = request.GET.get("category")
    difficulty = request.GET.get("difficulty")

    if status:
        questions = questions.filter(status=status)
    if category:
        questions = questions.filter(category_id=int(category))
    if difficulty:
        questions = questions.filter(difficulty_level=difficulty)

    for q in questions:
        accuracy = q.get_accuracy_rate()
        writer.writerow(
            [
                q.id,
                q.question_text_en[:CSV_QUESTION_TEXT_LIMIT],
                q.question_text_np[:CSV_QUESTION_TEXT_LIMIT],
                q.category.name_en if q.category else "",
                q.difficulty_level or "",
                q.status,
                q.is_public,
                q.is_verified,
                q.times_attempted,
                q.times_correct,
                f"{accuracy:.2f}",
                q.reported_count,
                q.created_by.username if q.created_by else "System",
                q.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            ]
        )

    return response


@staff_member_required
def export_reports_csv(request):
    """Export question reports to CSV file."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="reports_export.csv"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "ID",
            "Question ID",
            "Question Text",
            "Reason",
            "Description",
            "Status",
            "Reported By",
            "Reviewed By",
            "Admin Notes",
            "Created At",
            "Resolved At",
        ]
    )

    reports = QuestionReport.objects.select_related(
        "question", "reported_by", "reviewed_by"
    ).order_by("-created_at")

    # Apply filters
    status = request.GET.get("status")
    reason = request.GET.get("reason")

    if status:
        reports = reports.filter(status=status)
    if reason:
        reports = reports.filter(reason=reason)

    for report in reports:
        writer.writerow(
            [
                report.id,
                report.question.id,
                report.question.question_text_en[:CSV_SHORT_TEXT_LIMIT],
                report.get_reason_display(),
                report.description[:CSV_QUESTION_TEXT_LIMIT],
                report.get_status_display(),
                report.reported_by.username if report.reported_by else "Anonymous",
                report.reviewed_by.username if report.reviewed_by else "",
                report.admin_notes or "",
                report.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                (
                    report.resolved_at.strftime("%Y-%m-%d %H:%M:%S")
                    if report.resolved_at
                    else ""
                ),
            ]
        )

    return response
