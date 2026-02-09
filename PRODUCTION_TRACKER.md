# PSC App - Production Tracker

**Project:** PSC Exam Preparation Platform (Django + React Native/Expo)
**Goal:** Get this app running in production
**Started:** February 2026
**Collaborators:** Nur Pratap Karki + Claude

---

## Current State Summary

- **Backend:** Django 6.0 + DRF, JWT auth, Google OAuth, Celery, 15+ API modules - ~90% done
- **Frontend:** React Native (Expo 54), TypeScript, Zustand, 35+ screens - ~75% done
- **Database:** 13 models, SQLite dev, PostgreSQL planned for prod
- **CI/CD:** GitHub Actions pipeline working
- **Tests:** 38 backend tests passing

---

## Production Roadmap

### Phase A: Fix Critical Gaps (Must-Have for Production)

- [x] **A1. Initialize git repo at project root** - Monorepo with both backend and frontend
- [x] **A2. Wire Google OAuth on frontend** - expo-auth-session + expo-crypto integrated in login.tsx
- [x] **A3. Complete missing API integrations on frontend**
  - [x] Report question API call (wired reportQuestion, fixed reason mismatch WRONG_EXPLANATION->TYPO)
  - [x] Edit/delete contribution API calls (wired updateQuestion + deleteQuestion)
  - [x] Save preferences API call (backend: updateUserProfile, local: settingsStore)
  - [x] Profile setup save API call (wired updateUserProfile with target_branch/sub_branch)
  - [x] Remove question from collection API call (wired removeQuestionsFromCollection)
- [x] **A4. Create Dockerfile + docker-compose** - PostgreSQL 16, Redis 7, Django, Celery worker+beat
- [x] **A5. Configure app.json for production** - Bundle IDs, Google OAuth extra, EAS project ID
- [x] **A6. Environment variables** - Fixed .env.sample (postgres URL, Google env var names), fixed production.py, wsgi.py, Procfile
- [x] **A7. Database** - Uncommented psycopg2-binary in pyproject.toml
- [x] **A8. Fix ErrorBoundary** - Rewritten as proper React class component with fallback UI

### Phase B: Production Hardening (Should-Have)

- [ ] **B1. Implement remaining Celery tasks**
- [ ] `send_weekly_summary()` - currently `pass`
  - [ ] `check_streak_notifications()` - currently `pass`
  - [ ] `monthly_maintenance()` - partially implemented
- [ ] **B2. Formal i18n setup** - Replace manual EN/NP strings with react-i18next (already in package.json)
- [ ] **B3. Email service** - Configure SMTP for password reset, notifications
- [ ] **B4. Increase test coverage** - Frontend has 0 tests, backend could use more
- [ ] **B5. Add proper logging** - Backend logging configured but verify it works
- [ ] **B6. Media file handling** - Configure S3 or equivalent for profile pics, question images
- [ ] **B7. API rate limiting** - Protect against abuse
- [ ] **B8. Custom permissions** - IsAdminUser for moderation, CanAccessCategory (noted incomplete in docs)

### Phase C: Deployment (The Actual Push)

- [ ] **C1. Choose hosting** - Backend: Railway/Render/DigitalOcean, Frontend: EAS Build
- [ ] **C2. Set up production database** - PostgreSQL on chosen host
- [ ] **C3. Set up Redis** - For Celery + Channels
- [ ] **C4. Configure domain + SSL** - HTTPS for API
- [ ] **C5. Deploy backend** - Gunicorn + Nginx or PaaS
- [ ] **C6. Build APK/IPA** - EAS Build for Android/iOS
- [ ] **C7. Run production checklist** - Use existing docs/PRODUCTION_CHECKLIST.md
- [ ] **C8. Seed production data** - Categories, branches, initial questions
- [ ] **C9. Submit to app stores** - Google Play, Apple App Store (optional: start with APK distribution)

### Phase D: Post-Launch (Nice-to-Have)

- [ ] **D1. WebSocket notifications** - Backend configured, need frontend integration
- [ ] **D2. Push notifications** - expo-notifications is installed, needs Firebase setup
- [ ] **D3. Offline caching** - AsyncStorage for practice mode
- [ ] **D4. Dark mode**
- [ ] **D5. Performance monitoring** - Sentry integration
- [ ] **D6. Analytics** - Firebase Analytics or similar

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│         React Native (Expo) + TypeScript         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Screens  │ │Components│ │ Services/API     │ │
│  │  35+      │ │  43+     │ │ Axios + JWT      │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Zustand  │ │  i18n    │ │ Expo Router      │ │
│  │  Store    │ │  EN/NP   │ │ File-based       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS / JWT
┌───────────────────────▼─────────────────────────┐
│                   BACKEND                        │
│            Django 6.0 + DRF                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  API      │ │  Auth    │ │ Admin + Dashboard│ │
│  │  15+      │ │JWT+OAuth │ │ Jazzmin          │ │
│  │  modules  │ │          │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Celery   │ │ Channels │ │ Signals          │ │
│  │  8 tasks  │ │ WebSocket│ │ Auto-stats       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└───────┬───────────────┬─────────────┬───────────┘
        │               │             │
   ┌────▼────┐    ┌─────▼────┐  ┌─────▼────┐
   │PostgreSQL│    │  Redis   │  │  Media   │
   │ Database │    │ Cache +  │  │ Storage  │
   │          │    │ Broker   │  │ (S3/Local)│
   └──────────┘    └──────────┘  └──────────┘
```

---

## Session Log

### Session 1 - Feb 9, 2026 - Initial Audit
- Explored full project structure
- Read all documentation (.md files)
- Verified actual implementation state vs documented claims
- Created this production tracker
- **Finding:** Project is substantially real, not just scaffolded. Backend is production-ready with minor gaps. Frontend needs API integration work and store config.

### Session 2 - Feb 9, 2026 - Phase A Complete
- Completed all 8 Phase A items (12 tasks total)
- **A8:** Rewrote ErrorBoundary as class component with getDerivedStateFromError + componentDidCatch + fallback UI
- **A3a:** Wired reportQuestion API, fixed report reason mismatch (WRONG_EXPLANATION -> TYPO)
- **A3d:** Wired profile-setup save with updateUserProfile (target_branch/sub_branch)
- **A3c:** Extended settingsStore with notification/study prefs, wired preferences.tsx save (backend language + local prefs)
- **A3b:** Wired edit/delete contributions with updateQuestion/deleteQuestion API calls
- **A3e:** Wired remove from collection with removeQuestionsFromCollection
- **A5:** Added bundleIdentifier, package, extra (Google OAuth client IDs + EAS project ID) to app.json
- **A2:** Installed expo-auth-session + expo-crypto, wired Google OAuth flow in login.tsx
- **A6:** Fixed 5 config bugs: .env.sample DB URL, production.py Google env vars, wsgi.py default, Procfile paths
- **A7:** Uncommented psycopg2-binary in pyproject.toml
- **A4:** Created Dockerfile (Python 3.13-slim + uv), .dockerignore, docker-compose.yml (db, redis, web, celery-worker, celery-beat)
- **A1:** Removed sub-repo .git dirs, created root .gitignore, initialized monorepo with initial commit

---

## Key Files Reference

| What | Path |
|------|------|
| Backend settings (prod) | `PSCApp/src/settings/production.py` |
| Backend settings (dev) | `PSCApp/src/settings/development.py` |
| Backend env template | `PSCApp/.env.sample` |
| Frontend env | `frontend/PSCApp/.env` |
| CI/CD pipeline | `PSCApp/.github/workflows/ci.yml` |
| Production checklist | `PSCApp/docs/PRODUCTION_CHECKLIST.md` |
| Project plan (original) | `PSCApp/docs/Nur_Readme.md` |
| Procfile | `PSCApp/Procfile` |
| Task runner | `PSCApp/justfile` |
| Celery tasks | `PSCApp/src/tasks.py` |
| API client | `frontend/PSCApp/services/api/client.ts` |
| Auth store | `frontend/PSCApp/store/authStore.ts` |
| App config | `frontend/PSCApp/app.json` |

---

## Known Technical Debt

1. Only 1 database migration file (everything in 0001_initial.py)
2. Manual i18n (EN/NP hardcoded) - react-i18next is in package.json but not configured
3. 2 Celery tasks are `pass` stubs (weekly email, streak notifications)
4. ~~ErrorBoundary component is placeholder~~ - Fixed in Session 2
5. ~~No Docker containerization~~ - Added in Session 2
6. Frontend has 0 automated tests
7. WebSocket consumers exist but aren't connected to frontend
