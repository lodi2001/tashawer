import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only on client side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Get Firebase Cloud Messaging instance
 * Returns null if not supported (e.g., server-side, Safari without push)
 */
export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;

  const supported = await isSupported();
  if (!supported) {
    console.log('Firebase Messaging is not supported in this browser');
    return null;
  }

  return getMessaging(app);
}

/**
 * Request permission and get FCM token
 * @returns FCM token or null if permission denied/not supported
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 * @param callback Function to call when a message is received
 * @returns Unsubscribe function
 */
export async function onForegroundMessage(
  callback: (payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => void
): Promise<(() => void) | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback({
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data,
      });
    });
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return null;
  }
}

export { app };
