# 🛠️ Backend Setup Guide

This guide provides step-by-step instructions to set up the PSCApp backend, including the Django web server, Redis broker, and Celery workers for background tasks.

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Python 3.10+**
- **Redis Server** (Used as the message broker for Celery)
- **Database**: PostgreSQL (Recommended) or MySQL
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PSCApp
```

### 2. Set Up Virtual Environment
Using `venv`:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the sample environment file and update the values:
```bash
cp .env.sample .env
```
Open `.env` and configure:
- `SECRET_KEY`: Generate a secure key.
- `DATABASE_URL`: Your database connection string (e.g., `postgresql://user:password@localhost:5432/psc_db`).
- `CELERY_BROKER_URL`: Usually `redis://localhost:6379/0`.
- `CELERY_RESULT_BACKEND`: Usually `redis://localhost:6379/0`.

---

## 🗄️ Database Setup

### 1. Initialize the Database
```bash
python manage.py migrate
```

### 2. Create a Superuser
```bash
python manage.py createsuperuser
```

---

## 📡 Redis and Celery Setup

### 1. Start Redis Server
Ensure Redis is running. On most Linux systems:
```bash
sudo systemctl start redis
# Or if running manually:
redis-server
```

### 2. Start Celery Worker
The worker processes background tasks like analytics and notifications.
```bash
celery -A src worker --loglevel=info
```

### 3. Start Celery Beat
The beat scheduler triggers periodic tasks (hourly, daily, weekly, monthly).
```bash
celery -A src beat --loglevel=info
```

> [!TIP]
> In development, you can run them in separate terminals or use a process manager like `screen` or `tmux`.

---

## 🏃 Running the Application

### Start Development Server
```bash
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000/api/`.
The Admin Dashboard is at `http://127.0.0.1:8000/admin/`.

---

## 🌐 cPanel Deployment Guide

Deploying Django on cPanel usually involves using the **Setup Python App** (Passenger) tool.

### 1. Upload Code
Upload your project files to your cPanel home directory (e.g., `/home/username/PSCApp`). **Do not** put the project code inside `public_html`.

### 2. Create Python Application
1. In cPanel, search for **Setup Python App**.
2. Click **Create Application**.
3. **Python Version**: Select 3.10 or higher.
4. **Application root**: `PSCApp` (or your folder name).
5. **Application URL**: Select your domain/subdomain.
6. **Application startup file**: `passenger_wsgi.py`.
7. **Application entry point**: `application`.
8. Click **Create**.

### 3. Create `passenger_wsgi.py`
In your `application root` folder, create a file named `passenger_wsgi.py`:
```python
import os
import sys

# Update this path to your app's directory
sys.path.insert(0, os.getcwd())

from src.wsgi import application
```

### 4. Install Dependencies in cPanel
1. Copy the command at the top of your Python App page (e.g., `source /home/username/nodevenv/PSCApp/3.10/bin/activate && cd /home/username/PSCApp`).
2. Open cPanel **Terminal**.
3. Paste and run the command to enter the virtual environment.
4. Run:
   ```bash
   pip install -r requirements.txt
   ```

### 5. Static & Media Files
On cPanel, static files must be served from `public_html`.
1. Update `STATIC_ROOT` in `src/settings/production.py` to point to `/home/username/public_html/static`.
2. Run `python manage.py collectstatic`.

### 6. Cron Jobs for Celery (cPanel Alternative)
Shared hosting often doesn't allow long-running processes like Celery workers. You can use **Cron Jobs** for periodic tasks instead of Celery Beat.

In cPanel **Cron Jobs**, add:
```bash
# Every Hour: Update Stats
/home/username/virtualenv/PSCApp/3.10/bin/python /home/username/PSCApp/manage.py update_platform_stats

# Daily Midnight: User Streaks
/home/username/virtualenv/PSCApp/3.10/bin/python /home/username/PSCApp/manage.py update_user_streaks
```

> [!WARNING]
> If your hosting allows **Terminal** access and `Supervisor`, you can run Celery workers normally. Otherwise, you must use Cron Jobs for the maintenance commands.

---

## 🧹 Maintenance Commands

If you need to trigger heavy tasks manually:
```bash
# Recalculate all rankings and stats
python manage.py run_heavy_tasks --all

# Update user streaks only
python manage.py update_user_streaks
```

## 🧪 Running Tests
```bash
python manage.py test
```
