# Software Requirements Document (SRD)
**Product Name:** Google Rhythm  
**Version:** 1.0  
**Last Updated:** June 2026  

## 1. Introduction
This document defines the functional and non-functional software requirements for the Google Rhythm web application. It serves as a guide for developers, QA, and product managers to ensure the software behaves as intended.

## 2. Functional Requirements

### 2.1 User Onboarding & Profiling
* **REQ-101:** The system MUST present a multi-step onboarding wizard for first-time users.
* **REQ-102:** The system MUST collect and locally store user preferences including Name, DOB, Cycle Length, First Day of Last Period, Health Mode, Diet, and Contraceptive Method.
* **REQ-103:** The system MUST allow users to skip optional fields, utilizing default fallbacks (e.g., 28-day cycle length).
* **REQ-104:** The system MUST automatically calculate the user's current cycle day based on the "First Day of Last Period" input immediately upon completing onboarding.

### 2.2 Dashboard & Visualization
* **REQ-201:** The dashboard MUST display a circular visualization indicating the current day of the cycle.
* **REQ-202:** The dashboard MUST dynamically calculate and display the current phase (Menstrual, Follicular, Ovulation, Luteal) based on the current day and user configuration.
* **REQ-203:** The dashboard MUST present actionable health guidance (Nutrition, Fitness, Mental) matched to the current phase and dietary preferences.
* **REQ-204:** The system MUST include an interactive "Cycle Day Simulator" slider allowing the user to preview future days without altering the actual current date.

### 2.3 Data Logging & Symptom Tracking
* **REQ-301:** The system MUST allow users to log daily symptoms, moods, and flows.
* **REQ-302:** The system MUST store all log entries persistently in IndexedDB via Dexie.js.
* **REQ-303:** The system MUST allow voice-based logging, sending the audio transcript to Gemini to extract structured tags (Future Phase).

### 2.4 Generative AI Integration (Gemini)
* **REQ-401:** The system MUST transmit aggregated user logs to the Google Gemini API to generate personalized health insights.
* **REQ-402:** The system MUST cache the AI response locally based on the `lastInsightDate` to limit network requests to a maximum of 1 per day.
* **REQ-403:** The system MUST alter its prompt instructions based on the user's selected "AI Tone" (Warm, Clinical, Science-Focused).

### 2.5 Integrations (Drive & Calendar)
* **REQ-501:** The system MUST utilize `@react-oauth/google` to request the `drive.appdata` scope.
* **REQ-502:** The system MUST serialize the IndexedDB contents and upload it as `google_rhythm_backup.json` to the user's hidden Google Drive folder upon manual or automatic backup triggers.
* **REQ-503:** The system MUST request the `calendar.events` scope to insert all-day events representing "Low Energy" and "Peak Fertility" windows into the user's primary Google Calendar.

## 3. Non-Functional Requirements

### 3.1 Performance
* **PERF-1:** The application MUST load the dashboard in under 1.5 seconds on a standard 4G connection (achieved via Local-First caching).
* **PERF-2:** Database read/write operations (IndexedDB) MUST complete in under 50ms.

### 3.2 Security & Privacy
* **SEC-1:** User health data MUST NOT be stored on any developer-controlled servers.
* **SEC-2:** Network transmission of data (e.g., to Gemini API or Google Drive) MUST utilize TLS 1.3 encryption.
* **SEC-3:** The application MUST provide an option to enable a biometric lock (WebAuthn/FaceID) for app access.

### 3.3 Usability & Accessibility
* **USE-1:** The UI MUST support both Dark Mode and Light Mode, toggleable via settings.
* **USE-2:** The application MUST be fully responsive, targeting mobile-first viewports (320px width minimum) up to desktop resolutions.

## 4. Error Handling
* **ERR-1:** If the Gemini API rate limits are exceeded, the system MUST gracefully degrade, displaying the locally cached insight or a friendly "AI resting" message.
* **ERR-2:** If Google Drive backup fails (e.g., token expiration), the system MUST alert the user visually with a red warning badge in the Settings menu.
