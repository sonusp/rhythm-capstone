// ============================================================
// nimService.js — AI Brain & Ears for Google Rhythm
// All API calls now route through /api/* Vercel serverless
// proxies. Zero API keys are exposed client-side.
// ============================================================

// Proxy endpoints (defined in api/ and vercel.json)
const LLM_PROXY_URL = "/api/llm";
const TRANSCRIBE_PROXY_URL = "/api/transcribe";

const extractJSON = (text) => {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to extract JSON: ${text.substring(0, 50)}...`);
  }
};

const compressLogs = (logs) => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return "none";
  return logs.map(l => {
    const d = (l.date || l.timestamp || '').substring(5); // MM-DD
    const f = l.flow ? l.flow.charAt(0) : '-';
    const m = l.mood || '-';
    const s = (l.symptoms || []).join('+') || '-';
    return `[${d}]F:${f},M:${m},S:${s}`;
  }).join(';');
};

/**
 * Sends a prompt to the /api/llm serverless proxy.
 * The proxy handles the full NVIDIA → Groq → OpenRouter waterfall server-side.
 * API keys never touch the browser.
 * @param {string} prompt
 * @param {Function|null} onStatusUpdate - optional UI status callback
 * @returns {Promise<string>} LLM response text
 */
async function fetchLLMWaterfall(prompt, onStatusUpdate) {
  if (onStatusUpdate) onStatusUpdate("🧠 Understanding how you feel today...");
  console.log("[Brain] Sending to /api/llm proxy...");

  const response = await fetch(LLM_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: Array.isArray(prompt) ? prompt : [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`LLM Proxy Error ${response.status}: ${errData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.text;
}

// Helper to make the API fetch
/**
 * Transcribes an audio blob by sending it to the /api/transcribe serverless proxy.
 * The proxy handles the Groq Whisper → Deepgram fallback server-side.
 * API keys never touch the browser.
 * @param {Blob} audioBlob - the recorded audio blob
 * @param {Function|null} onStatusUpdate - optional UI status callback
 * @returns {Promise<string>} transcribed text
 */
export const transcribeAudio = async (audioBlob, onStatusUpdate) => {
  if (onStatusUpdate) onStatusUpdate("✨ Listening closely to you...");
  console.log("[Ears] Sending to /api/transcribe proxy...");

  const response = await fetch(TRANSCRIBE_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": audioBlob.type || "audio/webm" },
    body: audioBlob,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Transcription Proxy Error ${response.status}: ${errData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  if (!data.text) throw new Error("No transcription returned from proxy.");
  return data.text;
};

export const generateSymptomForecast = async (currentDay, recentLogs = []) => {

  try {
    const logsString = recentLogs.length > 0 ? recentLogs.join(', ') : "no recent symptoms logged";
    const prompt = `You are a medical AI assistant for a menstrual cycle tracking app. 
The user is on Cycle Day ${currentDay} of a 28-day cycle. 
Their last 3 logged symptoms were: ${logsString}. 
Predict tomorrow's most likely symptom based on common hormonal shifts and the provided logs.

Output ONLY a valid JSON object predicting tomorrow's symptoms with the following keys:
- "symptom": A short descriptive string of the symptom (e.g. "mild bloating and heightened sociability")
- "prob": A number representing the probability percentage (e.g. 88)
- "context": A short string explaining why (e.g. "Matching your historical ovulation patterns")`;

    const text = await fetchLLMWaterfall(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error("Error generating forecast from NIM:", error);
    return { symptom: "unable to generate forecast at this time", prob: 0, context: "API Error. Check network." };
  }
};

export const askNIMInsights = async (query, userLogs, mode, chatHistory = [], userPrefs = {}, currentDay = 1, currentPhase = 'Unknown') => {
  try {
    const age = userPrefs.dob ? new Date().getFullYear() - new Date(userPrefs.dob).getFullYear() : 'Unknown';
    const conditions = (userPrefs.diagnosedConditions || []).join(', ') || 'None';
    const supplements = (userPrefs.supplements || []).join(', ') || 'None';
    const allergies = (userPrefs.allergies || []).join(', ') || 'None';
    const contraceptive = userPrefs.contraceptive || 'None';
    const cycleLength = userPrefs.cycleLength || 28;
    const today = new Date().toLocaleDateString();

    const formattedLogs = userLogs.length > 0 
      ? userLogs.map(l => `- ${l.date || l.timestamp || 'Unknown Date'}: Flow: ${l.flow || 'None'}, Mood: ${l.mood || 'None'}, Symptoms: ${(l.symptoms || []).join(', ') || 'None'}`).join('\n')
      : "No logs recorded for this cycle.";

    const systemPrompt = `You are Rhythm, a highly empathetic and intelligent women's health assistant.
The user is in the ${mode} lifecycle mode. Today's date is ${today}.

[USER PROFILE & BIOMETRICS]
- Age: ${age}
- Cycle Status: Day ${currentDay} of ${cycleLength} (${currentPhase} Phase)
- Contraceptive: ${contraceptive}
- Diagnosed Conditions: ${conditions}
- Supplements/Meds: ${supplements}
- Diet & Allergies: ${userPrefs.dietPreference || 'Not specified'} / Allergies: ${allergies}

[CURRENT CYCLE HEALTH TIMELINE (Day 1 to Day ${currentDay})]
${formattedLogs}

[INSTRUCTIONS]
1. Provide a concise, medically sound response. Keep it under 3-4 short sentences MAX. Do not write filler text.
2. Mirror their emotional tone. If they log feeling anxious, adopt a soothing tone. Match high energy if they are happy.
3. Tailor your advice specifically to their profile (e.g. adjust advice if they have PCOS or specific allergies).
4. Do not give direct medical diagnosis, but suggest lifestyle tips.
5. CULTURAL CONTEXT: Highly tailor your advice to an Indian woman's lifestyle. Where applicable, suggest culturally relevant Indian dietary elements (dals, sabzis, spices like haldi, jeera, ajwain, adrak), Ayurvedic wellness practices, and practical yoga/asanas instead of generic western advice.
6. DOMAIN RESTRICTION: If the user asks a question completely unrelated to health, wellness, their cycle, or this app (e.g., coding, history, math), politely decline and say: "I am a specialized health assistant and can only assist with topics related to your wellbeing and cycle."
7. ACTIONABLE LOGGING: If the user explicitly states they want to log a new symptom, mood, or flow (e.g., "I just got my period", "I have a terrible headache", "log that I took Advil"), append a special tag at the VERY END of your response with the extracted data formatted as valid JSON:
<LOG_INTENT>{"symptoms": ["headache"], "flow": "Heavy", "mood": "Anxious"}</LOG_INTENT>
Only output this tag if there is a clear intent to log new data today.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: query }
    ];

    return await fetchLLMWaterfall(messages);
  } catch (error) {
    console.error("NIM API Error:", error);
    return "AI Connection is disabled or experiencing technical difficulties. - Developer Pal_Sonu";
  }
};

export const parseVoiceLog = async (transcribedText, onStatusUpdate) => {
  try {
    const prompt = `You are an empathetic, world-class gynecological AI assistant.
The user just submitted a daily voice log: "${transcribedText}"

Analyze the text and extract the exact physiological and emotional state of the user.
Return ONLY a raw JSON object with the following schema:
{
  "is_health_related": boolean, // (Set to false if they talk about random things like groceries or "thanks for watching")
  "target_date": "YYYY-MM-DD",  // (If they specify "yesterday" or a specific day, calculate it relative to today: ${new Date().toISOString().split('T')[0]}. Otherwise, leave null)
  "flow": "Spotting, Light, Medium, Heavy, or None",
  "symptoms": ["List of general physical symptoms (e.g. Headache, Acne, Fatigue)"],
  "gi_symptoms": ["Extract ONLY: bloating, nausea, diarrhea, or constipation"],
  "primary_emotion": "The core feeling (e.g. Anxious, Radiant)",
  "emotional_analysis": "A 1-sentence analysis of their mental state based on their tone and words",
  "pain_score": number, // (Extract a 1-10 number if they describe pain severity. Null if none)
  "pain_impacts": ["Extract if they mention: Couldn't get out of bed, Vomited from pain, or Went to A&E"],
  "meds_helped": "String of any medication or remedy they took for the pain (e.g. Advil, Heating pad). Null if none",
  "supplements_taken": boolean, // (Set to true if they mention taking their vitamins, supplements, meds, or "stack")
  "clinical_flag": boolean // (Set to true ONLY if they mention severe pain, abnormal bleeding, or fainting)
}`;

    const text = await fetchLLMWaterfall(prompt, onStatusUpdate);
    return extractJSON(text);
  } catch (error) {
    console.error("Error parsing voice log with NIM:", error);
    alert(`NVIDIA NIM Error: ${error.message}`);
    return null;
  }
};

/**
 * Generates a conversational, empathetic response to be spoken aloud.
 */
export const generateConversationalResponse = async (userText, cycleDay, mode) => {
  try {
    const prompt = `You are Rhythm, an empathetic, world-class women's health coach.
The user is currently in the ${mode} lifecycle mode. They are on Cycle Day ${cycleDay}.

The user just spoke to you and said: "${userText}"

Reply to them directly. Your response will be spoken out loud by a Text-to-Speech engine.
RULES:
1. Keep it incredibly brief (exactly 1 to 2 short sentences).
2. Be comforting, conversational, and highly empathetic. Do not sound robotic.
3. Validate their feelings or symptoms based on where they are in their cycle.
4. Do NOT output any markdown, emojis, or lists. Just pure spoken text.`;

    const text = await fetchLLMWaterfall(prompt);
    // Return raw text, stripping any accidental quotes
    return text.replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error("Conversational LLM Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now.";
  }
};

export const generateClinicalReport = async (logs, userPrefs) => {
  try {
    const prompt = `You are an expert OBGYN and Gynecological Analyst. 
The patient has requested a structured 90-day clinical narrative to hand over to their doctor.
Here is the patient's profile:
- Lifecycle Mode: ${userPrefs.lifecycleMode}
- Diagnosed Conditions: ${(userPrefs.diagnosedConditions || []).join(', ') || 'None'}
- Cycle Length: ${userPrefs.cycleLength} days

Here are their logs over the last 90 days (JSON format with pain and medication data):
${JSON.stringify(logs)}

Analyze these logs to find medical patterns, symptom severity changes, and correlations with their supplements (${(userPrefs.supplements || []).join(', ') || 'none'}).
Return ONLY a raw JSON object with the following schema:
{
  "overview": "A 2-3 sentence high-level clinical summary of the patient's last 90 days.",
  "key_patterns": ["A bullet point noting a specific recurring pattern", "Another pattern..."],
  "pain_analysis": "A brief analysis of their pain severity, functional impacts (e.g. bedridden), and medication efficacy.",
  "discussion_points": ["Question to ask doctor 1", "Question to ask doctor 2"]
}`;

    const text = await fetchLLMWaterfall(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error("Clinical Report Error:", error);
    throw new Error("Failed to generate clinical report.");
  }
};

export const generateCustomPlan = async (userPrefs, currentPhase, currentDay, recentLogs) => {
  try {
    const age = userPrefs.bornDate ? new Date().getFullYear() - new Date(userPrefs.bornDate).getFullYear() : 'Not set';
    const height = userPrefs.height || 'Not set';
    const weight = userPrefs.weight || 'Not set';
    const allergies = (userPrefs.allergies || []).join(', ') || 'None';
    
    const prompt = `You are Rhythm, an empathetic, world-class women's health and wellness coach. Your goal is to provide a highly personalized, actionable daily health plan for the user based strictly on their exact biological profile, current menstrual phase, and their symptom history from the last 15 days.

You must output your response in STRICT JSON FORMAT ONLY.

[USER PROFILE]
* Age: ${age}
* Height & Weight: ${height} cm, ${weight} kg
* Diet Preference: ${userPrefs.dietPreference || 'Not set'}
* Allergic Foods: ${allergies}
* Contraceptive: ${userPrefs.contraceptive || 'None'}
* Diagnosed Conditions: ${(userPrefs.diagnosedConditions || []).join(', ') || 'None'}
* Active Supplements: ${(userPrefs.supplements || []).join(', ') || 'None'}

[CURRENT STATE]
* Cycle Phase: ${currentPhase} (Cycle Day: ${currentDay} of ${userPrefs.cycleLength || 28} days)
* Recent Logs (Compressed: [MM-DD]F:flow,M:mood,S:symptoms):
${compressLogs(recentLogs)}

[INSTRUCTIONS]
Analyze the profile and recent logs. Generate today's custom dashboard data.
CRITICAL RULE: Keep descriptions extremely punchy, practical, and highly readable. Write EXACTLY 2 short, conversational sentences (around 20-25 words total) per section. Do not ramble.
CULTURAL CONTEXT (INDIAN WOMEN): The advice MUST be genuine, light, and realistic for an Indian woman. For example, during cramps, suggest soothing adrak-tulsi chai, ajwain water, or a light moong dal khichdi rather than heavy meals like sarson ka saag. Suggest simple, restorative yoga asanas (like Balasana) or walking, and basic natural remedies (like haldi, aloe vera). 

1. Nutrition: 2 short sentences of specific, practical Indian food/drink advice.
2. Fitness: 2 short sentences of realistic movement/yoga based on energy.
3. Mental: 2 short sentences of genuine emotional support.
4. Skincare: 2 short sentences of hormonal skincare (natural Indian remedies if helpful).
5. Forecast: Predict tomorrow's most likely symptom.

Return EXACTLY this JSON structure:
{
  "nutrition": {
    "title": "Short catchy title (max 4 words)",
    "desc": "Exactly 2 short sentences (max 25 words) of practical, authentic Indian dietary advice."
  },
  "fitness": {
    "title": "Short catchy title (max 4 words)",
    "desc": "Exactly 2 short sentences (max 25 words) of realistic movement or yoga advice."
  },
  "mental": {
    "title": "Short catchy title (max 4 words)",
    "desc": "Exactly 2 short sentences (max 25 words) of genuine emotional support."
  },
  "skincare": {
    "title": "Short catchy title (max 4 words)",
    "desc": "Exactly 2 short sentences (max 25 words) for skin care, using simple natural remedies."
  },
  "forecast": {
    "symptom": "A short descriptive string",
    "prob": 88,
    "context": "1 clear, punchy sentence explaining the prediction."
  }
}`;

    const text = await fetchLLMWaterfall(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error("Custom Plan Error:", error);
    return null; // Signals the UI to use hardcoded fallback
  }
};

export const getImportMapping = async (headers, sampleRows) => {
  const prompt = `You are a data migration assistant for a women's health tracking app called Google Rhythm.

I am importing a data file from another period tracking app. Here are the data field headers and 3 sample rows/entries:

HEADERS: ${JSON.stringify(headers)}

SAMPLE DATA:
${JSON.stringify(sampleRows, null, 2)}

Map these data fields to our internal schema. Our schema fields are:
- "date": The date of the log entry (YYYY-MM-DD format)
- "flow": Period flow intensity. Must be one of: "None", "Spotting", "Light", "Medium", "Heavy"
- "mood": The user's emotional state (single word like "Happy", "Sad", "Anxious", etc.)
- "symptoms": An array of physical symptoms. Extract ALL symptom-related columns into this array.
- "note": Any free-text notes or journal entries

Return ONLY a valid JSON object with this exact structure:
{
  "dateColumn": "the exact column header name that contains the date",
  "flowColumn": "the exact column header name for period flow/bleeding intensity, or null",
  "moodColumn": "the exact column header name for mood/emotion, or null",
  "noteColumn": "the exact column header name for notes/journal, or null",
  "symptomColumns": ["array of exact column header names that represent symptoms or health indicators"],
  "flowMapping": {"original_value": "mapped_value"} 
}

For flowMapping, map the original CSV values to our allowed values: "None", "Spotting", "Light", "Medium", "Heavy".
For symptomColumns, include ANY column that tracks a physical symptom, condition, or health indicator (cramps, headache, bloating, fatigue, acne, sleep quality, exercise, breast tenderness, etc.)

Return ONLY the JSON object, no explanation.`;

  try {
    const text = await fetchLLMWaterfall(prompt, null);
    return extractJSON(text);
  } catch (error) {
    console.warn("Import Mapping LLM Error, using fallback:", error);
    
    // Fallback static mapping using basic string matching
    const findHeader = (keywords) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k)));
    
    const symptomColumns = headers.filter(h => {
      const lower = h.toLowerCase();
      return !lower.includes('date') && !lower.includes('flow') && !lower.includes('period') && !lower.includes('mood') && !lower.includes('note');
    });

    return {
      dateColumn: findHeader(['date', 'day']) || headers[0],
      flowColumn: findHeader(['flow', 'period', 'bleeding']),
      moodColumn: findHeader(['mood', 'emotion', 'feeling']),
      noteColumn: findHeader(['note', 'journal', 'description']),
      symptomColumns: symptomColumns,
      flowMapping: {
        "light": "Light", "medium": "Medium", "heavy": "Heavy", "spotting": "Spotting", "none": "None",
        "1": "Light", "2": "Medium", "3": "Heavy"
      }
    };
  }
};

export const generateInsightsSummary = async (userPrefs, currentPhase, currentDay, cycleLogs) => {
  const prompt = `You are an expert women's health AI assistant and relationship coach.
Based on the user's current cycle day (${currentDay}), their current phase (${currentPhase}), their personal preferences:
${JSON.stringify(userPrefs)}

And their recent logged symptoms and moods (compressed):
${compressLogs(cycleLogs.slice(0, 10))}

Generate 4 highly personalized health insights for their 'Insights' dashboard. 
CRITICAL RULE: Keep all text highly compact, genuine, and actionable.
CULTURAL CONTEXT (INDIAN WOMEN): Use an Indian lifestyle context (e.g., local diets, simple routines, practical realities) so it feels deeply relatable, not generic.

1. Supplement Effectiveness: 1 compact sentence identifying a correlation between a logged action/supplement and a symptom outcome (or a practical, genuine Indian recommendation if no data).
2. Community Benchmark: 1 compact sentence comparing a recent symptom to community stats in an Indian context.
3. Partner Summary (Weekly Nudge): Write this EXACTLY as a direct message ADDRESSED TO the boyfriend/husband from you (Rhythm). Speak directly to him (e.g. "She is feeling...", "You can help her by..."). Write 2 highly direct, customized, and actionable sentences. Do not use fluffy or dramatic words like "surprise", "spoil", or "treat". Use grounded words like "help" and "support". Suggest ONE highly specific, practical way he can help her this week (e.g., handling specific chores, making a specific Indian comfort food/drink, or offering a foot massage).
4. Clinical Milestones: 2-3 genuine, long-term health tasks relevant to her lifecycle mode (e.g. checkup, Ayurvedic routine). Keep descriptions to 1 short sentence.

Return ONLY a valid JSON object exactly matching this structure:
{
  "supplementEffectiveness": "1 compact sentence describing supplement/habit ROI or a genuine Indian recommendation.",
  "communityBenchmark": "1 compact sentence comparing a recent symptom to community stats.",
  "partnerSummary": "2 direct, actionable sentences addressed DIRECTLY to the boyfriend/husband from Rhythm (e.g. 'You can help her by...').",
  "clinicalMilestones": [
    { "title": "Compact Task Name", "desc": "1 short actionable sentence", "done": false }
  ]
}`;

  try {
    const text = await fetchLLMWaterfall(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error("Insights Summary Error:", error);
    return null;
  }
};
