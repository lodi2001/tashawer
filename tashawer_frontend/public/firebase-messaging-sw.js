// Firebase Cloud Messaging Service Worker
// This handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - must match the app config
const firebaseConfig = {
  apiKey: 'AIzaSyCx4ABeaxqUz93FYqsurg0aMBH75iHEg7o',
  authDomain: 'tashawer-22207.firebaseapp.com',
  projectId: 'tashawer-22207',
  storageBucket: 'tashawer-22207.firebasestorage.app',
  messagingSenderId: '792696060280',
  appId: '1:792696060280:web:9bf61b065a19f25769f08d',
  measurementId: 'G-NTW72992RC',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Tashawer';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/images/Tashawer_Logo_Final.png',
    badge: '/images/Tashawer_Logo_Final.png',
    tag: payload.data?.notification_id || 'tashawer-notification',
    data: payload.data,
    // Actions based on notification type
    actions: getNotificationActions(payload.data?.notification_type),
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  // Get the action URL from notification data
  const actionUrl = event.notification.data?.action_url || '/notifications';

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: actionUrl,
          });
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});

// Get notification actions based on type
function getNotificationActions(notificationType) {
  const actionsMap = {
    new_message: [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' },
    ],
    order_created: [
      { action: 'view', title: 'View Order' },
    ],
    proposal_received: [
      { action: 'view', title: 'View Proposal' },
    ],
    payment_received: [
      { action: 'view', title: 'View Details' },
    ],
    dispute_opened: [
      { action: 'respond', title: 'Respond' },
    ],
  };

  return actionsMap[notificationType] || [{ action: 'view', title: 'View' }];
}
