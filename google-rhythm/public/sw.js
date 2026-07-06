/**
 * @file sw.js
 * @description Service Worker for Google Rhythm.
 * Runs in the background even when the app tab is closed.
 *
 * Handles background push notifications for:
 *  - Medication alarms (strict, must be dismissed)
 *  - Period predictions (3 days before predicted period)
 *  - Symptom predictions (based on historical patterns)
 *  - Phase transition alerts
 *  - Daily supplement/hydration reminders
 *
 * Served at the root URL `/sw.js` from the `public/` directory.
 */

// ---------------------------------------------------------------------------
// A. Install lifecycle — skip waiting so the new SW takes over immediately.
// ---------------------------------------------------------------------------

/**
 * Install event — activate immediately without waiting for existing tabs to close.
 */
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// B. Activate lifecycle — claim all open clients immediately.
// ---------------------------------------------------------------------------

/**
 * Activate event — claim all open clients so this SW controls them right away.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ---------------------------------------------------------------------------
// C. Push event handler — display notifications triggered by a server push.
// ---------------------------------------------------------------------------

/**
 * Push event — fires when the browser receives a push message from the server.
 * Parses the push payload and shows a notification using the SW registration.
 *
 * Expected payload shape:
 * {
 *   title: string,
 *   body: string,
 *   tag: string,
 *   icon: string,
 *   badge: string,
 *   requireInteraction: boolean,
 *   actions: Array<{ action: string, title: string }>
 * }
 */
self.addEventListener('push', (event) => {
  // Safely parse the push payload, falling back to an empty object.
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      console.warn('[SW] Failed to parse push payload as JSON:', err);
      data = { body: event.data.text() };
    }
  }

  const {
    title,
    body,
    tag,
    icon,
    badge,
    requireInteraction,
    actions,
  } = data;

  /** @type {NotificationOptions} */
  const options = {
    body:                body              || 'Google Rhythm needs your attention.',
    tag:                 tag               || 'rhythm-default',
    icon:                icon              || '/icon-192.png',
    badge:               badge             || '/icon-72.png',
    requireInteraction:  requireInteraction || false,
    actions:             Array.isArray(actions) ? actions : [],
    // Store the full payload so the click handler can access it.
    data,
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Google Rhythm', options)
  );
});

// ---------------------------------------------------------------------------
// D. Notification click handler — focus the app or open a new window.
// ---------------------------------------------------------------------------

/**
 * Notification click event — fires when the user interacts with a notification.
 * Routes the user back to the running app (or opens it) and forwards the
 * clicked action + notification data via postMessage so the app can respond.
 *
 * @param {NotificationEvent} event
 */
self.addEventListener('notificationclick', (event) => {
  // Dismiss the notification bubble.
  event.notification.close();

  const action    = event.action;
  const notifData = event.notification.data;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open in a tab, focus it and post the action.
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action,
              notifData,
            });
            return;
          }
        }

        // App is not open — open a new window pointing at the app root.
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// ---------------------------------------------------------------------------
// E. Message handler — receive commands from the main thread.
// ---------------------------------------------------------------------------

/**
 * Message event — receives commands posted from the main thread via
 * `navigator.serviceWorker.controller.postMessage(...)`.
 *
 * Supported message types:
 *  - SHOW_NOTIFICATION : Display a notification directly.
 *  - SKIP_WAITING      : Force the waiting SW to activate immediately.
 *
 * @param {ExtendableMessageEvent} event
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SHOW_NOTIFICATION') {
    const { title, options } = payload || {};
    if (title) {
      self.registration.showNotification(title, options || {});
    }
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
