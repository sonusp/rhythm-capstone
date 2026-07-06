/**
 * @file cycleAlertManager.js
 * @description Unified alert brain for Google Rhythm.
 * Centralises ALL alert and alarm logic that was previously scattered in App.jsx.
 *
 * This module is framework-agnostic and is designed to be consumed from a
 * React hook or `useEffect` — not called directly from a component render.
 *
 * Key responsibilities:
 *  1. Medication alarm polling (replaces the setInterval in App.jsx)
 *  2. Daily medication taken-status reset at midnight
 *  3. Period prediction notifications (fired once per day)
 *  4. Symptom forecast hook point (caller supplies pattern data)
 *  5. Phase transition detection and notification
 *
 * Pure browser APIs only — zero external npm dependencies.
 */

import {
  getDaysUntilNextPeriod,
  isPeriodLate,
} from './cycleEngine';

import {
  schedulePeriodPredictionAlert,
  scheduleSymptomPredictionAlert,
  schedulePhaseTransitionAlert,
  scheduleMedicationAlarm,
} from './notificationService';

// ---------------------------------------------------------------------------
// 1. Medication Alarm Checker
// ---------------------------------------------------------------------------

/**
 * Checks the current clock time against all medications that have
 * `strictAlarm: true` and have not yet been marked as `taken`.
 *
 * If a match is found, fires an alarm notification and returns the medication.
 * This function is designed to be called on a short interval (e.g., every 30 s)
 * and replaces the ad-hoc `setInterval` logic previously in App.jsx.
 *
 * @param {Array<{
 *   id: number|string,
 *   name: string,
 *   time: string,
 *   taken: boolean,
 *   strictAlarm: boolean
 * }>} meds - Medications array from the Zustand store.
 * @returns {Promise<Object|null>} The firing medication object, or null if none matched.
 */
export const checkAndFireMedicationAlarms = async (meds = []) => {
  if (!Array.isArray(meds) || meds.length === 0) return null;

  const now = new Date();
  const hh  = now.getHours().toString().padStart(2, '0');
  const mm  = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  // Find the first medication whose alarm time matches right now.
  const firingMed = meds.find(
    (m) => m.strictAlarm === true && m.taken !== true && m.time === currentTime
  );

  if (firingMed) {
    await scheduleMedicationAlarm(firingMed);
    return firingMed;
  }

  return null;
};

/**
 * Catch-up logic for mobile background throttling.
 * Checks if any strict alarm time has already passed today, but wasn't taken.
 */
export const checkMissedAlarms = async (meds = []) => {
  if (!Array.isArray(meds) || meds.length === 0) return null;

  const now = new Date();
  const hh  = now.getHours().toString().padStart(2, '0');
  const mm  = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  // Find the first medication whose alarm time is in the past, and wasn't taken.
  const missedMed = meds.find(
    (m) => m.strictAlarm === true && m.taken !== true && m.time < currentTime
  );

  if (missedMed) {
    await scheduleMedicationAlarm(missedMed);
    return missedMed;
  }

  return null;
};

// ---------------------------------------------------------------------------
// 2. Daily Medication Status Reset
// ---------------------------------------------------------------------------

/**
 * Resets all medications' `taken` status to `false` at the start of a new day.
 * Uses `localStorage` to persist the date of the last reset so the reset runs
 * exactly once per calendar day regardless of how many times the app is opened.
 *
 * Should be called on app load AND at midnight via a scheduled interval.
 *
 * @param {Array<{ id: number|string }>} meds      - Medications array from the store.
 * @param {(id: number|string, updates: Object) => void} updateMed - Zustand `updateMed` action.
 * @returns {void}
 */
export const resetDailyMedStatus = (meds = [], updateMed) => {
  if (!Array.isArray(meds) || typeof updateMed !== 'function') return;

  const today      = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const storedDate = localStorage.getItem('rhythm-med-reset-date');

  if (storedDate !== today) {
    meds.forEach((med) => updateMed(med.id, { taken: false }));
    localStorage.setItem('rhythm-med-reset-date', today);
    console.log('[AlertManager] Daily medication status reset for', today);
  }
};

// ---------------------------------------------------------------------------
// 3. Daily Cycle Notification Checks
// ---------------------------------------------------------------------------

/**
 * Runs all cycle-related notification checks. Designed to be called once per
 * day on app open (idempotent — guarded by a `localStorage` date key).
 *
 * Fires:
 *  - Period prediction alerts at 3 days, 1 day, and 0 days out.
 *  - Logs high-confidence symptom patterns for the caller to act on.
 *
 * @param {{
 *   lastPeriodDate: string,
 *   cycleLength: number,
 *   diagnosedConditions: string[],
 *   lifecycleMode: string
 * }} userPrefs - User preferences slice from the Zustand store.
 * @param {Array<{
 *   symptom: string,
 *   confidence: number,
 *   avgCycleDay: number
 * }>} [patterns=[]] - Pattern objects from `patternEngine.analyzeSymptomPatterns()`.
 *   The caller is responsible for filtering by `currentDay` before passing here.
 * @returns {Promise<void>}
 */
export const runDailyCycleChecks = async (userPrefs, patterns = []) => {
  const { lastPeriodDate, cycleLength, diagnosedConditions, lifecycleMode } =
    userPrefs || {};

  // Nothing to do without a last period date.
  if (!lastPeriodDate) return;

  const today         = new Date().toISOString().split('T')[0];
  const lastCheckDate = localStorage.getItem('rhythm-daily-check-date');

  // Run once per calendar day only.
  if (lastCheckDate === today) return;
  localStorage.setItem('rhythm-daily-check-date', today);

  const hasPCOS = Array.isArray(diagnosedConditions) && diagnosedConditions.includes('PCOS');

  // --- 1. Period prediction alert ---
  // Skip in pregnancy / postpartum lifecycle modes.
  if (lifecycleMode !== 'pregnancy' && lifecycleMode !== 'postpartum') {
    const daysUntil = getDaysUntilNextPeriod(lastPeriodDate, cycleLength);

    if (
      daysUntil !== null &&
      [0, 1, 3].includes(daysUntil) &&
      !isPeriodLate(lastPeriodDate, cycleLength, hasPCOS)
    ) {
      await schedulePeriodPredictionAlert(daysUntil);
    }
  }

  // --- 2. Symptom predictions from pattern engine ---
  // Only process patterns with >= 60 % confidence; cap at 2 alerts per day
  // to avoid overwhelming the user.
  if (Array.isArray(patterns) && patterns.length > 0) {
    const highConfidencePatterns = patterns.filter(
      (p) => typeof p.confidence === 'number' && p.confidence >= 0.6
    );

    const toAlert = highConfidencePatterns.slice(0, 2);

    for (const pattern of toAlert) {
      const { symptom, confidence, daysUntil: patternDaysUntil } = pattern;

      // `daysUntil` on each pattern is expected to be pre-computed by the caller
      // using `currentDay` and `pattern.avgCycleDay`. If not supplied we log only.
      if (typeof patternDaysUntil === 'number' && patternDaysUntil >= 0) {
        await scheduleSymptomPredictionAlert(symptom, patternDaysUntil, confidence);
      } else {
        // Hook point — caller can decide whether to fire or just inspect the log.
        console.log(
          '[AlertManager] High-confidence pattern (no daysUntil provided):',
          symptom,
          '| confidence:', confidence,
          '| avgCycleDay:', pattern.avgCycleDay
        );
      }
    }
  }
};

// ---------------------------------------------------------------------------
// 4. Phase Transition Detection
// ---------------------------------------------------------------------------

/**
 * Fires a phase transition notification when the cycle phase has changed.
 * Compares the previous phase (stored between renders) with the current one.
 *
 * A null `previousPhase` is treated as the very first render — no notification
 * is fired on initial app load.
 *
 * @param {string|null} previousPhase - The phase from the previous render / check.
 * @param {string}      currentPhase  - The phase calculated in the current render.
 * @returns {Promise<void>}
 */
export const checkPhaseTransition = async (previousPhase, currentPhase) => {
  if (!currentPhase) return;

  if (previousPhase && previousPhase !== currentPhase) {
    console.log(
      '[AlertManager] Phase transition detected:',
      previousPhase, '→', currentPhase
    );
    await schedulePhaseTransitionAlert(currentPhase);
  }
};

// ---------------------------------------------------------------------------
// 5. Alert Manager Initialiser
// ---------------------------------------------------------------------------

/**
 * Main entry point for the Alert Manager.
 * Call this from a `useEffect` in App.jsx (or a custom hook) on mount.
 *
 * Sets up:
 *  1. Daily medication taken-status reset (runs immediately + each midnight).
 *  2. Medication alarm polling every 30 seconds.
 *
 * @param {{
 *   lastPeriodDate: string,
 *   cycleLength: number,
 *   diagnosedConditions: string[],
 *   lifecycleMode: string
 * }} userPrefs - User preferences from the Zustand store.
 * @param {Array<{ id: number|string, name: string, time: string, taken: boolean, strictAlarm: boolean }>} meds
 *   Medications array from the Zustand store.
 * @param {(id: number|string, updates: Object) => void} updateMed
 *   Zustand `updateMed` action.
 * @returns {{
 *   cleanup: () => void,
 *   onMedAlarm: (callback: (med: Object) => void) => void
 * }} Object containing a cleanup function and a callback setter.
 *
 * @example
 * // Inside App.jsx useEffect:
 * const { cleanup, onMedAlarm } = initAlertManager(userPrefs, meds, updateMed);
 * onMedAlarm((firingMed) => setAlarmMed(firingMed));
 * return cleanup;
 */
export const initAlertManager = (userPrefs, meds, updateMed) => {
  // ---- Step 1: Reset daily medication status on app open ----
  resetDailyMedStatus(meds, updateMed);

  // ---- Step 2: Schedule midnight reset via a recurring interval ----
  // Calculate ms until the next midnight and set a daily reset from there.
  const now           = new Date();
  const nextMidnight  = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0
  );
  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  // Callback holder for medication alarm events.
  let firingMedCallback = null;

  /** @type {ReturnType<typeof setTimeout>} */
  let midnightTimeoutId;

  /** @type {ReturnType<typeof setInterval>} */
  let midnightIntervalId;

  /** @type {ReturnType<typeof setInterval>} */
  let alarmIntervalId;

  const startMidnightReset = () => {
    // Fire once at midnight, then every 24 hours.
    resetDailyMedStatus(meds, updateMed);
    midnightIntervalId = setInterval(() => {
      resetDailyMedStatus(meds, updateMed);
    }, 24 * 60 * 60 * 1000);
  };

  midnightTimeoutId = setTimeout(startMidnightReset, msUntilMidnight);

  // ---- Step 3: Medication alarm polling (every 30 seconds) ----
  alarmIntervalId = setInterval(async () => {
    // Fetch latest meds array so we don't trigger stale alarms
    const currentMeds = typeof meds === 'function' ? meds() : meds;
    const firingMed = await checkAndFireMedicationAlarms(currentMeds);
    if (firingMed && typeof firingMedCallback === 'function') {
      firingMedCallback(firingMed);
    }
  }, 30_000);

  // ---- Step 4: Missed Alarm Catch-Up (Visibility API) ----
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      console.log('[AlertManager] App became visible. Checking for missed alarms...');
      const currentMeds = typeof meds === 'function' ? meds() : meds;
      const missedMed = await checkMissedAlarms(currentMeds);
      if (missedMed && typeof firingMedCallback === 'function') {
        // Tag it so the UI can optionally display "MISSED ALARM" instead of a normal alert
        firingMedCallback({ ...missedMed, isMissedCatchUp: true });
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // ---- Return the public API ----
  return {
    /**
     * Clears all intervals and timeouts created by initAlertManager.
     * Call this inside the useEffect cleanup function (return value).
     */
    cleanup: () => {
      clearTimeout(midnightTimeoutId);
      clearInterval(midnightIntervalId);
      clearInterval(alarmIntervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('[AlertManager] Cleaned up all intervals and listeners.');
    },

    /**
     * Register a callback to be invoked when a strict medication alarm fires.
     * Typically used to trigger an in-app alarm UI (e.g., a modal).
     *
     * @param {(med: Object) => void} callback
     */
    onMedAlarm: (callback) => {
      firingMedCallback = callback;
    },
  };
};
