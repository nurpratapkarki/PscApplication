# PSC Exam Preparation Platform

A comprehensive Django + React Native application for Nepal's Public Service Commission (PSC) exam preparation. This platform enables collaborative learning where users contribute questions, practice mock tests, and compete on leaderboards while preparing for various government positions.

---

## 🎯 Project Vision

**"Turn mobile addiction into PSC exam success"**

This platform gamifies the exam preparation process by:

- Allowing users to contribute questions and help each other
- Providing authentic mock tests with PSC timing patterns
- Creating competitive leaderboards to drive engagement
- Offering personalized progress tracking and weak area analysis
- Building a collaborative community of exam aspirants

**Target Users:** Anyone preparing for Nepal's PSC exams (Nasu, Kharidar, Technical, Engineering positions)

---

## 🏗️ Architecture

### Backend

- **Framework:** Django 4.x + Django REST Framework
- **Authentication:** Google OAuth 2.0
- **Database:** PostgreSQL (recommended) or MySQL
- **Storage:** Django's media storage for images

### Frontend

- **Framework:** React Native (iOS & Android)
- **State Management:** Redux / Context API (TBD)
- **Navigation:** React Navigation

### Languages

- Bilingual support: English & Nepali (नेपाली)

---

## 📊 Database Structure

### Model Organization

```
models/
├── app_settings_model.py          ✅ System configuration
├── attempt_model.py                ✅ User test attempts
├── branch_model.py                 ✅ Exam branches (Nasu, Engineering, etc.)
├── category_model.py               ✅ Flexible category hierarchy (Universal/Branch/SubBranch)
├── contribution_model.py           ✅ Question contribution tracking
├── daily_activity_model.py         ✅ Platform analytics
├── leaderboard_model.py            ✅ Rankings by period/branch
├── mocktest_model.py               ✅ Mock test configurations
├── mocktestquestion_model.py       ✅ Test-Question junction table
├── notification_model.py           ✅ User notifications
├── platform_stats_model.py         ✅ Public dashboard metrics
├── question_answer_model.py        ✅ Questions & MCQ answers
├── questions_quality_model.py      ✅ Quality control reports
├── sub_branch_model.py             ✅ Specializations (Civil, Electrical, etc.)
├── timeconfig_model.py             ✅ Standard PSC timing patterns
├── user_model.py                   ✅ Extended user profiles
├── user_progress_analytic_model.py ✅ Category-wise performance
├── user_statices_model.py          ✅ Achievement tracking
└── study_collection.py             ✅ Personal question playlists
```

---

## ✅ What We Have Done (Planning Phase)

### 1. **Complete Model Design** ✅

- [x] 18 comprehensive models with proper relationships
- [x] Flexible category hierarchy (Universal/Branch/SubBranch scope)
- [x] Bilingual field support (English + Nepali)
- [x] Proper null/blank constraints documented
- [x] Database indexing strategy defined
- [x] Validation logic (e.g., Category.clean())

### 2. **Core Features Planned** ✅

- [x] User authentication via Google OAuth
- [x] Question contribution system with consent mechanism
- [x] Mock test generation (both pre-configured and auto-generated)
- [x] Real-time leaderboards (Weekly/Monthly/All-Time)
- [x] Progress tracking per category
- [x] Study collections (personal question playlists)
- [x] Quality control reporting system
- [x] Notification system for engagement
- [x] Public statistics dashboard
- [x] Gamification (badges, streaks, XP, ranks)

### 3. **Key Business Logic Defined** ✅

- [x] Monthly publication workflow for contributed questions
- [x] Duplicate prevention in public pool (private duplicates allowed)
- [x] Standard vs custom test timing options
- [x] Category applicability based on user's target branch
- [x] Contribution ranking and Facebook shoutout system
- [x] Daily activity tracking for trend analysis

### 4. **Scalability Considerations** ✅

- [x] Proper database indexes planned
- [x] Efficient query patterns (unique_together constraints)
- [x] JSON fields for flexible data (badges, weak topics)
- [x] Cascade delete strategies defined
- [x] Singleton pattern for platform stats

---

## 🚧 What Needs to Be Done (Implementation Phase)

### Phase 1: Backend Foundation 🔨 ✅ COMPLETE

#### A. Django Setup ✅

- [x] Initialize Django project and apps
- [x] Configure PostgreSQL/MySQL database (SQLite for development)
- [x] Set up Google OAuth authentication (via django-allauth)
- [x] Configure media storage (local with whitenoise for static)
- [x] Set up CORS for React Native
- [x] Configure environment variables (.env via django-environ)

#### B. Model Implementation ✅

- [x] Create migration files for all 18 models
- [x] Run migrations and verify database schema
- [x] Create model admin interfaces (with django-jazzmin)
- [x] Add `__str__` methods for all models
- [x] Implement validation methods (e.g., `Category.clean()`)

#### C. Model Methods (Critical TODOs) ✅

All critical model methods have been implemented:

**UserProfile:**

- [x] `calculate_level()` - XP to level conversion
- [x] `award_experience_points()` - Give points for actions
- [x] `get_current_rank()` - User's leaderboard position

**Category:**

- [x] `get_categories_for_user()` - Filter by user's target branch
- [x] `user_can_access()` - Permission checking

**Question:**

- [x] `get_accuracy_rate()` - Calculate success rate
- [x] `check_duplicate()` - Detect similar public questions
- [x] `schedule_publication()` - Set monthly release date

**MockTest:**

- [x] `generate_from_categories()` - Auto-create tests
- [x] `get_average_score()` - Test difficulty metric
- [x] `get_completion_rate()` - Track completion percentage

**UserAttempt:**

- [x] `calculate_results()` - Score and percentage
- [x] `complete_attempt()` - Finalize and update stats
- [x] `get_time_remaining()` - For timed tests

**LeaderBoard:**

- [x] `recalculate_rankings()` - Weekly/monthly refresh
- [x] `get_top_users()` - Top N performers
- [x] `update_score()` - Incremental score updates

**PlatformStats:**

- [x] `refresh_stats()` - Update all counters
- [x] `scheduled_update()` - Hourly cron job
- [x] `reset_monthly_stats()` - Monthly reset

**UserStatistics:**

- [x] `update_streak()` - Track consecutive days
- [x] `check_badge_eligibility()` - Award achievements
- [x] `get_accuracy_percentage()` - Overall performance
- [x] `get_badges_list()` - Return earned badges

#### D. Django Signals (signals.py) ✅

- [x] Post-save on `UserAnswer`:
  - Update `Question.times_attempted` and `times_correct`
  - Update `UserProgress` for category
  - Update `UserStatistics`
  - Check and award badges

- [x] Post-save on `Contribution`:
  - Update `UserProfile.total_contributions`
  - Create approval notification
  - Award experience points

- [x] Post-save on `UserAttempt` (when completed):
  - Update `LeaderBoard` entries
  - Update `UserStatistics.mock_tests_completed`
  - Award experience points

- [x] Post-save on `User`:
  - Create `UserProfile` automatically

#### E. Management Commands ✅

- [x] `update_platform_stats` - Refresh dashboard metrics
- [x] `process_monthly_publications` - Publish approved questions
- [x] `recalculate_leaderboards` - Update rankings
- [x] `check_duplicate_questions` - Find similar questions
- [x] `award_badges` - Batch badge checking
- [x] `update_user_streaks` - Daily streak maintenance
- [x] `create_daily_activity` - Daily analytics snapshot
- [x] `seed_data` - Generate test data
- [x] `run_heavy_tasks` - Run background tasks

#### F. Scheduled Tasks (Celery + Celery Beat) ✅

- [x] Set up Celery with Redis/RabbitMQ
- [x] Configure Celery Beat for scheduled tasks

**Hourly:**

- [x] Update platform statistics

**Daily (Midnight NPT):**

- [x] Create daily activity record
- [x] Update user streaks
- [x] Check for streak break notifications

**Weekly:**

- [x] Recalculate weekly leaderboards
- [x] Send weekly summary emails (placeholder)

**Monthly (1st of month):**

- [x] Process approved contributions → public
- [x] Monthly maintenance (reset counters)

**Admin.py ✅**

- [x] Use Better UX for Admin (django-jazzmin)
- [x] Register all models
- [x] Configure model admin interfaces
- [x] Add custom model admin methods
- [x] Custom admin site with categorized models

---

### Phase 1.5: Custom Dashboard & Templates 🎨 ✅ NEW

#### A. Dashboard Templates ✅

- [x] Base template with Bootstrap 5
- [x] Main dashboard with platform statistics
- [x] Activity charts (Chart.js integration)
- [x] Contribution monitoring dashboard
- [x] Question filtering and moderation interface
- [x] Question reports management
- [x] Duplicate detection interface

#### B. Dashboard Features ✅

- [x] Real-time statistics display
- [x] Filter contributions by status, month, year
- [x] Filter questions by status, category, difficulty
- [x] Filter reports by status, reason
- [x] Bulk actions (approve, reject, publish)
- [x] Duplicate question detection
- [x] Contribution detail view with approval workflow
- [x] Question detail view with answer display
- [x] Report resolution workflow

#### C. Contribution Templates ✅

- [x] Question contribution form template
- [x] Guidelines and rewards display
- [x] Consent mechanism

---

### Phase 2: API Development 🔌 ✅

#### A. Serializers ✅

- [x] UserProfileSerializer
- [x] BranchSerializer, SubBranchSerializer
- [x] CategorySerializer (with scope-based filtering)
- [x] QuestionSerializer (with nested answers)
- [x] MockTestSerializer (with question list)
- [x] UserAttemptSerializer, UserAnswerSerializer
- [x] LeaderBoardSerializer
- [x] NotificationSerializer
- [x] PlatformStatsSerializer
- [x] UserStatisticsSerializer
- [x] ContributionSerializer
- [x] DailyActivitySerializer
- [x] StudyCollectionSerializer
- [x] UserProgressSerializer

#### B. ViewSets & Endpoints ✅

All endpoints have been implemented:

**Authentication:**

```
POST   /api/auth/google/              - Google OAuth login ✅
POST   /api/auth/logout/              - Logout ✅
GET    /api/auth/user/                - Current user profile ✅
PATCH  /api/auth/user/                - Update profile ✅
POST   /api/auth/dev-login/           - Development login ✅
```

**Branches & Categories:**

```
GET    /api/branches/                 - List all branches ✅
GET    /api/branches/{id}/            - Branch detail ✅
GET    /api/sub-branches/             - List sub-branches ✅
GET    /api/categories/               - List categories ✅
```

**Questions:**

```
GET    /api/questions/                - List questions ✅
POST   /api/questions/                - Create question ✅
GET    /api/questions/{id}/           - Question detail ✅
PATCH  /api/questions/{id}/           - Update own question ✅
DELETE /api/questions/{id}/           - Delete own question ✅
POST   /api/questions/{id}/consent/   - Give publication consent ✅
```

**Mock Tests:**

```
GET    /api/mock-tests/               - List tests ✅
POST   /api/mock-tests/               - Create custom test ✅
GET    /api/mock-tests/{id}/          - Test detail ✅
POST   /api/mock-tests/generate/      - Auto-generate test ✅
```

**Attempts:**

```
POST   /api/attempts/start/           - Start new attempt ✅
GET    /api/attempts/{id}/            - Attempt detail ✅
POST   /api/attempts/{id}/submit/     - Submit answers ✅
GET    /api/attempts/{id}/results/    - Get results ✅
POST   /api/answers/                  - Submit individual answer ✅
```

**Progress & Stats:**

```
GET    /api/progress/                 - User progress ✅
GET    /api/statistics/me/            - User statistics ✅
GET    /api/platform-stats/           - Platform stats ✅
GET    /api/leaderboard/              - Leaderboard ✅
GET    /api/daily-activity/           - Activity trends ✅
```

**Study Collections:**

```
GET    /api/collections/              - User's collections ✅
POST   /api/collections/              - Create collection ✅
PATCH  /api/collections/{id}/         - Update collection ✅
DELETE /api/collections/{id}/         - Delete collection ✅
POST   /api/collections/{id}/add_questions/     - Add questions ✅
POST   /api/collections/{id}/remove_questions/  - Remove questions ✅
```

**Notifications:**

```
GET    /api/notifications/            - User notifications ✅
PATCH  /api/notifications/{id}/read/  - Mark as read ✅
POST   /api/notifications/read-all/   - Mark all as read ✅
GET    /api/notifications/unread/     - Unread count ✅
```

**Dashboard (Staff Only):**

```
GET    /dashboard/                    - Main dashboard ✅
GET    /dashboard/contributions/      - Contributions list ✅
GET    /dashboard/contribution/{id}/  - Contribution detail ✅
POST   /dashboard/contribution/{id}/approve/    - Approve ✅
POST   /dashboard/contribution/reject/          - Reject ✅
POST   /dashboard/contribution/{id}/make-public/ - Make public ✅
GET    /dashboard/questions/          - Questions list ✅
GET    /dashboard/question/{id}/      - Question detail ✅
POST   /dashboard/question/{id}/publish/ - Publish question ✅
POST   /dashboard/question/{id}/verify/  - Verify question ✅
GET    /dashboard/question/{id}/check-duplicate/ - Check duplicates ✅
GET    /dashboard/reports/            - Reports list ✅
POST   /dashboard/report/{id}/resolve/ - Resolve report ✅
```

#### C. Permissions & Authentication ✅

- [x] IsAuthenticated for all user-specific endpoints
- [x] IsOwnerOrReadOnly for user-created content
- [ ] IsAdminUser for moderation endpoints
- [ ] Custom permission: CanAccessCategory (based on user's branch)

#### D. Filtering, Pagination, Search ✅

- [x] Django Filter Backend for complex filters
- [x] PageNumberPagination (default 20 items)
- [x] SearchFilter for questions, tests, categories
- [x] OrderingFilter for leaderboards, attempts

---

### Phase 3: React Native Frontend 📱

> **Note:** Frontend is out of scope for this backend implementation. The backend API is ready for React Native integration.

#### A. Project Setup

- [ ] Initialize React Native project
- [ ] Set up navigation (React Navigation)
- [ ] Configure state management (Redux/Context)
- [ ] Set up API client (Axios/Fetch)
- [ ] Configure Google OAuth SDK
- [ ] Set up environment configs (dev/prod)

#### B. Core Screens

**Authentication Flow:**

- [ ] Splash Screen
- [ ] Login Screen (Google Sign-In)
- [ ] Onboarding (select target branch/sub-branch)

**Main Navigation (Bottom Tabs):**

- [ ] Home/Dashboard Screen
- [ ] Practice Screen
- [ ] Mock Tests Screen
- [ ] Leaderboard Screen
- [ ] Profile Screen

**Home/Dashboard:**

- [ ] Platform statistics card
- [ ] User statistics card
- [ ] Study streak indicator
- [ ] Quick actions (Practice, Take Test, Contribute)
- [ ] Recent activity feed

**Practice Screen:**

- [ ] Category list (filtered by user's branch)
- [ ] Study collections
- [ ] Filter by difficulty
- [ ] Quick practice (random questions)
- [ ] Question detail with explanation
- [ ] Answer submission and immediate feedback

**Mock Tests Screen:**

- [ ] Official tests list
- [ ] Community tests list
- [ ] Custom test creator
- [ ] Test detail (duration, questions count, pass %)
- [ ] Test taking interface:
  - Timer countdown
  - Question navigator
  - Mark for review
  - Submit confirmation
- [ ] Results screen with detailed breakdown

**Leaderboard Screen:**

- [ ] Time period selector (Weekly/Monthly/All-Time)
- [ ] Branch filter
- [ ] Top performers list
- [ ] Current user rank highlight
- [ ] User detail modal

**Profile Screen:**

- [ ] User info and avatar
- [ ] Statistics overview
- [ ] Badges earned
- [ ] Contribution history
- [ ] Study collections
- [ ] Settings:
  - Language preference
  - Target branch/sub-branch
  - Notification settings
  - Logout

**Additional Screens:**

- [ ] Question contribution form
- [ ] Question report form
- [ ] Notification list
- [ ] Category detail
- [ ] User progress detail (per category)
- [ ] Study collection detail

#### C. Components Library

- [ ] Button (Primary, Secondary, Outlined)
- [ ] Input (Text, Select, Date)
- [ ] Card (Question, Test, Stats, User)
- [ ] Badge (Achievement, Difficulty, Status)
- [ ] Modal (Confirmation, Info, Error)
- [ ] ProgressBar (Circular, Linear)
- [ ] Timer (Countdown)
- [ ] EmptyState (No data placeholder)
- [ ] LoadingSpinner
- [ ] Avatar
- [ ] TabBar (Custom bottom tabs)

#### D. Features Implementation

- [ ] Offline question caching (for practice mode)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Deep linking (for notification actions)
- [ ] Image upload (question/profile pictures)
- [ ] Bilingual support (i18n)
- [ ] Dark mode support
- [ ] Analytics tracking (Firebase Analytics)

---

### Phase 4: Testing & Quality Assurance 🧪

#### A. Backend Testing

- [ ] Unit tests for model methods
- [ ] Unit tests for serializers
- [ ] API endpoint tests
- [ ] Signal tests
- [ ] Management command tests
- [ ] Load testing (simulate 1000+ concurrent users)

#### B. Frontend Testing

- [ ] Component unit tests (Jest)
- [ ] Integration tests (React Native Testing Library)
- [ ] E2E tests (Detox)
- [ ] Device compatibility testing (iOS/Android)
- [ ] Accessibility testing

#### C. QA Checklist

- [ ] Cross-browser testing (admin panel)
- [ ] Cross-device testing (mobile)
- [ ] Bilingual content verification
- [ ] Edge case handling (network errors, timeouts)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Performance optimization (query optimization, caching)

---

### Phase 5: Deployment & DevOps 🚀

#### A. Backend Deployment

- [ ] Set up production server (AWS/DigitalOcean/Heroku)
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for Celery
- [ ] Configure Nginx + Gunicorn
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure static/media file serving (S3/CDN)
- [ ] Set up automated backups
- [ ] Configure monitoring (Sentry, New Relic)

#### B. Frontend Deployment

- [ ] Build release APK (Android)
- [ ] Build release IPA (iOS)
- [ ] Submit to Google Play Store
- [ ] Submit to Apple App Store
- [ ] Set up OTA updates (CodePush/Expo Updates)

#### C. CI/CD Pipeline

- [ ] GitHub Actions / GitLab CI
- [ ] Automated testing on PR
- [ ] Automated deployment to staging
- [ ] Manual approval for production
- [ ] Database migration automation

---

### Phase 6: Post-Launch 🎉

#### A. Monitoring & Maintenance

- [ ] Daily monitoring of server health
- [ ] Weekly review of error logs
- [ ] Monthly security updates
- [ ] User feedback collection
- [ ] Bug fix releases

#### B. Content Moderation

- [ ] Daily review of reported questions
- [ ] Weekly approval of contributions
- [ ] Monthly Facebook shoutouts
- [ ] Quality control audits

#### C. Feature Enhancements (Future)

- [ ] Video explanations for questions
- [ ] Live mock tests (scheduled events)
- [ ] Peer-to-peer study groups
- [ ] Discussion forums per category
- [ ] AI-powered personalized study plans
- [ ] Integration with official PSC announcements
- [ ] Payment system for premium features
- [ ] WhatsApp/Viber bot for daily questions

---

## 🎯 Success Metrics

### User Engagement

- [ ] 5,000+ registered users in 6 months
- [ ] 50,000+ questions in database
- [ ] 100,000+ mock tests taken
- [ ] 70%+ monthly active user rate

### Content Quality

- [ ] 95%+ question approval rate
- [ ] <2% duplicate questions
- [ ] <5% reported questions

### Performance

- [ ] API response time <500ms (p95)
- [ ] App crash rate <1%
- [ ] 99.9% uptime

---

## 📝 Development Guidelines

### Code Standards

- Follow PEP 8 for Python code
- Use ESLint + Prettier for JavaScript
- Write docstrings for all functions
- Maintain test coverage >80%

### Git Workflow

- Main branch: `main` (production)
- Development branch: `dev`
- Feature branches: `feature/feature-name`
- Bugfix branches: `bugfix/issue-number`
- Commit message format: `type(scope): description`

### Documentation

- Update README for major changes
- Document all API endpoints in Postman/Swagger
- Maintain changelog (CHANGELOG.md)
- Write user guides for app features

---

## 👥 Team Roles (Suggested)

- **Backend Developer:** Django models, APIs, signals, cron jobs
- **Frontend Developer:** React Native UI, state management, navigation
- **UI/UX Designer:** App design, user flows, visual assets
- **QA Engineer:** Testing, bug tracking, quality assurance
- **DevOps Engineer:** Server setup, CI/CD, monitoring
- **Content Moderator:** Question approval, quality control
- **Community Manager:** Facebook shoutouts, user engagement

---

## 📚 Resources & References

### Documentation

- Django: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- React Native: https://reactnative.dev/
- Celery: https://docs.celeryproject.org/

### Third-Party Services

- Google OAuth: https://developers.google.com/identity
- Firebase (Push Notifications): https://firebase.google.com/
- AWS S3 (File Storage): https://aws.amazon.com/s3/

---

## 🐛 Known Issues & Limitations

### Current Limitations

- No video explanation support (planned for v2)
- No offline mock test mode (only practice)
- Single language per user session (no on-the-fly switching)

### Technical Debt (To Address)

- Need to implement full-text search for questions
- Optimize leaderboard recalculation (current approach is O(n log n))
- Add caching layer (Redis) for frequently accessed data
- Implement soft delete for questions (instead of hard delete)

---

## 📞 Support & Contact

- **Developer:** [Your Name]
- **Email:** [Your Email]
- **GitHub:** [Repository URL]
- **Facebook Page:** [PSC Exam Prep Community]

---

## 📄 License

[Choose appropriate license - MIT, GPL, etc.]

---

## 🙏 Acknowledgments

- Anthropic's Claude for architecture planning
- Nepal's Public Service Commission for exam patterns
- Open-source community for amazing tools

---

**Last Updated:** January 2026
**Version:** 1.0.0 (Backend Phase Completed)

---

## 📋 Quick Start Guide

### Prerequisites

- Python 3.10+
- pip or uv package manager
- Redis (for Celery tasks)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PSCApp

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.sample .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed sample data (optional)
python manage.py seed_data --users 10 --questions 50 --tests 5

# Start development server
python manage.py runserver
```

### Running Celery (for background tasks)

```bash
# Start Redis
redis-server

# Start Celery worker
celery -A src worker -l info

# Start Celery beat (for scheduled tasks)
celery -A src beat -l info
```

### Access Points

- **Admin Panel:** http://localhost:8000/
- **API Documentation:** http://localhost:8000/docs/
- **Custom Dashboard:** http://localhost:8000/dashboard/
- **API Root:** http://localhost:8000/api/

### Management Commands

```bash
# Update platform statistics
python manage.py update_platform_stats

# Recalculate leaderboards
python manage.py recalculate_leaderboards

# Create daily activity snapshot
python manage.py create_daily_activity

# Process monthly publications
python manage.py process_monthly_publications

# Update user streaks
python manage.py update_user_streaks

# Award badges to eligible users
python manage.py award_badges

# Check for duplicate questions
python manage.py check_duplicate_questions
```
