"""
TimeConfiguration definitions matching official PSC exam patterns.

Each entry maps to a TimeConfiguration model instance with:
- branch (required), sub_branch (optional), category (optional)
- standard_duration_minutes and questions_count
"""

TIME_CONFIGS = [
    # ─── Administrative Service ──────────────────────────────────────────
    {
        "branch_slug": "administrative-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Administrative Service Preliminary Exam",
    },
    {
        "branch_slug": "administrative-service",
        "sub_branch_slug": "kharidar",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Kharidar (Non-Gazetted 2nd Class) Preliminary Exam — 50 MCQs, 45 minutes",
    },
    {
        "branch_slug": "administrative-service",
        "sub_branch_slug": "nayab-subba",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Nayab Subba (Non-Gazetted 1st Class) Preliminary Exam — 50 MCQs, 45 minutes",
    },
    {
        "branch_slug": "administrative-service",
        "sub_branch_slug": "section-officer",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Section Officer (Gazetted 3rd Class) Preliminary Exam — 50 MCQs, 45 minutes",
    },
    # ─── Engineering Service ─────────────────────────────────────────────
    {
        "branch_slug": "engineering-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Engineering Service Preliminary Exam",
    },
    {
        "branch_slug": "engineering-service",
        "sub_branch_slug": "civil-engineering",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Civil Engineering Technical Exam — 50 MCQs, 45 minutes",
    },
    {
        "branch_slug": "engineering-service",
        "sub_branch_slug": "computer-engineering",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Computer Engineering Technical Exam — 50 MCQs, 45 minutes",
    },
    {
        "branch_slug": "engineering-service",
        "sub_branch_slug": "electrical-engineering",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Electrical Engineering Technical Exam — 50 MCQs, 45 minutes",
    },
    {
        "branch_slug": "engineering-service",
        "sub_branch_slug": "mechanical-engineering",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Mechanical Engineering Technical Exam — 50 MCQs, 45 minutes",
    },
    # ─── Health Service ──────────────────────────────────────────────────
    {
        "branch_slug": "health-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Health Service Preliminary Exam",
    },
    {
        "branch_slug": "health-service",
        "sub_branch_slug": "nursing",
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Nursing Technical Exam — 50 MCQs, 45 minutes",
    },
    # ─── Education Service ───────────────────────────────────────────────
    {
        "branch_slug": "education-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Education Service Preliminary Exam",
    },
    # ─── Judicial Service ────────────────────────────────────────────────
    {
        "branch_slug": "judicial-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Judicial Service Preliminary Exam",
    },
    # ─── Agriculture Service ─────────────────────────────────────────────
    {
        "branch_slug": "agriculture-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Agriculture Service Preliminary Exam",
    },
    # ─── Forest Service ──────────────────────────────────────────────────
    {
        "branch_slug": "forest-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Forest Service Preliminary Exam",
    },
    # ─── Audit Service ───────────────────────────────────────────────────
    {
        "branch_slug": "audit-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Audit Service Preliminary Exam",
    },
    # ─── Foreign Affairs Service ─────────────────────────────────────────
    {
        "branch_slug": "foreign-affairs-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Foreign Affairs Service Preliminary Exam",
    },
    # ─── Miscellaneous Service ───────────────────────────────────────────
    {
        "branch_slug": "miscellaneous-service",
        "sub_branch_slug": None,
        "category_slug": None,
        "standard_duration_minutes": 45,
        "questions_count": 50,
        "description": "PSC Standard Pattern — Miscellaneous Service Preliminary Exam",
    },
    # ─── Practice Category Timing (cross-branch) ────────────────────────
    {
        "branch_slug": "administrative-service",
        "sub_branch_slug": None,
        "category_slug": "reasoning-mental-ability",
        "standard_duration_minutes": 15,
        "questions_count": 10,
        "description": "Practice timing for IQ/Reasoning section — 10 questions in 15 minutes",
    },
    {
        "branch_slug": "administrative-service",
        "sub_branch_slug": None,
        "category_slug": "quantitative-aptitude",
        "standard_duration_minutes": 15,
        "questions_count": 10,
        "description": "Practice timing for Quantitative Aptitude section — 10 questions in 15 minutes",
    },
]
