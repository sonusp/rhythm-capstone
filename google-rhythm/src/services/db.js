import Dexie from 'dexie';
import { applyEncryptionMiddleware, cryptoOptions } from 'dexie-encrypted';
import { useAppStore } from '../store/useAppStore';

export const db = new Dexie('GoogleRhythmAppDB');

// Generate or retrieve a 32-byte symmetric key for at-rest encryption
const getOrCreateSymmetricKey = () => {
  const stored = localStorage.getItem('_gr_vault_key');
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const newKey = window.crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem('_gr_vault_key', JSON.stringify(Array.from(newKey)));
  return newKey;
};

const symmetricKey = getOrCreateSymmetricKey();

// Apply encryption middleware BEFORE versioning
// This ensures PII is encrypted at rest in the browser while preserving queryable indices.
applyEncryptionMiddleware(db, symmetricKey, {
  userLogs: cryptoOptions.NON_INDEXED_FIELDS,
  labResults: cryptoOptions.NON_INDEXED_FIELDS,
  phaseHistory: cryptoOptions.NON_INDEXED_FIELDS
});

// Version 1 (Legacy schema)
db.version(1).stores({
  userLogs: '++id, date, mode, phase, cycleDay',
  insightsCache: '[date+mode], date, mode',
  labResults: '++id, date, type, value',
  notifications: '++id, scheduledFor, type, fired, tag',
  phaseHistory: '++id, startDate, phase, mode'
});

// Version 2 (Encrypted schema)
db.version(2).stores({
  userLogs: '++id, date, mode, phase, cycleDay',
  insightsCache: '[date+mode], date, mode',
  labResults: '++id, date, type, value',
  notifications: '++id, scheduledFor, type, fired, tag',
  phaseHistory: '++id, startDate, phase, mode'
});
// ---------------------------------------------------------------------------
// Log helpers
// ---------------------------------------------------------------------------

/**
 * Inserts or updates a log entry keyed by its date field.
 * Using put() prevents duplicate rows for the same calendar day.
 *
 * @param {Object} logEntry - must have a `date` field (YYYY-MM-DD)
 */
export const upsertLog = async (logEntry) => {
  try {
    // Ensure date field exists
    if (!logEntry.date) {
      logEntry.date = new Date().toISOString().split('T')[0];
    }
    
    // The user explicitly requested to KEEP logs separated (multiple per day)
    // rather than merging them. So we just add the new log as an independent row.
    await db.userLogs.add(logEntry);
    
    // Trigger the global dashboard listener so Llama 3.1 knows to generate a new Custom Plan
    useAppStore.getState().triggerLogUpdate();
    
    console.log('New separated log inserted to IndexedDB for date:', logEntry.date);
  } catch (error) {
    console.error('Failed to add separated log to IndexedDB', error);
    throw error;
  }
};

// Keep backward-compatible aliases
export const saveLogLocally = upsertLog;
export const addLog = upsertLog;

/**
 * Returns all logs stored in IndexedDB.
 * @returns {Promise<Array>}
 */
export const getLocalLogs = async () => {
  return await db.userLogs.toArray();
};

/**
 * Gets all logs between two ISO date strings (inclusive).
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export const getLogsForRange = async (startDate, endDate) => {
  return await db.userLogs
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
};

/**
 * Gets the most recent N logs, sorted by date descending.
 *
 * @param {number} count - how many logs to return (default 30)
 * @returns {Promise<Array>}
 */
export const getRecentLogs = async (count = 30) => {
  const all = await db.userLogs.toArray();
  return all
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
};

/**
 * Gets a single log by exact date.
 *
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Object|undefined>}
 */
export const getLogByDate = async (date) => {
  return await db.userLogs.where('date').equals(date).toArray();
};

/**
 * Deletes a log by date.
 *
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<void>}
 */
export const deleteLogByDate = async (date) => {
  const logsToDelete = await db.userLogs.where('date').equals(date).toArray();
  for (const log of logsToDelete) {
    await db.userLogs.delete(log.id);
  }
};

/**
 * Bulk-imports an array of log objects. Falls through to bulkAdd so
 * callers importing from a backup can still use this function.
 *
 * @param {Array} logs
 * @returns {Promise<number>} number of logs added
 */
export const bulkImportLogs = async (logs) => {
  try {
    await db.userLogs.bulkAdd(logs);
    useAppStore.getState().triggerLogUpdate();
    return logs.length;
  } catch (error) {
    console.error('Failed to bulk import logs:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Insights cache helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves a cached AI insight for a given date + lifecycle mode combination.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} mode - lifecycle mode (e.g. 'cycle', 'pregnancy')
 * @returns {Promise<Object|undefined>}
 */
export const getCachedInsight = async (date, mode) => {
  try {
    return await db.insightsCache.get([date, mode]);
  } catch (err) {
    console.warn('Failed to read insights cache (schema mismatch likely):', err);
    return undefined;
  }
};

/**
 * Saves an AI insight to the local cache.
 *
 * @param {string} date    - YYYY-MM-DD
 * @param {string} mode    - lifecycle mode
 * @param {string} insight - the insight text/object to store
 * @returns {Promise<void>}
 */
export const saveCachedInsight = async (date, mode, insight) => {
  try {
    await db.insightsCache.put({ date, mode, insight });
  } catch (err) {
    console.warn('Failed to write insights cache:', err);
  }
};

// ---------------------------------------------------------------------------
// Lab results helpers
// ---------------------------------------------------------------------------

/**
 * Saves a lab result entry.
 *
 * @param {Object} result - lab result object (type, value, date, etc.)
 * @returns {Promise<number>} - the auto-incremented id of the new record
 */
export const saveLabResult = async (result) => {
  return await db.labResults.add({
    ...result,
    date: result.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });
};

/**
 * Gets all lab results, sorted by date descending.
 *
 * @returns {Promise<Array>}
 */
export const getLabResults = async () => {
  const results = await db.labResults.toArray();
  return results.sort((a, b) => b.date.localeCompare(a.date));
};

// ---------------------------------------------------------------------------
// Notification queue helpers
// ---------------------------------------------------------------------------

/**
 * Schedules a notification in the DB queue.
 *
 * @param {Object} notification - must include scheduledFor (ISO string) and type
 * @returns {Promise<number>} - the auto-incremented id of the new record
 */
export const scheduleNotificationInDB = async (notification) => {
  return await db.notifications.add({
    ...notification,
    fired: false,
    createdAt: new Date().toISOString()
  });
};

/**
 * Gets all unfired notifications scheduled before or at the given ISO time.
 *
 * @param {string} before - ISO timestamp (default: now)
 * @returns {Promise<Array>}
 */
export const getPendingNotifications = async (before = new Date().toISOString()) => {
  return await db.notifications
    .where('fired')
    .equals(0)
    .filter(n => n.scheduledFor <= before)
    .toArray();
};

/**
 * Marks a notification as fired so it won't be returned by getPendingNotifications.
 *
 * @param {number} id - notification record id
 * @returns {Promise<void>}
 */
export const markNotificationFired = async (id) => {
  await db.notifications.update(id, { fired: true });
};

// ---------------------------------------------------------------------------
// Data export / import helpers
// ---------------------------------------------------------------------------

/**
 * Exports all application data (logs, insights cache, and localStorage settings)
 * as a plain object suitable for JSON serialisation.
 *
 * @returns {Promise<{logs: Array, insightsCache: Array, localSettings: string|null}>}
 */
export const exportAllData = async () => {
  const logs = await db.userLogs.toArray();
  const insightsCache = await db.insightsCache.toArray();

  // Also backup user preferences from Zustand's localStorage
  const localSettings = localStorage.getItem('google-rhythm-storage');

  return { logs, insightsCache, localSettings };
};

/**
 * Imports a previously exported data bundle, replacing all local data.
 * Triggers a page reload after restoring user preferences.
 *
 * @param {{ logs: Array, insightsCache: Array, localSettings: string|null }} data
 * @returns {Promise<void>}
 */
export const importAllData = async (data) => {
  await db.transaction('rw', db.userLogs, db.insightsCache, async () => {
    await db.userLogs.clear();
    await db.insightsCache.clear();
    if (data.logs && data.logs.length > 0) {
      await db.userLogs.bulkAdd(data.logs);
    }
    if (data.insightsCache && data.insightsCache.length > 0) {
      await db.insightsCache.bulkAdd(data.insightsCache);
    }
  });

  // Restore user preferences
  if (data.localSettings) {
    localStorage.setItem('google-rhythm-storage', data.localSettings);
    // Give the DB a tiny ms to settle, then reload to apply the restored Zustand state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
};
