# Implementation Plan
**Product Name:** Google Rhythm  
**Version:** 1.0  

## Phase 1: Core Foundation & UI Shell (Completed)
* **Milestone 1:** Initialize Vite + React project.
* **Milestone 2:** Configure Tailwind CSS and setup global theme (Dark/Light mode).
* **Milestone 3:** Build navigation shell (Bottom Navigation Bar) and blank view containers.
* **Milestone 4:** Implement Zustand store (`useAppStore.js`) for global state.

## Phase 2: Local Storage & Security Integrations (Completed)
* **Milestone 1:** Implement IndexedDB via `Dexie.js` (`db.js`). Define schemas.
* **Milestone 2:** Setup Google OAuth using `@react-oauth/google` wrapper in `main.jsx`.
* **Milestone 3:** Create `driveService.js` to manage multipart uploads to `drive.appdata`.
* **Milestone 4:** Create `calendarService.js` to push all-day events using absolute date offsets.

## Phase 3: Onboarding & User Profiling (Current Focus)
* **Milestone 1:** Extend `useAppStore.js` with `persist` middleware to save user profile variables across reloads.
* **Milestone 2:** Build `OnboardingWizard.jsx`. Create the 6-step UI flow with "Next" and "Skip" capabilities.
* **Milestone 3:** Implement conditional routing in `App.jsx` to force the wizard if `isOnboardingComplete` is false.
* **Milestone 4:** Wire the final step (Mood selection) to automatically push an entry into the IndexedDB `logs` table before redirecting to the dashboard.

## Phase 4: AI Engine & Caching (Upcoming)
* **Milestone 1:** Create `geminiService.js`. Connect via the official `@google/genai` SDK using `VITE_GEMINI_API_KEY`.
* **Milestone 2:** Build the dynamic Prompt Builder. It must concatenate the user profile (Diet, Conditions, Tone) with the last 5 days of IndexedDB logs.
* **Milestone 3:** Implement caching logic. Query `insightsCache` table first. Only ping Gemini if today's date doesn't exist in the cache. Save response.
* **Milestone 4:** Render the markdown response in the `InsightsView.jsx`.

## Phase 5: Advanced Magic Features (Backlog)
* **Milestone 1 (Voice):** Add a microphone button in `LogsView.jsx`. Capture audio, utilize Web Speech API or an external STT service, pass transcript to Gemini to map to structured tags, update DB.
* **Milestone 2 (Alerts):** Write an analyzer function that scans the last 3 months of logs to find repeating day-of-cycle patterns (e.g., Cramps always on Day 2). Surface these as UI alerts on Day 1.
* **Milestone 3 (Ecosystem):** Add "Export to Keep" button on recipe cards in the Dashboard using the Google Keep API.

## Phase 6: Polish, Testing, & Launch
* **Milestone 1:** End-to-end testing of the Local-First database across browser restarts.
* **Milestone 2:** Comprehensive testing of Google Drive restore functionality.
* **Milestone 3:** UI/UX audit for responsive design on narrow mobile viewports.
* **Milestone 4:** Final deployment to Vercel production environment.
