# Google Rhythm: Development Progress Tracker

This document tracks the implementation status of all planned features for our **Kaggle AI Agents Capstone** submission.
Last updated: **2026-06-19** (Session 5 — Backend Logic Sprint)

---

## 📊 Summary

| Category | Count |
|---|---|
| ✅ Implemented | **36** |
| ⏳ Pending (Sprint 3) | **5** |
| 🔲 Planned (Sprint 4–5) | **9** |
| **Total Features Scoped** | **50** |

**Overall Progress: ~72% complete**

---

## ✅ Session 5: Backend Logic Sprint (Agent Swarm — 2026-06-19)

### Core Backend — NEW
- [x] **`cycleEngine.js`** — 13 exported functions: `calculateCurrentCycleDay`, `calculateCyclePhase` (proportional to cycleLength, not hardcoded), `calculatePhaseDates`, `predictNextPeriod`, `getDaysUntilNextPeriod`, `isPeriodLate` (PCOS-aware), `getCycleSyncedAdvice` (diet+condition-aware), `getPhaseColor`, `getPregnancyMilestone` (weeks 1–40), and more. Pure JS, zero deps.
- [x] **`db.js` v3 Schema** — Fixed duplicate log bug (date now primary key), added migration to deduplicate existing data, `upsertLog()` replaces `saveLogLocally`, new tables: `labResults`, `notifications`, `phaseHistory`. New helpers: `getLogsForRange`, `getRecentLogs`, `getLogByDate`, `deleteLog`.
- [x] **`patternEngine.js`** — 8 analytics functions: `analyzeSymptomPatterns`, `getPainTrend`, `detectCycleIrregularity`, `getUpcomingSymptomPredictions`, `buildAIContext`, `getSymptomFrequencyMap`, `calculateAverageCycleLength`, `getMoodTrend`. Pure JS.
- [x] **`geminiService.js`** — Centralized Gemini AI service with 6 structured functions: `generateDailyInsight`, `generatePhaseGuidance`, `generatePartnerNudge`, `generateRecipeForPhase`, `analyzeClinicalData`, `detectAnomalies`. All route through `/api/gemini` proxy.
- [x] **`notificationService.js`** — Full notification system: `registerServiceWorker`, `requestNotificationPermission`, `showLocalNotification`, `scheduleMedicationAlarm` (strict, requireInteraction), `schedulePeriodPredictionAlert`, `scheduleSymptomPredictionAlert`, `schedulePhaseTransitionAlert`, `scheduleSupplementReminder`.
- [x] **`cycleAlertManager.js`** — Unified alert brain: `initAlertManager`, `checkAndFireMedicationAlarms`, `resetDailyMedStatus` (midnight reset), `runDailyCycleChecks` (once-per-day guard), `checkPhaseTransition`. Replaces scattered `App.jsx` alarm logic.
- [x] **`public/sw.js`** — Service Worker: install/activate lifecycle, push event handler, notification click (focuses app or opens new tab), message handler for `SHOW_NOTIFICATION` + `SKIP_WAITING`. Background alarms now work even with tab closed.

### Vercel Serverless API Proxy — NEW (Security Fix)
- [x] **`api/llm.js`** — Proxies all LLM requests. NVIDIA NIM → Groq → OpenRouter waterfall runs server-side. Zero API keys in browser.
- [x] **`api/transcribe.js`** — Proxies audio transcription. Groq Whisper → Deepgram fallback. 25MB body limit. Raw buffer collection.
- [x] **`api/gemini.js`** — Proxies Gemini 2.0 Flash requests. Accepts `{prompt, systemInstruction}`, returns `{text}`.
- [x] **`.env.example`** — Fully documented: separates `VITE_*` (client-safe) from server-side-only keys. Deprecated old `VITE_NVIDIA_API_KEY` etc.

### Integration & Bug Fixes
- [x] **`nimService.js` refactor** — All LLM + ASR calls now route through `/api/llm` and `/api/transcribe` proxies. ~120 lines of client-side key code removed.
- [x] **`useAppStore.js` fixes** — Added: `syncPin` (was referenced but undefined), `conceptionDate`, `dueDate`, `partnerEmail`, `partnerName`, `bornDate`. Added `syncCycleDay()` action using cycleEngine.
- [x] **`App.jsx` integration** — `syncCycleDay()` fires on load, `registerServiceWorker()` mounts the SW, `initAlertManager()` replaces old manual setInterval alarm logic.
- [x] **`DoctorReportModal.jsx` upgrade** — Added AI-powered `reportData` state from `analyzeClinicalData()`, loading spinner, and `handleDownloadPDF()` using browser print-to-PDF (no npm package needed).
- [x] **Build verified** — `✓ built in 2.68s`, zero errors.

### Critical Bugs Fixed
- [x] **Cycle day never recalculated** — `syncCycleDay()` now runs on every app load from `lastPeriodDate`
- [x] **Phase windows hardcoded** — Now proportional to user's actual `cycleLength` (21–45 day cycles all work correctly)
- [x] **Duplicate logs possible** — `db.js` v3: `date` is primary key, `upsertLog()` uses `.put()` not `.add()`
- [x] **API keys exposed client-side** — All keys moved to server-side Vercel Functions
- [x] **`syncPin` undefined bug** — Added to Zustand store, auto-sync vault unlock now works
- [x] **Background alarms broken** — Service Worker registered; medication alarms now fire even when tab is closed

---

## ✅ IMPLEMENTED (Completed)

### Foundation & UI
- [x] **Base Application:** React + Vite + TailwindCSS
- [x] **State Management:** Zustand store with `persist` middleware (`useAppStore.js`)
- [x] **Main Views:** Dashboard, Daily Log, AI Insights, Settings — all built and styled
- [x] **Theme Engine:** Dark Mode / Light Mode toggle
- [x] **5 Health Journey Modes in Routing:** `cycle`, `ttc`, `pregnancy`, `perimenopause`, `childfree` all route correctly in `App.jsx`

### Architecture & Privacy
- [x] **Local-First Storage:** IndexedDB via Dexie.js — 100% offline, zero server
- [x] **Firebase Cloud Sync:** Anonymous Auth & Firestore DB for real-time preferences, logs, and meds backup
- [x] **Private Google Drive Backup:** Hidden `drive.appdata` folder backup/restore
- [x] **Google Calendar Sync:** Color-coded all-day cycle phase events
- [x] **Gemini AI Integration:** Basic insight generation from logged symptoms
- [x] **`addLog()` utility:** Dexie helper for programmatic log creation

### Onboarding Wizard (`OnboardingWizard.jsx`) — ✅ FULLY BUILT TODAY
- [x] **Step 0 — Privacy Pledge:** Trust-first screen referencing Flo's $56M FTC fine; 3 privacy guarantee cards
- [x] **Step 1 — The Basics:** Name, DOB (age 45+ perimenopause note), Height, Weight
- [x] **Step 2 — Core Rhythm:** 5 Journey Modes (cycle/ttc/pregnancy/perimenopause/childfree), Cycle Length slider (21–45 days), Last Period Date
- [x] **Step 3 — Medical Profile:** Contraceptive method (8 options), Diagnosed Conditions (5 conditions), **"I Suspect…" feature** (unique — no competitor has this)
- [x] **Step 4 — Lifestyle:** Diet preference (4 options with icons), Activity Level (3 tiers with icons)
- [x] **Step 5 — AI Customisation:** AI Tone (3 personalities), Arch-Nemesis symptoms (pick up to 3, all with Lucide icons)
- [x] **Step 6 — First Log:** Mood (8 options), **Flow condition** (Spotting/Light/Medium/Heavy/None), **Quick symptoms** (8 options) — all with Lucide icons
- [x] **Auto first-log creation:** Mood + Flow + Symptoms saved to IndexedDB on finish
- [x] **Current cycle day calculation:** Derived from `lastPeriodDate` and stored in state
- [x] **Progress bar:** Animated top progress bar across all 6 steps
- [x] **Skip + Back navigation:** Every step skippable, full back support
- [x] **No emojis anywhere:** 100% Lucide icon-based UI throughout wizard
- [x] **`completeOnboarding()` action:** Sets `isOnboardingComplete: true` in persisted store

### Settings Enhancements — ✅ DONE TODAY
- [x] **5 Journey Modes in Settings:** Full data-driven list with icon, color, description for all 5 modes
- [x] **5 Journey Modes in Header Dropdown:** `App.jsx` select updated with all 5 options
- [x] **Danger Zone — Reset App:** Clean single-row compact UI with two-tap confirmation guard
- [x] **`resetApp()` action:** Clears localStorage + IndexedDB + reloads page (verifiable data deletion)

### Session 4: Timeline UI, NIM Speech-to-Text & Llama 3.1 Upgrade (Completed Today)
- [x] **Timeline Overhaul:** Converted `InsightsView.jsx` to a clean, "Stacked Layout" (Material 3 style) to fix clutter and text wrapping on mobile devices.
- [x] **Month Separators:** Added Google Photos-style month dividers (`JUNE 2026`) to the timeline.
- [x] **Dock Navigation UI:** Rebuilt the bottom navigation bar into an indented "Notched Dock" (Option 3) to create a premium, clean aesthetic.
- [x] **AI Voice Logger Deployment & Debugging:** Investigated Google Cloud API key restrictions that caused 404/401 errors on Vercel.
- [x] **NVIDIA Canary ASR Integration:** Completely removed the buggy browser Web Speech API. Built a raw audio pipeline using `MediaRecorder` that securely transmits `.webm` blobs directly to NVIDIA Canary (`nvidia/canary-1b`) for flawless Hindi/English (Hinglish) code-switching and punctuation.
- [x] **NVIDIA Canary ASR Integration:** Completely removed the buggy browser Web Speech API. Built a raw audio pipeline using `MediaRecorder` that securely transmits `.webm` blobs directly to NVIDIA Canary (`nvidia/canary-1b`) for flawless Hindi/English (Hinglish) code-switching and punctuation.
- [x] **Llama 3.1 70B Upgrade & Clinical Prompting:** Upgraded the downstream symptom-extraction LLM to `meta/llama-3.1-70b-instruct` via NVIDIA NIM. Rewrote the system prompt to perform complex Medical & Emotional Reasoning (extracting implied symptoms, a 1-sentence emotional analysis, and a `clinical_flag` for severe symptom warnings).

---

## ⏳ PENDING — SPRINT 2 (Next Session)

### Phase 1: High-Fidelity Speech & AI Updates
- [x] ~~**NVIDIA Magpie TTS:**~~ *Cancelled: Playing sensitive health data aloud is a privacy risk.*
- [x] **Health Profile Management** — Google Account style dedicated section in Settings to view and edit Onboarding data (Cycle baseline, Conditions, Diet, AI Tone). Refactored to Material 3 flat design with dynamic selection dropdowns.
- [x] **UI Bug Fixes** — Fixed SVG scaling and perfect centering in `PregnancyDashboard` and `PerimenopauseDashboard`.
- [x] **3-Step "Wow" Tutorial Carousel** — Swipeable intro explaining AI, Privacy, and Diet after onboarding completes
- [x] **Progressive Permissions** — Google Calendar and Drive Backup sections in Settings are now hidden until the user has saved at least one health log. Earns trust before requesting auth.
- [x] **Biometric Lock Setup** — Full-screen dark lock screen with 4-digit PIN pad, WebAuthn FaceID/TouchID enrollment, keyboard support, shake animation on wrong PIN, and auto-lock on every page load. Setup and disable controls in Settings.
- [x] **Data Import (CSV)** — Full 3-step import wizard (Upload > Preview > Done) with auto-detection for Flo and Clue CSV formats, stats preview (flow/symptom/mood days), sample entry preview, and bulk IndexedDB write. Accessible from Settings > Data Migration.

### Phase 2: PCOS & Mode-Specific Logic
- [x] **PCOS "No False Late" Mode** — Disable "period is late" notifications when PCOS is in `diagnosedConditions`; swap calendar-math for symptom-pattern AI
- [x] **Childfree Mode UI Enforcement** — Hide all fertility/ovulation cards from Dashboard when `lifecycleMode === 'childfree'`
- [x] **Pregnancy Pause Mode** — Dashboard entirely swaps to a Pregnancy view when `lifecycleMode === 'pregnancy'`. Cycle predictions, phase rings, and late warnings are fully hibernated. Shows baby development (e.g. "Size of a Bell Pepper") and a 40-week progress ring instead.
- [x] **AI Insight Caching (Once-a-Day)** — Replaced mocked dashboard predictions with real API calls, optimized Dexie composite key querying, and ensured Gemini AI calls are cached in IndexedDB and run at most once per 24 hours to save credits.

---

## 🔲 PLANNED — SPRINT 3 (Clinical Features)

- [x] **Free-Text Journaling** — Open-ended notes field in Daily Log (Implemented via Voice Transcript UI)
- [x] **Enhanced Pain Scale** — 1–10 slider + functional impact checkboxes ("Couldn't get out of bed", "Vomited from pain", "Went to A&E")
- [x] **Visual Pain Body Map** — (Cancelled per user request)
- [x] **Sprint 3: The "Magic" (AI & Pro Features)**
  - [x] Integrate AI Voice Logging (Deepgram + LLaMA 3 via NIM API)
  - [x] Build Data Importer (CSV support for Clue/Flo exports + LLaMA mapping)
  - [x] AI Insights View (Daily text-based health forecasting)
  - [x] Phase-based Diet/Fitness guidance Engine
  - [x] One-Tap Daily Stack Logging
  - [x] AI Doctor's Report PDF
  - [x] 3-Step "Wow" Tutorial Carousel
- [ ] **PCOS Condition Mode (Full)** — Dedicated PCOS dashboard, insulin sensitivity tracking
- [ ] **Endometriosis Mode** — Dedicated Endo symptom tracking, pain map integration
- [ ] **Mental Health Correlation** — PHQ-9/GAD-7 style mood scoring correlated with cycle phase

---

## 🔲 PLANNED — SPRINT 4 (Google Ecosystem & Core Enhancements)

- [x] **Voice Logging** — Web Speech API → Gemini STT → structured symptom tags (Built with premium Gemini-style dark UI)
- [x] **Dynamic Symptom Colors** — LogView cards now uniquely color-coded by symptom across all lifecycle modes
- [x] **Strict Birth Control Alarms** — Dedicated sub-system for aggressive push notifications to ensure precise pill timing, overriding default OS clock app limitations.
- [ ] **Automated Wearable Sync** — Pull sleep, HR, and wrist temp via Health Connect/Apple HealthKit.
- [ ] **Hyper-Predictive Alerts** — Push notifications for predicted upcoming symptoms
- [ ] **Smart Keep Export** — Export cycle-synced meal plans to Google Keep
- [ ] **Automated Partner Nudges** — Weekly Gemini-generated digest for authorized partner
- [ ] **Google Nest Thermostat Integration** — Auto lower temp in luteal phase
- [ ] **Google Home Morning Briefing** — Cycle phase spoken summary via Nest Hub
- [ ] **Home Screen Widget** — One-tap symptom logging without opening the app
- [ ] **Bloodwork / Lab Result Tracker** — Log hormone panel results, Gemini interprets trends

---

## 🔲 PLANNED — SPRINT 5 (Frontier AI)

- [ ] **Photo Acne Tracking** — Daily selfie → Gemini Vision tracks acne severity by cycle phase
- [ ] **OPK Test Strip Reader** — Camera photo → AI reads LH line intensity, auto-logs result
- [ ] **Voice Journaling + Sentiment Analysis** — Audio → transcription → distress detection
- [ ] **CGM Integration** — Dexcom/Libre glucose data overlaid with cycle phase via Health Connect

---

## 🗂️ Key Files Reference

| File | Purpose |
|---|---|
| `src/App.jsx` | Root routing — mode → dashboard mapping |
| `src/store/useAppStore.js` | Zustand store — all state + actions |
| `src/services/db.js` | Dexie.js IndexedDB — logs + insights cache |
| `src/components/OnboardingWizard.jsx` | **NEW** — full 6-step wizard |
| `src/components/DashboardView.jsx` | Main cycle dashboard (cycle/ttc/childfree) |
| `src/components/PregnancyDashboard.jsx` | Pregnancy mode dashboard |
| `src/components/PerimenopauseDashboard.jsx` | Perimenopause mode dashboard |
| `src/components/SettingsView.jsx` | Settings — 5 modes + Danger Zone |
| `src/components/LogView.jsx` | Daily symptom log |
| `src/components/InsightsView.jsx` | Gemini AI insights view |
| `src/services/driveService.js` | Google Drive backup/restore |
| `src/services/calendarService.js` | Google Calendar sync |
| `Product Specification Documents/` | PRD, SRD, TRD, Schema, App Flow, Roadmap |

---

## 🎯 Next Session — Start Here
 
**Priority 1:** `3-Step Tutorial Carousel` — show once after onboarding completes, then never again. (✅ Completed)

**Priority 2:** Add strict Birth Control Alarms (Sprint 4 item). (✅ Completed)

### ✅ Completed Today (Session 3)
* **Strict Birth Control Alarms:** Built a robust alarm manager in App.jsx that polls the time and triggers an aggressive, full-screen red overlay that locks the app until the medication is marked as taken. Added UI in Settings to manage medication times and request browser Notification permissions.
* **Google Drive Disconnect:** Added explicit Disconnect capability to Settings so users can easily sever the OAuth connection.
* **Real Timeline Data Engine:** Rewired the Insights tab's Timeline Feed to map dynamically from `IndexedDB` instead of using static mock data.
* **Voice Journal UI (Free-Text Journaling):** Upgraded the Voice Logging engine to save exactly what the user spoke as a `note`. Designed a stunning Material 3 chat-bubble to render this raw transcript on the Timeline card below the extracted tags.
* **Indented Dock Navigation:** Completely overhauled the bottom nav bar. Designed a flush center FAB (Mic button) sitting in a CSS-based notched dock, fixing the clunky overlapping ring and perfectly spacing the navigation items.
* **Material 3 Chips:** Modernized the symptom tags across the app, removing thin outlines in favor of soft, solid background pills identical to Google Fit.

### ✅ Completed Previously
* **Brand New Welcome Screen:** Built a fully responsive, Google-styled splash/welcome screen with completely custom SVG logo, Google fonts, and an empowering tagline ("Your body. Your data. Your rules.").
* **Privacy Pledge UI:** Purged emojis and integrated clean, colored Lucide Icons for the "Zero Ads" and "Device Only" commitments.
* **Global Google Fonts:** Successfully injected `Outfit` and `Roboto` into the CSS pipeline so the entire app renders in authentic Google style.
* **AI Insight Caching Engine:** Fixed the IndexedDB schema bug (created composite keys `[date+mode]`) so that the Daily Forecast caches its Gemini AI response. This prevents unnecessary network requests and API cost runaway.

> 💡 **Design rule:** No emojis anywhere in the UI. All icons must be Lucide React components. Follow the existing color system (Google Blue `#4285f4` / dark `#8ab4f8`, surface cards `#f8f9fa` / dark `#1e1e1e`, rounded-2xl/3xl borders).
