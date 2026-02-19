import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../services/api/client';
import { API_ENDPOINTS } from '../config/api.config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // required in SDK 53+
    shouldShowList: true,    // required in SDK 53+
  }),
});

function isRunningInExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go dropped remote push support in SDK 53 — bail gracefully
  if (isRunningInExpoGo()) {
    console.warn(
      'Push notifications not supported in Expo Go (SDK 53+). ' +
      'Use a dev build: https://docs.expo.dev/develop/development-builds/introduction/'
    );
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Handles both the manual app.json path and the auto-injected eas path
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId || projectId === 'YOUR_EAS_PROJECT_ID') {
    console.error(
      'EAS Project ID missing or still a placeholder. ' +
      'Run `eas init` or set a real projectId in app.json under extra.eas.projectId'
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1565C0',
      });

      await Notifications.setNotificationChannelAsync('streak', {
        name: 'Streak Reminders',
        description: 'Reminders to maintain your study streak',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    return tokenData.data;
  } catch (err) {
    console.error('Failed to get Expo push token:', err);
    return null;
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return;
      setExpoPushToken(token);

      if (accessToken) {
        try {
          await apiRequest(API_ENDPOINTS.notifications.registerPushToken, {
            method: 'POST',
            token: accessToken,
            body: ({ token }),
          });
        } catch (err) {
          console.error('Failed to register push token with backend:', err);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif) => setNotification(notif)
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.action_url) {
          router.push(data.action_url as string as any);
        } else if (data?.related_mock_test) {
          router.push(`/tests/${data.related_mock_test}` as any);
        } else if (data?.type === 'STREAK_ALERT' || data?.type === 'DAILY_REMINDER') {
          router.push('/practice/categories' as any);
        } else {
          router.push('/notifications' as any);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [accessToken, router]);

  return { expoPushToken, notification };
}