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

- [ ] **A1. Initialize git repo at project root** - Monorepo with both backend and frontend
- [ ] **A2. Wire Google OAuth on frontend** - Backend ready, need expo-auth-session integration
- [ ] **A3. Complete missing API integrations on frontend**
  - [ ] Report question API call (UI exists, API stub)
  - [ ] Edit/delete contribution API calls
  - [ ] Save preferences API call
  - [ ] Profile setup save API call
  - [ ] Remove question from collection API call
- [ ] **A4. Create Dockerfile + docker-compose** - For backend (Django + Redis + PostgreSQL + Celery)
- [ ] **A5. Configure app.json for production** - Bundle IDs, version, production API URL
- [ ] **A6. Environment variables** - Create proper .env for backend with real secrets
- [ ] **A7. Database** - Test with PostgreSQL instead of SQLite
- [ ] **A8. Fix ErrorBoundary** - Currently placeholder logic in frontend

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
4. ErrorBoundary component is placeholder
5. No Docker containerization
6. Frontend has 0 automated tests
7. WebSocket consumers exist but aren't connected to frontend
