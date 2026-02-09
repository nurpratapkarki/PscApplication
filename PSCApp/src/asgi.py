"""generated with djinit"""

import os

import environ
from django.core.asgi import get_asgi_application

env = environ.Env()
environ.Env.read_env()

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    env("DJANGO_SETTINGS_MODULE", default="core.settings.production"),
)
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

import src.routing  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(src.routing.websocket_urlpatterns)),
    }
)
