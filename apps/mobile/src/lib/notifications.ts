import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure default notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Normalizes a target notification route or URL to an internal app route.
 */
export function normalizeNotificationRoute(data?: Record<string, any> | null): string | null {
  if (!data) return null;

  const rawRoute = data.route || data.url || data.path;
  if (!rawRoute || typeof rawRoute !== 'string') return null;

  // Handle deep link scheme or full domain url
  let path = rawRoute;
  if (path.startsWith('q2l://')) {
    path = path.replace('q2l://', '/');
  } else if (path.startsWith('https://quick2learn.in/')) {
    path = path.replace('https://quick2learn.in/', '/');
  }

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return path;
}

/**
 * Handles an incoming notification response (tap action) and navigates to the target route.
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  try {
    const data = response?.notification?.request?.content?.data;
    const targetRoute = normalizeNotificationRoute(data);

    if (targetRoute) {
      // Delay slightly if cold start so router is fully mounted
      setTimeout(() => {
        try {
          router.push(targetRoute as any);
        } catch (err) {
          console.warn('[Notifications] Failed to navigate to route:', targetRoute, err);
        }
      }, 150);
    }
  } catch (error) {
    console.warn('[Notifications] Error handling notification response:', error);
  }
}

/**
 * Sets up push notification response listeners for foreground, background, and cold start (killed app).
 * Returns a cleanup function.
 */
export function setupNotificationListeners(): () => void {
  // 1. Cold start / Killed app: check if app was opened by tapping a notification
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    })
    .catch((err) => {
      console.warn('[Notifications] Error getting initial notification response:', err);
    });

  // 2. Foreground & Background tap response listener
  const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

  return () => {
    subscription.remove();
  };
}
