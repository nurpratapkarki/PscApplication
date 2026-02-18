"""
Expo Push Notification Service.

Uses the Expo Push API to send push notifications to mobile devices.
Docs: https://docs.expo.dev/push-notifications/sending-notifications/
"""

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    badge: Optional[int] = None,
    sound: str = "default",
) -> bool:
    """Send a single push notification via Expo's push API."""
    if not token or not token.startswith("ExponentPushToken["):
        logger.warning("Invalid push token: %s", token)
        return False

    message = {
        "to": token,
        "title": title,
        "body": body,
        "sound": sound,
    }
    if data:
        message["data"] = data
    if badge is not None:
        message["badge"] = badge

    try:
        response = httpx.post(
            EXPO_PUSH_URL,
            json=message,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        result = response.json()
        if response.status_code == 200 and result.get("data", {}).get("status") == "ok":
            return True
        logger.warning("Push notification failed: %s", result)
        return False
    except Exception as e:
        logger.error("Push notification error: %s", e)
        return False


def send_bulk_push_notifications(
    tokens: list[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
    badge: Optional[int] = None,
    sound: str = "default",
) -> dict:
    """
    Send push notifications to multiple tokens in batches of 100.
    Returns {"sent": count, "failed": count, "errors": [...]}.
    """
    valid_tokens = [t for t in tokens if t and t.startswith("ExponentPushToken[")]
    if not valid_tokens:
        return {"sent": 0, "failed": 0, "errors": []}

    messages = []
    for token in valid_tokens:
        msg = {
            "to": token,
            "title": title,
            "body": body,
            "sound": sound,
        }
        if data:
            msg["data"] = data
        if badge is not None:
            msg["badge"] = badge
        messages.append(msg)

    sent = 0
    failed = 0
    errors = []

    # Expo recommends batches of 100
    for i in range(0, len(messages), 100):
        batch = messages[i : i + 100]
        try:
            response = httpx.post(
                EXPO_PUSH_URL,
                json=batch,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            result = response.json()
            for item in result.get("data", []):
                if item.get("status") == "ok":
                    sent += 1
                else:
                    failed += 1
                    errors.append(item.get("message", "Unknown error"))
        except Exception as e:
            logger.error("Bulk push notification error for batch %d: %s", i, e)
            failed += len(batch)
            errors.append(str(e))

    logger.info("Bulk push: sent=%d, failed=%d", sent, failed)
    return {"sent": sent, "failed": failed, "errors": errors[:10]}


def send_push_to_user(user, title_en: str, body_en: str, data: Optional[dict] = None) -> bool:
    """Send push notification to a specific user if they have a token and push enabled."""
    try:
        profile = user.profile
    except Exception:
        return False

    if not profile.push_notifications_enabled or not profile.expo_push_token:
        return False

    return send_push_notification(
        token=profile.expo_push_token,
        title=title_en,
        body=body_en,
        data=data,
    )


def send_push_to_all_users(
    title_en: str, body_en: str, data: Optional[dict] = None
) -> dict:
    """Send push notification to all users with valid tokens and push enabled."""
    from src.models.user import UserProfile

    tokens = list(
        UserProfile.objects.filter(
            push_notifications_enabled=True,
            expo_push_token__isnull=False,
        )
        .exclude(expo_push_token="")
        .values_list("expo_push_token", flat=True)
    )

    return send_bulk_push_notifications(
        tokens=tokens,
        title=title_en,
        body=body_en,
        data=data,
    )
