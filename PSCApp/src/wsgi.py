"""generated with djinit"""

import os

import environ
from django.core.wsgi import get_wsgi_application

env = environ.Env()
environ.Env.read_env()

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    env("DJANGO_SETTINGS_MODULE", default="src.settings.production"),
)

application = get_wsgi_application()
