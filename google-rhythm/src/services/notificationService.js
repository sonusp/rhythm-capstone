/**
 * @file notificationService.js
 * @description Main-thread notification manager for Google Rhythm.
 * Pure browser APIs only — zero external npm dependencies.
 *
 * Responsibilities:
 *  - Register the Service Worker (/sw.js)
 *  - Request notification permission from the user
 *  - Show local notifications via the SW registration (or the Notification API)
 *  - Provide typed notification helpers for every alert category in Google Rhythm
 */

// ---------------------------------------------------------------------------
// A. Service Worker Registration
// ---------------------------------------------------------------------------

/**
 * Registers the Service Worker located at /sw.js.
 * Should be called once on app initialisation (e.g., inside main.jsx).
 *
 * @returns {Promise<ServiceWorkerRegistration|null>}
 *   The SW registration object, or null if SW is not supported or registration fails.
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[SW] Registered successfully. Scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// B. Permission Management
// ---------------------------------------------------------------------------

/**
 * Requests browser notification permission from the user.
 * If permission has already been granted, returns 'granted' immediately.
 *
 * @returns {Promise<'granted'|'denied'|'default'>}
 *   The resulting permission state.
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Notification API is not supported in this browser.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// ---------------------------------------------------------------------------
// C. Core Display Helper
// ---------------------------------------------------------------------------

/**
 * Shows a notification immediately using the active Service Worker registration.
 * Falls back to the direct Notification API if the SW is not yet active.
 *
 * @param {string} title - The notification title.
 * @param {NotificationOptions & { requireInteraction?: boolean, actions?: Array<{action:string,title:string}> }} [options={}]
 *   Standard NotificationOptions extended with action buttons.
 * @returns {Promise<void>}
 */
export const showLocalNotification = async (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Notification API not supported.');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notifications] Permission not granted — notification suppressed.');
    return;
  }

  const defaults = {
    icon:  '/icon-192.png',
    badge: '/icon-72.png',
  };

  const mergedOptions = { ...defaults, ...options };

  try {
    // Prefer the Service Worker registration for richer notification support.
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, mergedOptions);
      return;
    }
  } catch (err) {
    console.warn('[Notifications] SW showNotification failed, falling back:', err);
  }

  // Fallback: direct Notification API (limited feature support).
  // eslint-disable-next-line no-new
  new Notification(title, mergedOptions);
};

// ---------------------------------------------------------------------------
// D. Typed Notification Helpers
// ---------------------------------------------------------------------------

/**
 * Schedules a strict medication alarm notification.
 * Uses `requireInteraction: true` so it stays on screen until dismissed.
 * Provides action buttons to mark as taken or snooze for 10 minutes.
 *
 * @param {{ id: number|string, name: string, time: string }} med
 *   Medication object from the Zustand store.
 * @returns {Promise<void>}
 */
export const scheduleMedicationAlarm = async (med) => {
  if (!med || !med.name) {
    console.warn('[Notifications] scheduleMedicationAlarm: invalid med object.');
    return;
  }

  await showLocalNotification(`Time for ${med.name}!`, {
    body: 'Tap to log your medication in Google Rhythm.',
    tag: `med-alarm-${med.id ?? med.name.toLowerCase().replace(/\s/g, '-')}`,
    requireInteraction: true,
    actions: [
      { action: 'taken',  title: 'Mark as Taken' },
      { action: 'snooze', title: 'Snooze 10 min'  },
    ],
  });
};

/**
 * Shows a period prediction notification.
 * Delivers tailored copy depending on how many days remain.
 *
 * @param {number} daysUntil - Days until the predicted period start (0 = today).
 * @returns {Promise<void>}
 */
export const schedulePeriodPredictionAlert = async (daysUntil) => {
  let body;

  if (daysUntil === 0) {
    body = 'Your period is predicted to start today. Take it easy and rest.';
  } else if (daysUntil === 1) {
    body = 'Your period is predicted tomorrow. Pack your essentials tonight.';
  } else {
    body = `Your period is predicted in ${daysUntil} days. A great time to prepare ahead.`;
  }

  await showLocalNotification('Period Forecast 🩸', {
    body,
    tag:  'period-prediction',
    icon: '/icon-192.png',
  });
};

/**
 * Fires a predictive symptom alert based on historical cycle patterns.
 * Confidence is expressed as a percentage in the notification body.
 *
 * @param {string} symptom     - Human-readable symptom name (e.g., 'Bloating').
 * @param {number} daysUntil   - Days until the predicted symptom onset (0 = today).
 * @param {number} confidence  - Confidence score 0–1 from the pattern engine.
 * @returns {Promise<void>}
 */
export const scheduleSymptomPredictionAlert = async (symptom, daysUntil, confidence) => {
  if (!symptom) return;

  const pct  = Math.round((confidence ?? 0) * 100);
  const when =
    daysUntil === 0 ? 'today'
    : daysUntil === 1 ? 'tomorrow'
    : `in ${daysUntil} days`;

  await showLocalNotification('Symptom Forecast 🔮', {
    body: `Based on your history, you may experience ${symptom} ${when} (${pct}% confidence).`,
    tag:  `symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}`,
    icon: '/icon-192.png',
  });
};

/**
 * Alerts the user when they transition to a new menstrual cycle phase.
 * Each phase has a tailored, supportive message.
 *
 * @param {'MENSTRUAL'|'FOLLICULAR'|'OVULATION'|'LUTEAL'|'PCOS'|'PREGNANCY'|'PERIMENOPAUSE'} newPhase
 *   The phase string as returned by calculateCyclePhase() in cycleEngine.js.
 * @returns {Promise<void>}
 */
export const schedulePhaseTransitionAlert = async (newPhase) => {
  /** @type {Record<string, string>} */
  const messages = {
    MENSTRUAL:
      'Your Menstrual phase has begun. Rest deeply and prioritise iron-rich foods.',
    FOLLICULAR:
      'Welcome to your Follicular phase. Energy is rising — embrace it!',
    OVULATION:
      'You are entering your Ovulation window. Peak energy, confidence, and connection.',
    LUTEAL:
      'Your Luteal phase has begun. Focus on nourishment, rest, and gentle movement.',
    PCOS:
      'Cycle tracking in PCOS mode. Focusing on symptom patterns and insulin balance.',
    PREGNANCY:
      'Pregnancy mode active. Prioritising prenatal wellness and baby development.',
    PERIMENOPAUSE:
      'Perimenopause mode. Tracking hormonal shift patterns to support your wellbeing.',
  };

  const body = messages[newPhase] || 'Your cycle phase has updated. Check the dashboard.';

  await showLocalNotification('Phase Update 🌙', {
    body,
    tag:  'phase-transition',
    icon: '/icon-192.png',
  });
};

/**
 * Reminds the user to take their daily supplement stack.
 * Uses the supplements array stored in userPrefs.
 *
 * @param {string[]} [supplements=[]] - Array of supplement names (e.g., ['Magnesium', 'Zinc']).
 * @returns {Promise<void>}
 */
export const scheduleSupplementReminder = async (supplements = []) => {
  const list =
    Array.isArray(supplements) && supplements.length > 0
      ? supplements.join(', ')
      : 'your supplements';

  await showLocalNotification('Daily Stack Reminder 💊', {
    body: `Time to take ${list}. Stay consistent for best results.`,
    tag:  'supplement-reminder',
    icon: '/icon-192.png',
  });
};

// ---------------------------------------------------------------------------
// E. Support Utilities
// ---------------------------------------------------------------------------

/**
 * Checks whether the Notification API is available in the current browser
 * and returns the current permission state.
 *
 * @returns {{ supported: boolean, permission: 'granted'|'denied'|'default'|'not-supported' }}
 */
export const isNotificationSupported = () => {
  const supported = 'Notification' in window;
  return {
    supported,
    permission: supported ? Notification.permission : 'not-supported',
  };
};
