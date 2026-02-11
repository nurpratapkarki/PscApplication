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
- **`react-i18next`** is in `package.json` but NOT configured — bilingual content is handled manually via `_en`/`_np` model fields.
- **Frontend has no automated tests.**
- **API client uses `fetch`**, not Axios, despite some documentation examples mentioning Axios.
- **Celery `__init__.py`** exports `celery_app` — `src/__init__.py` contains `from .celery import app as celery_app`.
