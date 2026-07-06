# App Flow
**Product Name:** Google Rhythm  
**Version:** 1.0  

## 1. High-Level User Journey

### A. New User Onboarding Flow
1. **App Launch:** User visits the URL. State checks `isOnboardingComplete`. If false, route to Wizard.
2. **Step 1 (Basics):** User inputs Name, DOB. Clicks "Next".
3. **Step 2 (Cycle):** User selects Health Mode, inputs Cycle Length and Last Period Date. Clicks "Next". *(App instantly calculates current cycle day in background).*
4. **Step 3 (Medical):** User selects any conditions (PCOS, PMDD, etc.) or Contraceptives. Clicks "Next".
5. **Step 4 (Lifestyle):** User inputs Diet and Activity level. Clicks "Next".
6. **Step 5 (AI Tone):** User selects preferred AI interaction style. Clicks "Next".
7. **Step 6 (Icebreaker):** User selects current mood. Clicks "Finish".
8. **Completion:** State sets `isOnboardingComplete: true`. A daily log is automatically created using the mood selected in Step 6. Route to Dashboard.

### B. Daily Usage Flow (Returning User)
1. **App Launch:** User visits the URL. State checks `isOnboardingComplete`. True -> route to Dashboard.
2. **Dashboard Load:** 
   - Circular visualizer reads `currentDay` and highlights correct phase.
   - Actionable Health Guidance dynamically renders based on `phase` and `dietPreference`.
3. **Logging Data:**
   - User clicks "+" or navigates to "Log" tab.
   - User selects symptoms, flow, and adds notes.
   - User clicks "Save". Data is committed to IndexedDB.
4. **AI Insights Generation (The "Magic" Loop):**
   - User navigates to "Insights" tab.
   - App checks IndexedDB `insightsCache` for today's date.
   - *If exists:* Render cached Markdown instantly.
   - *If missing:* 
     1. Query IndexedDB for last 5 days of logs.
     2. Send payload + User Profile (Diet, Conditions, AI Tone) to Gemini API.
     3. Await response. Render Markdown.
     4. Save response to `insightsCache` for today.

### C. Cloud Sync & Backup Flow (Settings)
1. **Connect Drive:** User navigates to Settings -> clicks "Connect Drive".
2. **OAuth:** Google popup appears. User grants `drive.appdata` scope.
3. **Backup Action:** User clicks "Backup Now".
   - App queries all data from Dexie.js.
   - App serializes data to JSON.
   - App HTTP POSTs JSON payload to Google Drive REST API.
   - UI updates to "Success".
4. **Restore Action:** User clicks "Restore".
   - App HTTP GETs JSON payload from Drive.
   - App parses JSON and overwrites local Dexie.js database.
   - App state re-initializes.

## 2. Navigation Map (Bottom Bar)
* **[Dashboard]**: Home view. Cycle visualizer, symptom forecasts, phase-specific diet/fitness cards.
* **[Daily Log]**: Input form for symptoms, moods, medications, and flow.
* **[AI Insights]**: Gemini-generated daily summaries and predictions.
* **[Settings]**: User profile modifications, Google Drive Sync, Google Calendar Integrations, Theme toggles.
