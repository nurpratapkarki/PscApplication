# Production Deployment Checklist

Use this checklist before deploying the PSC App backend to production.

## ✅ Pre-Deployment Checks

### Environment Configuration
- [ ] Set `DJANGO_SETTINGS_MODULE=src.settings.production` in environment
- [ ] Generate a secure `SECRET_KEY` (at least 50 characters)
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Set `DATABASE_URL` for production database (PostgreSQL recommended)
- [ ] Configure `REDIS_URL` for channels and caching
- [ ] Configure `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND`
- [ ] Set up email configuration (`EMAIL_HOST`, `EMAIL_PORT`, etc.)
- [ ] Configure Google OAuth credentials
- [ ] Set `FRONTEND_URL` for CORS configuration

### Security
- [ ] `DEBUG = False` is set in production.py ✅ (Already configured)
- [ ] `SECURE_SSL_REDIRECT = True` ✅ (Already configured)
- [ ] `SECURE_HSTS_SECONDS = 31536000` ✅ (Already configured)
- [ ] `SESSION_COOKIE_SECURE = True` ✅ (Already configured)
- [ ] `CSRF_COOKIE_SECURE = True` ✅ (Already configured)
- [ ] All secrets are stored in environment variables, not in code ✅

### Database
- [ ] Run `python manage.py migrate` on production database
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Verify database indexes are created (Django handles this)

### Static Files
- [ ] Run `python manage.py collectstatic`
- [ ] Verify WhiteNoise is serving static files correctly
- [ ] Configure media file storage (local or S3)

### Background Tasks
- [ ] Redis server is running
- [ ] Celery worker is configured: `celery -A src worker -l info`
- [ ] Celery beat is configured for scheduled tasks: `celery -A src beat -l info`

## ✅ Features Verified

### Core API Endpoints
- [x] Authentication (Google OAuth, JWT)
- [x] User profile management
- [x] Branch/SubBranch/Category CRUD
- [x] Question CRUD with filtering
- [x] Mock test generation
- [x] User attempts and scoring
- [x] Notifications
- [x] Leaderboard
- [x] Platform statistics

### Dashboard (Staff Only)
- [x] Platform overview statistics
- [x] Contribution moderation
- [x] Question filtering and management
- [x] Report resolution workflow
- [x] Duplicate detection

### Management Commands
- [x] `update_platform_stats` - Hourly stats refresh
- [x] `create_daily_activity` - Daily activity snapshot
- [x] `recalculate_leaderboards` - Weekly ranking update
- [x] `update_user_streaks` - Daily streak maintenance
- [x] `award_badges` - Badge eligibility check
- [x] `process_monthly_publications` - Monthly question publication
- [x] `seed_data` - Test data generation

### Tests
- [x] All 38 tests pass
- [x] CodeQL security scan: 0 vulnerabilities

## ✅ Production Configuration Summary

| Setting | Development | Production |
|---------|-------------|------------|
| DEBUG | True | False |
| Database | SQLite | PostgreSQL/MySQL |
| Channel Layers | InMemory | Redis |
| Email Backend | Console | SMTP |
| Static Files | Local | WhiteNoise |
| SSL/HTTPS | Disabled | Enabled |
| CORS | Allow All | Whitelist |

## 🚀 Deployment Commands

```bash
# Set environment
export DJANGO_SETTINGS_MODULE=src.settings.production

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser

# Start with Gunicorn (production WSGI)
gunicorn src.wsgi:application --bind 0.0.0.0:8000 --workers 4

# Start Celery worker
celery -A src worker -l info

# Start Celery beat
celery -A src beat -l info
```

## ⚠️ Known Issues (Third-Party Library Warnings)

These warnings are from third-party libraries and don't affect functionality:
- `dj_rest_auth`: Deprecation warnings about `ACCOUNT_EMAIL_REQUIRED` settings
- `drf_spectacular`: Schema generation warnings for some ViewSets

## 📋 Post-Deployment Verification

1. Access admin panel at `https://yourdomain.com/`
2. Access custom dashboard at `https://yourdomain.com/dashboard/`
3. Test API endpoints at `https://yourdomain.com/api/`
4. Verify Google OAuth login works
5. Check Celery tasks are executing (view logs)
6. Run `python manage.py update_platform_stats` to initialize stats
