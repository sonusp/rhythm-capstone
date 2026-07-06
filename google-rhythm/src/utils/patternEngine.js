/**
 * @file patternEngine.js
 * @description Pure JavaScript symptom & cycle pattern analysis engine for Google Rhythm.
 * Zero external dependencies — safe to import in any environment.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the arithmetic mean of a numeric array.
 * Returns 0 for empty arrays.
 * @param {number[]} values
 * @returns {number}
 */
const mean = (values) => {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/**
 * Calculate the population standard deviation of a numeric array.
 * Returns 0 for arrays with fewer than 2 elements.
 * @param {number[]} values
 * @returns {number}
 */
const stdDev = (values) => {
  if (!values || values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squaredDiffs));
};

/**
 * Filter logs to only those within the last N months from today.
 * @param {Array} logs
 * @param {number} months
 * @returns {Array}
 */
const filterByMonths = (logs, months) => {
  if (!logs || logs.length === 0) return [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return logs.filter(log => log.date && log.date >= cutoffStr);
};

// ---------------------------------------------------------------------------
// 1. analyzeSymptomPatterns
// ---------------------------------------------------------------------------

/**
 * Finds symptoms that repeat on similar cycle days across multiple months.
 * Returns an array of pattern objects sorted by confidence descending.
 *
 * @param {Array} logs   - array of log entries from IndexedDB
 * @param {number} months - how many months back to analyze (default 3)
 * @returns {Array<{symptom: string, avgCycleDay: number, occurrences: number, confidence: number, stdDev: number}>}
 */
export const analyzeSymptomPatterns = (logs, months = 3) => {
  if (!logs || logs.length === 0) return [];

  const recent = filterByMonths(logs, months);
  if (recent.length === 0) return [];

  // Build a map: symptomName -> [cycleDays]
  const symptomDaysMap = {};

  recent.forEach(log => {
    const symptoms = Array.isArray(log.symptoms) ? log.symptoms : [];
    const cycleDay = typeof log.cycleDay === 'number' ? log.cycleDay : null;
    if (cycleDay === null) return;

    symptoms.forEach(symptom => {
      if (!symptom) return;
      if (!symptomDaysMap[symptom]) symptomDaysMap[symptom] = [];
      symptomDaysMap[symptom].push(cycleDay);
    });
  });

  const patterns = [];

  Object.entries(symptomDaysMap).forEach(([symptom, cycleDays]) => {
    // Only include symptoms that appear 3+ times
    if (cycleDays.length < 3) return;

    const avgCycleDay = Math.round(mean(cycleDays));
    const sd = parseFloat(stdDev(cycleDays).toFixed(2));
    const occurrences = cycleDays.length;
    // Confidence = occurrences / months, capped at 1.0
    const confidence = parseFloat(Math.min(1.0, occurrences / months).toFixed(2));

    patterns.push({ symptom, avgCycleDay, occurrences, confidence, stdDev: sd });
  });

  // Sort by confidence descending, return top 10
  return patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
};

// ---------------------------------------------------------------------------
// 2. getPainTrend
// ---------------------------------------------------------------------------

/**
 * Analyzes pain score trends over time.
 * Splits logs chronologically into two halves and compares averages.
 *
 * @param {Array} logs   - array of log entries
 * @param {number} months - how many months back to analyze (default 3)
 * @returns {{
 *   avgScore: number,
 *   trend: 'improving'|'worsening'|'stable',
 *   recentAvg: number,
 *   historicalAvg: number,
 *   worstDay: string|null
 * }}
 */
export const getPainTrend = (logs, months = 3) => {
  const defaults = { avgScore: 0, trend: 'stable', recentAvg: 0, historicalAvg: 0, worstDay: null };

  if (!logs || logs.length === 0) return defaults;

  const recent = filterByMonths(logs, months);
  // Filter logs that have a valid pain score
  const painLogs = recent
    .filter(log => log.painDetails && typeof log.painDetails.score === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (painLogs.length === 0) return defaults;

  const scores = painLogs.map(log => log.painDetails.score);
  const avgScore = parseFloat(mean(scores).toFixed(1));

  // Find the worst pain day
  let worstScore = -1;
  let worstDay = null;
  painLogs.forEach(log => {
    if (log.painDetails.score > worstScore) {
      worstScore = log.painDetails.score;
      worstDay = log.date;
    }
  });

  // Split into historical (first half) and recent (second half)
  const midpoint = Math.floor(painLogs.length / 2);
  const historicalLogs = painLogs.slice(0, midpoint);
  const recentLogs = painLogs.slice(midpoint);

  const historicalAvg = parseFloat(mean(historicalLogs.map(l => l.painDetails.score)).toFixed(1));
  const recentAvg = parseFloat(mean(recentLogs.map(l => l.painDetails.score)).toFixed(1));

  let trend = 'stable';
  if (recentAvg < historicalAvg - 1) trend = 'improving';
  else if (recentAvg > historicalAvg + 1) trend = 'worsening';

  return { avgScore, trend, recentAvg, historicalAvg, worstDay };
};

// ---------------------------------------------------------------------------
// 3. detectCycleIrregularity
// ---------------------------------------------------------------------------

/**
 * Detects if the user's cycle appears irregular based on flow log patterns.
 * A cycle is considered irregular if the standard deviation of cycle-gap lengths
 * exceeds 5 days.
 *
 * @param {Array} logs - array of log entries
 * @returns {{
 *   isIrregular: boolean,
 *   avgLength: number,
 *   variation: number,
 *   longestGap: number,
 *   shortestGap: number
 * }}
 */
export const detectCycleIrregularity = (logs) => {
  const defaults = { isIrregular: false, avgLength: 28, variation: 0, longestGap: 0, shortestGap: 0 };

  if (!logs || logs.length === 0) return defaults;

  // Find all dates where flow is not 'None' (potential period start markers)
  const flowDates = logs
    .filter(log => log.flow && log.flow !== 'None' && log.date)
    .map(log => log.date)
    .sort((a, b) => a.localeCompare(b));

  if (flowDates.length < 2) return defaults;

  // Calculate gaps between consecutive period starts (in days)
  const gaps = [];
  for (let i = 1; i < flowDates.length; i++) {
    const prev = new Date(flowDates[i - 1]);
    const curr = new Date(flowDates[i]);
    const gapDays = Math.round((curr - prev) / 86_400_000);
    if (gapDays > 0) gaps.push(gapDays);
  }

  if (gaps.length === 0) return defaults;

  const avgLength = parseFloat(mean(gaps).toFixed(1));
  const variation = parseFloat(stdDev(gaps).toFixed(1));
  const longestGap = Math.max(...gaps);
  const shortestGap = Math.min(...gaps);
  const isIrregular = variation > 5;

  return { isIrregular, avgLength, variation, longestGap, shortestGap };
};

// ---------------------------------------------------------------------------
// 4. getUpcomingSymptomPredictions
// ---------------------------------------------------------------------------

/**
 * Given patterns from analyzeSymptomPatterns, returns symptoms likely to occur
 * within the next 7 days based on the current cycle day.
 *
 * @param {Array<{symptom: string, avgCycleDay: number, confidence: number}>} patterns
 * @param {number} currentCycleDay - the user's current cycle day
 * @returns {Array<{symptom: string, daysUntil: number, confidence: number, avgCycleDay: number}>}
 */
export const getUpcomingSymptomPredictions = (patterns, currentCycleDay) => {
  if (!patterns || patterns.length === 0 || currentCycleDay == null) return [];

  return patterns
    .map(pattern => ({
      symptom: pattern.symptom,
      daysUntil: pattern.avgCycleDay - currentCycleDay,
      confidence: pattern.confidence,
      avgCycleDay: pattern.avgCycleDay
    }))
    .filter(p => p.daysUntil >= 0 && p.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

// ---------------------------------------------------------------------------
// 5. buildAIContext
// ---------------------------------------------------------------------------

/**
 * Builds a structured context string to send to AI APIs.
 * Summarises the user's profile and recent symptom log for LLM consumption.
 *
 * @param {Object} userPrefs      - user preferences / onboarding data from Zustand
 * @param {Array}  recentLogs     - array of recent log entries (sorted newest first)
 * @param {string} currentPhase   - current cycle phase (e.g. 'FOLLICULAR')
 * @param {number} currentDay     - current cycle day
 * @returns {string} - formatted context for LLM prompt
 */
export const buildAIContext = (userPrefs = {}, recentLogs = [], currentPhase = '', currentDay = 1) => {
  const name = userPrefs.name || 'User';
  const age = userPrefs.age || 'Unknown';
  const mode = userPrefs.lifecycleMode || 'cycle';
  const cycleLength = userPrefs.cycleLength || 28;
  const conditions = Array.isArray(userPrefs.conditions) && userPrefs.conditions.length > 0
    ? userPrefs.conditions.join(', ')
    : 'None';
  const diet = userPrefs.dietPreference || 'Not specified';
  const activityLevel = userPrefs.activityLevel || 'Not specified';
  const aiTone = userPrefs.aiTone || 'Warm & Supportive';
  const archNemesisSymptoms = Array.isArray(userPrefs.archNemesisSymptoms) && userPrefs.archNemesisSymptoms.length > 0
    ? userPrefs.archNemesisSymptoms.join(', ')
    : 'None';

  const phaseLabel = currentPhase
    ? `${currentPhase} (Day ${currentDay})`
    : `Day ${currentDay}`;

  const profileSection = [
    'Patient Profile:',
    `- Name: ${name}`,
    `- Age: ${age}`,
    `- Lifecycle Mode: ${mode}`,
    `- Cycle Length: ${cycleLength} days`,
    `- Current Phase: ${phaseLabel}`,
    `- Diagnosed Conditions: ${conditions}`,
    `- Diet: ${diet}`,
    `- Activity Level: ${activityLevel}`,
    `- AI Tone: ${aiTone}`,
    `- Arch-Nemesis Symptoms: ${archNemesisSymptoms}`,
  ].join('\n');

  // Format the last 5 log entries
  const logLines = recentLogs.slice(0, 5).map(log => {
    const day = log.cycleDay != null ? `Day ${log.cycleDay}` : 'Day ?';
    const mood = log.mood || 'Not logged';
    const flow = log.flow || 'None';
    const symptoms = Array.isArray(log.symptoms) && log.symptoms.length > 0
      ? `[${log.symptoms.join(', ')}]`
      : '[]';
    const pain = log.painDetails && typeof log.painDetails.score === 'number'
      ? `${log.painDetails.score}/10`
      : 'N/A';
    return `- ${log.date} (${day}): mood=${mood}, flow=${flow}, symptoms=${symptoms}, pain=${pain}`;
  });

  const logSection = logLines.length > 0
    ? `\nRecent Symptom Log (last 5 days):\n${logLines.join('\n')}`
    : '\nRecent Symptom Log (last 5 days):\n- No recent logs available.';

  return `${profileSection}${logSection}`;
};

// ---------------------------------------------------------------------------
// 6. getSymptomFrequencyMap
// ---------------------------------------------------------------------------

/**
 * Returns a map of {symptomName: count} for all symptoms across all logs,
 * sorted by count descending.
 *
 * @param {Array} logs - array of log entries
 * @returns {Object} - e.g. { Cramps: 12, Headache: 8, Fatigue: 5 }
 */
export const getSymptomFrequencyMap = (logs) => {
  if (!logs || logs.length === 0) return {};

  const freqMap = {};

  logs.forEach(log => {
    const symptoms = Array.isArray(log.symptoms) ? log.symptoms : [];
    symptoms.forEach(symptom => {
      if (!symptom) return;
      freqMap[symptom] = (freqMap[symptom] || 0) + 1;
    });
  });

  // Sort entries by count descending and rebuild as an ordered object
  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(sorted);
};

// ---------------------------------------------------------------------------
// 7. calculateAverageCycleLength
// ---------------------------------------------------------------------------

/**
 * Estimates average cycle length from logged period (flow) data.
 * Falls back to 28 days if there is insufficient data.
 *
 * @param {Array} logs - array of log entries
 * @returns {number} - estimated cycle length in days
 */
export const calculateAverageCycleLength = (logs) => {
  if (!logs || logs.length === 0) return 28;

  // Collect dates where flow transitions from 'None' → something (period start)
  const sortedLogs = [...logs]
    .filter(log => log.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const periodStartDates = [];
  let wasMenstruating = false;

  sortedLogs.forEach(log => {
    const hasFlow = log.flow && log.flow !== 'None';
    if (hasFlow && !wasMenstruating) {
      // Transition: no flow → flow = period start
      periodStartDates.push(log.date);
    }
    wasMenstruating = hasFlow;
  });

  if (periodStartDates.length < 2) return 28;

  const gaps = [];
  for (let i = 1; i < periodStartDates.length; i++) {
    const prev = new Date(periodStartDates[i - 1]);
    const curr = new Date(periodStartDates[i]);
    const gap = Math.round((curr - prev) / 86_400_000);
    if (gap > 0) gaps.push(gap);
  }

  if (gaps.length === 0) return 28;
  return Math.round(mean(gaps));
};

// ---------------------------------------------------------------------------
// 8. getMoodTrend
// ---------------------------------------------------------------------------

/**
 * Gets mood distribution for the last N days and classifies the overall trend.
 *
 * Positive moods: Happy, Radiant, Calm, Energetic, Confident
 * Negative moods: Anxious, Irritable, Sad, Exhausted, Overwhelmed
 *
 * @param {Array}  logs - array of log entries
 * @param {number} days - how many days to look back (default 14)
 * @returns {{
 *   dominant: string,
 *   distribution: Object,
 *   trend: 'positive'|'negative'|'neutral'
 * }}
 */
export const getMoodTrend = (logs, days = 14) => {
  const defaults = { dominant: 'Unknown', distribution: {}, trend: 'neutral' };

  if (!logs || logs.length === 0) return defaults;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentLogs = logs.filter(log => log.date && log.date >= cutoffStr && log.mood);

  if (recentLogs.length === 0) return defaults;

  // Build distribution map
  const distribution = {};
  recentLogs.forEach(log => {
    if (!log.mood) return;
    distribution[log.mood] = (distribution[log.mood] || 0) + 1;
  });

  // Find dominant mood
  const dominant = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  const positiveMoods = new Set(['Happy', 'Radiant', 'Calm', 'Energetic', 'Confident']);
  const negativeMoods = new Set(['Anxious', 'Irritable', 'Sad', 'Exhausted', 'Overwhelmed']);

  let positiveCount = 0;
  let negativeCount = 0;

  recentLogs.forEach(log => {
    if (positiveMoods.has(log.mood)) positiveCount++;
    else if (negativeMoods.has(log.mood)) negativeCount++;
  });

  let trend = 'neutral';
  if (positiveCount > negativeCount) trend = 'positive';
  else if (negativeCount > positiveCount) trend = 'negative';

  return { dominant, distribution, trend };
};
