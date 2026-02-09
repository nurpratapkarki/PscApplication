FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files and install
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

# Copy project files
COPY . .

# Collect static files
RUN DJANGO_SETTINGS_MODULE=src.settings.production \
    SECRET_KEY=build-placeholder \
    DATABASE_URL=sqlite:///tmp/build.db \
    EMAIL_HOST=localhost \
    EMAIL_HOST_USER=noreply@example.com \
    EMAIL_HOST_PASSWORD=placeholder \
    GOOGLE_CLIENT_ID=placeholder \
    GOOGLE_SECRET=placeholder \
    uv run python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["uv", "run", "gunicorn", "src.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
