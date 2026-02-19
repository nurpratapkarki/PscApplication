# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PSC Exam Preparation Platform for Nepal's Public Service Commission. Monorepo with a Django backend and React Native (Expo) mobile frontend.

- **Backend:** `PSCApp/` — Django 6.0 + Django REST Framework
- **Frontend:** `frontend/PSCApp/` — React Native Expo 54 + TypeScript

## Commands

### Backend (run from `PSCApp/`)

The project uses `just` (task runner) and `uv` (Python package manager).

```bash
just setup              # Full dev setup: uv sync, pin deps, migrate, create superuser
just dev                # Run dev server (localhost:8000)
just dev-server 0.0.0.0 8000  # Run on custom host/port (needed for mobile testing)
just test               # Run all tests
just test-coverage      # pytest with coverage report
just lint               # ruff check .
just format             # ruff format .
just ci                 # Lint + format check + Django check
just migrate            # Run migrations (src app only)
just makemigrations     # Create new migrations (src app only)
```

Run a single test file or method:
```bash
cd PSCApp && uv run python manage.py test src.tests.api.test_user
cd PSCApp && uv run python manage.py test src.tests.api.test_user.UserAPITestCase.test_method_name
```

Celery (requires Redis):
```bash
cd PSCApp && uv run celery -A src worker --loglevel=info
cd PSCApp && uv run celery -A src beat --loglevel=info
```

Seed data: `cd PSCApp && uv run python manage.py seed_data`

### Frontend (run from `frontend/PSCApp/`)

```bash
npm install             # Install dependencies
npx expo start          # Start Expo dev server
npm run android         # Start on Android
npm run ios             # Start on iOS
npm run lint            # ESLint (expo lint)
```

No test runner is configured for the frontend.

### Docker (from project root)

```bash
docker compose up --build   # PostgreSQL, Redis, Django, Celery worker + beat
```

## Architecture

### Backend

Single Django app (`src`) registered as `src.apps.SrcConfig`. All models, signals, tasks, and API modules live under the `src` namespace.

**Settings split:** `src/settings/base.py` (shared), `development.py` (SQLite, DEBUG), `production.py` (PostgreSQL, SMTP, HSTS). Default: `DJANGO_SETTINGS_MODULE=src.settings.development`.

**API structure:** Each domain has its own module in `src/api/{domain}/` with `views.py`, `serializers.py`, `urls.py`. All ViewSets are registered on a single `DefaultRouter` in `src/api/urls.py` (16 registrations). Auth routes are separately defined in `src/urls.py`.

**Models (18 exported from `src/models/__init__.py`):**
- User: `UserProfile` extends `auth.User` via OneToOneField (`google_auth_user` field name)
- Content: `Branch` > `SubBranch` > `Category` > `Question` > `Answer`
- Testing: `MockTest`, `MockTestQuestion`, `UserAttempt`, `UserAnswer`
- Analytics: `Contribution`, `DailyActivity`, `LeaderBoard`, `UserStatistics`, `UserProgress`
- System: `Notification`, `PlatformStats`, `AppSettings`, `TimeConfiguration`, `StudyCollection`

**Signals** (`src/signals.py`): Auto-create UserProfile/UserStatistics on User creation, update stats on Answer/Contribution/Attempt saves, send notifications on Question approval.

**Celery Beat:** 8 scheduled tasks for stats updates, streak tracking, weekly summaries, and monthly maintenance.

**Key URL patterns:**
- `/api/auth/dev-login/` — Dev-only login (disabled when DEBUG=False)
- `/api/auth/regular-login/` — Email/password login
- `/api/auth/google/` — Google OAuth
- `/api/*` — All DRF router endpoints
- `/dashboard/` — Admin moderation dashboard (HTML views)
- `/docs/` — Swagger UI (development only)

### Frontend

**Routing:** Expo Router (file-based) with route groups:
- `app/(auth)/` — Login, welcome, profile setup
- `app/(tabs)/` — Bottom tab navigation (home, practice, tests, community, profile)
- `app/practice/`, `app/tests/`, `app/contribute/`, `app/community/`, `app/profile/`, `app/notifications/`, `app/report/` — Feature screens

**State:** Zustand with 3 stores: `authStore` (persisted to AsyncStorage), `practiceStore`, `settingsStore`. All in `store/`.

**API client:** Custom fetch-based wrapper in `services/api/client.ts` with automatic JWT refresh on 401. NOT Axios. Each API domain has a service file in `services/api/`.

**Endpoint config:** All API paths defined in `config/api.config.ts`. Base URL from `EXPO_PUBLIC_API_BASE_URL` env var.

**UI:** React Native Paper (Material Design 3). Theme configured in `app/_layout.tsx`.

**TypeScript:** Strict mode. Path alias `@/*` maps to project root.

## Key Conventions

- Bilingual fields use `_en`/`_np` suffix pattern (English/Nepali)
- Backend linting: Ruff (line-length 88, rules: E/W/F/I/B/C4/UP)
- Frontend linting: ESLint with eslint-config-expo
- Migrations target `src` app only: `makemigrations src`, `migrate src`
- Owner permission checks use `IsOwnerOrReadOnly` which looks for `google_auth_user`, `user`, or `created_by` attributes in that order

## Gotchas

- **Single migration file** — All 21 models live in `0001_initial.py`. Be careful with model changes; always run `just makemigrations` after changes and verify the result.
- **Frontend .env** points to a local IP (`EXPO_PUBLIC_API_BASE_URL=http://192.168.1.87:8000`) — update for your network.
- **`react-i18next`** is fully configured — i18n/index.ts initializes it, I18nextProvider wraps app, EN/NP locale files in i18n/locales/, all 35+ screens use useTranslation().
- **Frontend has no automated tests.**
- **API client uses `fetch`**, not Axios, despite some documentation examples mentioning Axios.
- **Celery `__init__.py`** exports `celery_app` — `src/__init__.py` contains `from .celery import app as celery_app`.

## Completed Work (Sessions Feb 2026)

**All major feature work is done. Summary of what was implemented:**
1. **Settings page** — all toggles wired to Zustand settingsStore (darkMode, language, notifications, soundEffects)
2. **Change password** — new `app/profile/change-password.tsx` screen + `changePassword()` in auth.ts + `auth.passwordChange` endpoint in api.config.ts
3. **Dark mode** — `useColors()` hook in `hooks/useColors.ts`, `DarkColors` in `constants/colors.ts`, all 35+ screens converted with dynamic colors
4. **i18n (react-i18next)** — fully configured in `i18n/index.ts`, `I18nextProvider` in `app/_layout.tsx`, EN/NP locale files with ~450 keys, all screens use `useTranslation()` + `useLocalizedField()`
5. **Registration 400 fix** — `CustomRegisterSerializer` in `PSCApp/src/api/auth/serializers.py`, registered via `REST_AUTH.REGISTER_SERIALIZER` in `base.py`
6. **notifications/index.tsx** — fixed runtime error: `getNotificationIcon` was using `colors.success` but now uses static `Colors.success`; full dark mode + i18n applied
7. **instructions.tsx** — added 3 missing i18n keys: `tests.instructionContainsQuestions`, `tests.instructionTimeLimit`, `tests.instructionPassPercent` (with interpolation)
8. **preferences.tsx + statistics.tsx** — rewritten with full dark mode + i18n support

## Dark Mode Pattern (for future screens)

```typescript
// 1. Import hooks
import { useColors } from '@/hooks/useColors';
import { Colors } from '@/constants/colors';

// 2. Get dynamic colors
const colors = useColors();

// 3. StyleSheet for layout only (no theme-sensitive colors)
const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });

// 4. Apply theme colors inline
<View style={[styles.container, { backgroundColor: colors.background }]}>
  <Text style={{ color: colors.textPrimary }}>Title</Text>
  <Text style={{ color: colors.textSecondary }}>Subtitle</Text>
</View>

// 5. Brand/semantic colors (don't change in dark mode) — use static Colors
<MaterialCommunityIcons color={Colors.primary} />  // not colors.primary
```

**DarkColors only overrides:** `background`, `surface`, `surfaceVariant`, `textPrimary`, `textSecondary`, `textTertiary`, `border`, `borderDark`, `cardBackground`, `cardBorder`

**Brand colors stay constant:** `primary`, `secondary`, `accent`, `success`, `error`, `warning`, `info`, and all their variants
# Plan after feb 17, 2026
Plan: Realistic Nepal PSC (Loksewa) Exam Seed Data System
Context
The current seed_data.py creates unrealistic placeholder data: 4 generic branches ("Civil Service", "Engineering", "Technical", "Security Forces"), 3 meaningless sub-branches per branch ("Level 4", "Level 5", "Officer"), 5 random-word categories with UNIVERSAL scope only, and Faker-generated gibberish questions. This doesn't reflect Nepal's actual Loksewa (Public Service Commission) examination structure, making the app unusable for real exam preparation workflows.

Goal: Replace the seed data with a comprehensive, logically-driven dataset that mirrors Nepal's PSC hierarchy: 10 real service groups (Sewa), proper post-level sub-branches (Kharidar/Nayab Subba/Section Officer for administrative, Civil/Computer/Electrical for engineering, etc.), properly-scoped categories (UNIVERSAL for common subjects, BRANCH for service-specific, SUBBRANCH for specialization-specific), and realistic MCQ questions with correct Nepal-specific content.

Outcome: A user selecting "Administrative Service > Kharidar" sees General Knowledge + Constitution + Current Affairs (UNIVERSAL) + Public Administration (BRANCH) + Office Management (SUBBRANCH) — exactly what a real Kharidar candidate would study.

Data Structure: Nepal PSC Mapped to Models
Branches (10 Service Groups)
#	name_en	name_np	slug	has_sub_branches
1	Administrative Service	प्रशासन सेवा	administrative-service	True
2	Engineering Service	ईन्जिनियरिङ सेवा	engineering-service	True
3	Health Service	स्वास्थ्य सेवा	health-service	True
4	Education Service	शिक्षा सेवा	education-service	True
5	Judicial Service	न्याय सेवा	judicial-service	False
6	Agriculture Service	कृषि सेवा	agriculture-service	True
7	Forest Service	वन सेवा	forest-service	True
8	Audit Service	लेखा परीक्षण सेवा	audit-service	False
9	Foreign Affairs Service	परराष्ट्र सेवा	foreign-affairs-service	False
10	Miscellaneous Service	विविध सेवा	miscellaneous-service	False
SubBranches (17 total)
Administrative Service — post levels:

Kharidar (खरिदार) — Non-Gazetted 2nd Class
Nayab Subba (नायब सुब्बा) — Non-Gazetted 1st Class
Section Officer (शाखा अधिकृत) — Gazetted 3rd Class
Engineering Service — specializations:

Civil Engineering (सिभिल इन्जिनियरिङ)
Computer Engineering (कम्प्युटर इन्जिनियरिङ)
Electrical Engineering (विद्युत इन्जिनियरिङ)
Mechanical Engineering (मेकानिकल इन्जिनियरिङ)
Health Service — specializations:

General Medicine (सामान्य चिकित्सा)
Nursing (नर्सिङ)
Lab Technology (प्रयोगशाला प्रविधि)
Pharmacy (फार्मेसी)
Education Service — post levels:

Primary Level Teacher (प्राथमिक तह शिक्षक)
Secondary Level Teacher (माध्यमिक तह शिक्षक)
Agriculture Service — specializations:

Agriculture (कृषि)
Livestock Development (पशुपालन विकास)
Forest Service — specializations:

Forestry (वन)
Soil Conservation (भू-संरक्षण)
Categories (~55 total)
12 UNIVERSAL categories (scope_type=UNIVERSAL, visible to ALL users):

General Knowledge (सामान्य ज्ञान)
Constitution of Nepal (नेपालको संविधान)
Current Affairs (समसामयिक घटना)
Lok Sewa Regulations (लोक सेवा नियमावली)
Nepali Language & Grammar (नेपाली भाषा र व्याकरण)
English Language (अंग्रेजी भाषा)
Quantitative Aptitude (परिमाणात्मक योग्यता)
Reasoning & Mental Ability (तर्क र मानसिक क्षमता)
Computer Knowledge (कम्प्युटर ज्ञान)
Good Governance & Ethics (सुशासन र नैतिकता)
Geography of Nepal (नेपालको भूगोल)
History of Nepal (नेपालको इतिहास)
~20 BRANCH-scoped categories (examples per branch):

Administrative: Public Administration, Financial Administration, Public Service Management, Office Procedures & Management
Engineering: Engineering Mathematics, Applied Mechanics, Engineering Drawing
Health: Public Health, Epidemiology, Health Policy & Planning
Education: Education Policy, Pedagogy & Teaching Methods, Curriculum Development
Judicial: Legal System of Nepal, Criminal Law, Civil Law
Agriculture: Agricultural Science, Crop Science
Forest: Forest Management, Environmental Science
Audit: Accounting & Auditing, Financial Management
~20 SUBBRANCH-scoped categories (examples):

Admin > Kharidar: Office Management (Kharidar Level), Clerical Procedures
Admin > Section Officer: Policy Analysis, Organizational Behavior
Engineering > Civil: Structural Analysis, Surveying, Transportation Engineering
Engineering > Computer: Data Structures & Algorithms, Database Management, Networking
Health > Nursing: Nursing Fundamentals, Patient Care
Education > Primary: Primary Education Methods, Child Psychology
User Flow Verification
Admin > Section Officer sees: 12 universal + 4 branch + 2 subbranch = ~18 categories
Engineering > Computer sees: 12 universal + 3 branch + 3 subbranch = ~18 categories
Judicial (no sub-branches) sees: 12 universal + 3 branch = ~15 categories

Question Template System
Approach
Instead of fake.sentence() + "?", each category has a pool of realistic question templates:

Static questions (~60%) — Pre-written with real Nepal facts (presidents, constitution articles, districts, rivers)
Parametric templates (~40%) — Templates with variable slots filled by generators (math, series, percentages)
Template Structure

{
    "question_text_en": "Who was the first President of Nepal?",
    "question_text_np": "नेपालको पहिलो राष्ट्रपति को हुन्?",
    "answers": [
        {"text_en": "Ram Baran Yadav", "text_np": "रामवरण यादव", "is_correct": True},
        {"text_en": "Bidya Devi Bhandari", "text_np": "विद्यादेवी भण्डारी", "is_correct": False},
        {"text_en": "KP Sharma Oli", "text_np": "केपी शर्मा ओली", "is_correct": False},
        {"text_en": "Girija Prasad Koirala", "text_np": "गिरिजाप्रसाद कोइराला", "is_correct": False},
    ],
    "explanation_en": "Ram Baran Yadav was elected as the first President of Nepal on July 23, 2008.",
    "explanation_np": "रामवरण यादव सन् २००८ जुलाई २३ मा नेपालको पहिलो राष्ट्रपतिमा निर्वाचित भए।",
    "difficulty": "EASY",
    "source_reference": "PSC General Knowledge",
}
Question Targets per Category Type
UNIVERSAL categories: 20-25 questions each (~240-300 total)
BRANCH categories: 10-15 questions each (~200-300 total)
SUBBRANCH categories: 5-10 questions each (~100-200 total)
Total: ~540-800 questions
Parametric Generators (for Math/Reasoning)
generate_percentage_question() — "What is 25% of 400?"
generate_series_question() — "Complete: 2, 6, 18, 54, ?"
generate_ratio_question() — "If A:B = 3:5 and B:C = 2:3..."
generate_age_problem() — "A is twice as old as B..."
Mock Tests & Time Configurations
Mock Tests (~12 total)
Each follows real PSC exam patterns:

Test	Branch	SubBranch	Questions	Duration	Pass %
Kharidar Prelim Set 1	Administrative	Kharidar	50	45 min	40%
Kharidar Prelim Set 2	Administrative	Kharidar	50	45 min	40%
Nayab Subba Prelim Set 1	Administrative	Nayab Subba	50	45 min	40%
Section Officer Prelim Set 1	Administrative	Section Officer	50	45 min	40%
Engineering General Set 1	Engineering	None	50	45 min	40%
Civil Engineering Set 1	Engineering	Civil	50	45 min	40%
Computer Engineering Set 1	Engineering	Computer	50	45 min	40%
Health Service Set 1	Health	None	50	45 min	40%
Nursing Set 1	Health	Nursing	50	45 min	40%
Education Set 1	Education	None	50	45 min	40%
Judicial Set 1	Judicial	None	50	45 min	40%
Agriculture Set 1	Agriculture	None	50	45 min	40%
Category Distribution per Test (PSC pattern)

Kharidar Prelim:
  General Knowledge: 10, Constitution: 8, Current Affairs: 7,
  Quant: 5, Reasoning: 5, Nepali: 5, English: 5, Computer: 5
Time Configurations
One per branch (default) + overrides for sub-branches with different patterns.

File Structure

PSCApp/src/
  seed_data/                          # NEW package
    __init__.py
    constants.py                      # Nepal data pools, colors, Nepali numerals
    branches.py                       # Branch + SubBranch definitions
    categories.py                     # Category definitions (UNIVERSAL/BRANCH/SUBBRANCH)
    mock_tests.py                     # MockTest definitions + category distributions
    time_configs.py                   # TimeConfiguration definitions
    generators.py                     # Math/reasoning question generators
    questions/                        # Question templates by category
      __init__.py
      general_knowledge.py
      constitution.py
      current_affairs.py
      lok_sewa.py
      nepali_language.py
      english_language.py
      quantitative_aptitude.py
      reasoning.py
      computer_knowledge.py
      governance_ethics.py
      geography.py
      history.py
      administrative.py              # Branch + subbranch specific
      engineering.py                  # Branch + subbranch specific
      health.py
      education.py
      judicial.py
      agriculture_forest.py
  management/commands/
    seed_data.py                      # REPLACE existing with new orchestrator
Implementation Steps
Step 1: Create seed_data/ package with constants
File: PSCApp/src/seed_data/__init__.py, constants.py
Nepal data pools: 77 district names, rivers, mountains, presidents/PMs, constitutional articles
Nepali number converter, color palette, difficulty weights
Step 2: Define branches and sub-branches
File: PSCApp/src/seed_data/branches.py
10 branches + 17 sub-branches as Python dicts
All bilingual with proper Nepali text
Step 3: Define categories with scope mapping
File: PSCApp/src/seed_data/categories.py
12 UNIVERSAL + ~20 BRANCH + ~20 SUBBRANCH categories
Each with proper scope_type, target_branch (by slug), target_sub_branch (by slug)
Step 4: Build question templates (the bulk of work)
Files: PSCApp/src/seed_data/questions/*.py
15-25 static questions per UNIVERSAL category
8-15 per BRANCH category, 5-10 per SUBBRANCH category
Parametric generators for math/reasoning in generators.py
Step 5: Define mock tests and time configs
Files: PSCApp/src/seed_data/mock_tests.py, time_configs.py
12 mock tests with category distribution maps
Time configs per branch/sub-branch
Step 6: Rewrite seed_data.py management command
File: PSCApp/src/management/commands/seed_data.py
Idempotent via get_or_create on slugs
New flags: --flush, --skip-users, --skip-attempts, --questions-per-category
Creates in dependency order: Branches → SubBranches → Categories → Questions/Answers → MockTests → TimeConfigs → Users → Attempts
Uses bulk_create for Questions/Answers to avoid signal noise
Step 7: Update frontend icon mapping
File: frontend/PSCApp/app/(auth)/profile-setup.tsx (line 211-221)
Update getBranchIcon() slug-to-icon mapping to match new branch slugs:

administrative-service → account-tie
engineering-service → hard-hat
health-service → hospital-box
education-service → school
judicial-service → gavel
agriculture-service → sprout
forest-service → tree
audit-service → calculator
foreign-affairs-service → earth
miscellaneous-service → folder-multiple
Step 8: Update CLAUDE.md with the data model documentation
Add PSC data hierarchy documentation to CLAUDE.md so future sessions understand the structure
Critical Files to Modify
File	Action
PSCApp/src/seed_data/ (new package, ~18 files)	CREATE
PSCApp/src/management/commands/seed_data.py	REPLACE
frontend/PSCApp/app/(auth)/profile-setup.tsx	EDIT (icon mapping, lines 211-221)
CLAUDE.md	EDIT (add PSC data structure docs)
Files to Read (not modify)
File	Why
PSCApp/src/models/branch.py	Branch, SubBranch, Category models + validation
PSCApp/src/models/question_answer.py	Question, Answer models
PSCApp/src/models/mocktest.py	MockTest, MockTestQuestion models
PSCApp/src/models/time_config.py	TimeConfiguration model
PSCApp/src/signals.py	Understand signal side-effects during seeding
Verification Plan
Run seed: cd PSCApp && uv run python manage.py seed_data
Check counts in Django shell:
Branch.objects.count() → 10
SubBranch.objects.count() → 17
Category.objects.filter(scope_type="UNIVERSAL").count() → 12
Category.objects.filter(scope_type="BRANCH").count() → ~20
Category.objects.filter(scope_type="SUBBRANCH").count() → ~20
Question.objects.filter(status="PUBLIC").count() → ~500+
Simulate user flow: Call Category.get_categories_for_user(user) for a user with target_branch=Administrative, target_sub_branch=Kharidar — verify they see universal + admin branch + kharidar subbranch categories
API test: curl /api/branches/ and curl /api/categories/for-user/
Idempotency: Run seed_data twice — counts should not double
Flush: Run seed_data --flush — clean recreate
Frontend: Walk through profile setup, verify branches/sub-branches display correctly, practice categories are filtered properly

# todo on this plan: 

Create seed_data/ package with constants.py (Nepal data pools, colors) *done*

Create branches.py (10 branches + 17 sub-branches) *done*

Create categories.py (12 UNIVERSAL + ~20 BRANCH + ~20 SUBBRANCH) *done*

Create question generators.py (math/reasoning helpers) *done*

Create question templates for UNIVERSAL categories (12 files) * done *

Create question templates for BRANCH/SUBBRANCH categories (6 files)

Create mock_tests.py and time_configs.py definitions *done but check if it is correct*

Rewrite seed_data.py management command

Update frontend profile-setup.tsx icon mapping

Update CLAUDE.md with PSC data structure docs

Test: run seed_data command and verify