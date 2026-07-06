# Technical Requirements Document (TRD)
**Product Name:** Google Rhythm  
**Version:** 1.0  
**Last Updated:** June 2026  

## 1. System Architecture
Google Rhythm follows a **Local-First, Client-Side Heavy** architecture. It is built as a Single Page Application (SPA) utilizing Vite and React. The application does not rely on a centralized backend database (like PostgreSQL or MongoDB) for storing user data. Instead, the "backend" logic is executed directly in the browser using IndexedDB, with external API calls serving only for AI processing and optional cloud synchronization.

### 1.1 Tech Stack
* **Frontend Framework:** React 18+
* **Build Tool:** Vite
* **Styling:** TailwindCSS
* **State Management:** Zustand (with persist middleware)
* **Local Database:** Dexie.js (wrapper for IndexedDB)
* **Authentication/OAuth:** `@react-oauth/google`
* **AI Provider:** Google Generative AI (Gemini API)
* **Hosting/Deployment:** Vercel

## 2. Data Storage Strategy (Local-First)
* **IndexedDB (via Dexie.js):** Used for complex, relational data such as historical symptom logs and daily AI insights. This allows for fast querying (e.g., retrieving all logs from the past 30 days) and virtually unlimited storage size on modern browsers.
* **LocalStorage (via Zustand Persist):** Used for lightweight, single-value application state such as `isDarkMode`, `isOnboardingComplete`, and `userPrefs` configuration objects.

## 3. External API Specifications

### 3.1 Google Drive API (Backup Service)
* **Endpoint:** `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
* **Scope Required:** `https://www.googleapis.com/auth/drive.appdata`
* **Mechanism:** The application serializes the Dexie.js tables into a JSON string (`google_rhythm_backup.json`) and uploads it to the hidden AppData folder. This file is inaccessible to the user via standard Google Drive UI and inaccessible to other applications.

### 3.2 Google Calendar API (Sync Service)
* **Endpoint:** `https://www.googleapis.com/calendar/v3/calendars/primary/events`
* **Scope Required:** `https://www.googleapis.com/auth/calendar.events`
* **Mechanism:** Posts all-day events using absolute dates calculated relative to the user's current cycle day.

### 3.3 Google Gemini API (AI Service)
* **Endpoint:** `@google/genai` Node/Browser SDK.
* **Mechanism:** The application concatenates the user's recent symptom logs and dietary preferences into a structured prompt, requesting a JSON or Markdown response containing predictive insights.
* **Optimization:** Responses must be cached in IndexedDB indexed by `date` to prevent duplicate API calls within a 24-hour period.

## 4. Security Implementation
* **API Keys:** Environment variables (`VITE_GEMINI_API_KEY`, `VITE_GOOGLE_CLIENT_ID`) are used. Note: Client-side exposed API keys for Gemini must eventually be proxied through a secure serverless function (e.g., Vercel Functions) for production to prevent key scraping.
* **OAuth Flows:** Uses implicit or authorization code flows managed securely by the official Google Identity Services library.

## 5. Deployment Pipeline
* **Environment:** Vercel (Hobby Tier)
* **CI/CD:** Automated builds triggered via GitHub pushes.
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
