# Product Requirements Document (PRD)
**Product Name:** Google Rhythm  
**Version:** 1.0  
**Last Updated:** June 2026  

## 1. Executive Summary
Google Rhythm is a privacy-first, AI-powered women's health and cycle intelligence application. Unlike traditional cycle trackers that rely on rigid calendar math, Rhythm utilizes Google's Gemini AI to analyze user symptoms, calculate dynamic phase forecasts, and provide actionable, cycle-synced nutrition and fitness advice. The application features a "Local-First" architecture, ensuring that highly sensitive health data never touches developer servers, mitigating the risk of data breaches.

## 2. Product Vision & Goals
* **Vision:** To provide the most intelligent, privacy-compliant, and deeply personalized cycle tracking experience on the market.
* **Goals:**
  * Achieve zero-server data storage via IndexedDB.
  * Deliver high-accuracy, personalized health insights using Generative AI (Gemini).
  * Reduce user cognitive load through proactive, actionable alerts and seamless integrations.
  * Empower users with conditions (e.g., PCOS, PMDD, Endometriosis) by offering specialized tracking and reporting.

## 3. Target Audience
* **Primary:** Women ages 16-50 tracking their menstrual cycles.
* **Secondary:** Women managing specific reproductive conditions (PCOS, Endometriosis, PMDD) who find standard trackers inadequate.
* **Tertiary:** Women entering perimenopause seeking to track changing symptoms and energy levels.

## 4. Key Features & Requirements

### 4.1 First-Time User Experience (FTUE) & Onboarding
* **Progressive Permissions:** Delaying Drive/Calendar authorization until the user is invested.
* **Guest Mode:** Ability to use the app immediately via local storage without a mandatory signup.
* **Hyper-Personalized Wizard:** Multi-step intake capturing Cycle Length, Last Period Date, Diagnosed Conditions, Contraceptive Methods, Dietary Preferences, and AI Tone preference.
* **Data Import:** Ability to upload CSV exports from legacy apps (Flo/Clue) and have Gemini map the data.

### 4.2 Core Cycle Intelligence
* **Dynamic Phase Tracking:** Visualization of the 4 cycle phases (Menstrual, Follicular, Ovulation, Luteal) dynamically updated based on logged symptoms, not just dates.
* **Cycle-Synced Guidance:** Daily recommendations for nutrition, fitness, and mental health tailored to the current phase and dietary preferences (e.g., vegetarian).
* **AI Symptom Forecasting:** Tomorrow's probability prediction for specific symptoms based on historical data.

### 4.3 Privacy & Architecture
* **Local-First Database:** All primary logging happens on the device via IndexedDB (Dexie.js).
* **Private Drive Backup:** Automated, encrypted syncing to a hidden folder in the user's personal Google Drive (`drive.appdata` scope). No central database.
* **Biometric Lock:** Optional FaceID/TouchID app gate.

### 4.4 Advanced Integrations
* **Voice Logging:** Users can log symptoms conversationally ("Hey Google, log a headache").
* **Google Calendar Sync:** Automated blocking of "Low Energy" and "Peak Fertility" windows.
* **Smart Ecosystem:** Exporting phase-specific recipes to Google Keep or Instacart.

## 5. Success Metrics (KPIs)
* **Activation Rate:** % of users completing the Onboarding Wizard.
* **Engagement:** Average days per week a user interacts with the app or logs a symptom.
* **Retention:** Day 30 and Day 90 retention rates.
* **Backup Opt-in Rate:** % of users successfully connecting their Google Drive for backups.

## 6. Assumptions & Constraints
* **Assumptions:** Users have access to a modern browser supporting IndexedDB and basic PWA capabilities. Users have a Google Account to utilize the Drive backup and Calendar sync features.
* **Constraints:** Gemini API rate limits and token costs. (Mitigation: Implement aggressive local caching to limit API calls to 1x per day).
