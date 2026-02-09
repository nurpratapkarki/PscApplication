from django.urls import path

from src.api.user.views import UserProfileDetailView

urlpatterns = [
    path("", UserProfileDetailView.as_view(), name="user-profile"),
]
