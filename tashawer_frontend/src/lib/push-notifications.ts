import { requestNotificationPermission, onForegroundMessage } from './firebase';
import api from './api';

/**
 * Register the device for push notifications
 * Requests permission, gets FCM token, and saves it to the backend
 */
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported');
      return false;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Get FCM token
    const token = await requestNotificationPermission();
    if (!token) {
      console.log('Failed to get FCM token');
      return false;
    }

    // Save token to backend
    await saveDeviceToken(token);
    console.log('Device registered for push notifications');
    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
}

/**
 * Save device token to backend
 */
async function saveDeviceToken(token: string): Promise<void> {
  const deviceInfo = getDeviceInfo();
  await api.post('/notifications/devices/', {
    token,
    device_type: 'web',
    device_name: deviceInfo.name,
    device_info: deviceInfo,
  });
}

/**
 * Remove device token from backend (on logout)
 */
export async function unregisterDevice(): Promise<void> {
  try {
    const token = localStorage.getItem('fcm_token');
    if (token) {
      await api.delete(`/notifications/devices/${token}/`);
      localStorage.removeItem('fcm_token');
    }
  } catch (error) {
    console.error('Error unregistering device:', error);
  }
}

/**
 * Get basic device information
 */
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let osName = 'Unknown';

  // Detect browser
  if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Chrome')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
  } else if (userAgent.includes('Mac')) {
    osName = 'macOS';
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
  } else if (userAgent.includes('iOS')) {
    osName = 'iOS';
  }

  return {
    name: `${browserName} on ${osName}`,
    browser: browserName,
    os: osName,
    userAgent,
  };
}

/**
 * Setup foreground notification handler
 * Shows a toast/notification when a message is received while app is open
 */
export function setupForegroundNotifications(
  onNotification: (notification: { title?: string; body?: string; url?: string }) => void
): void {
  onForegroundMessage((payload) => {
    onNotification({
      title: payload.title,
      body: payload.body,
      url: payload.data?.action_url,
    });
  });

  // Also listen for clicks from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        window.location.href = event.data.url;
      }
    });
  }
}

/**
 * Check if push notifications are enabled
 */
export function isPushEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Check if push notifications are blocked
 */
export function isPushBlocked(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'denied';
}
