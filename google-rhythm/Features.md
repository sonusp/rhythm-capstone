# Google Rhythm: Comprehensive Features & Implementation Memory

This document serves as the persistent memory and technical blueprint for **Google Rhythm**, an AI-powered, privacy-first women's health companion, built as a submission for the **Kaggle AI Agents: Intensive Vibe Coding Capstone Project**.

---

## 🔒 Core App Philosophy
*   **Hybrid Local & Cloud Sync:** Offline-first architecture using IndexedDB, seamlessly backed by Firebase Firestore for real-time syncing using Anonymous Authentication.
*   **No Placeholders:** Every UI interaction is connected to real logic or data streams.
*   **Aesthetic UI/UX:** Built with TailwindCSS and Lucide React icons, featuring a premium glassmorphic, animated, native-app feel with full Light/Dark mode support.

---

## 🚀 Active Features (Fully Implemented)

### 1. Multi-Stage Lifecycle Modes
The app mathematically and visually adjusts its entire dashboard based on the user's selected lifecycle stage:
*   **Cycle Intelligence:** Tracks periods, ovulation, and symptoms with AI-powered phase insights.
*   **Try to Conceive (TTC):** Optimizes for conception with fertility windows and ovulation alerts.
*   **Pregnancy & Postpartum:** Week-by-week fetal development, symptom tracking, and postpartum companion.
*   **Perimenopause:** Navigates irregular cycles, hot flashes, and hormonal transitions.
*   **Childfree Mode:** Zero fertility UI. Focuses purely on symptom tracking and cycle phase awareness.

### 2. The AI Voice Engine (STT -> LLM Pipeline)
Users can log symptoms just by speaking.
*   **Audio Capture:** The browser records an audio Blob via the microphone.
*   **Speech-to-Text (STT) Waterfall:** Audio is transcribed with ultra-fast latency. 
    *   *Primary:* Groq (Whisper-Large-v3-Turbo)
    *   *Secondary:* NVIDIA Canary-1b (NIM)
*   **Symptom Extraction (LLM):** The transcribed text is sent to **NVIDIA Llama 3.1 70B**. The AI uses a highly structured prompt to pull out clinical metadata.
*   **AI Safeguards:** Intercepts silent audio or Whisper hallucinations (e.g., "Thanks for watching"). Includes an `is_health_related` flag to reject non-medical logs (like grocery lists), and a `target_date` flag to allow users to retroactively log symptoms from "yesterday".

### 3. Predictive "Insights" AI
*   **Symptom Forecasting:** Uses Llama 3.1 to analyze the last 3 days of logs to predict tomorrow's most likely symptom (e.g., "75% chance of fatigue").
*   **Conversational Chat:** Users can ask the AI questions in the Insights tab about their cycle (e.g., "Why am I craving salt?"), and Llama 3.1 acts as an empathetic health coach.
*   **Medication Compliance History (Planned):** A visual calendar or timeline view within the Insights tab that reads from the `medHistory` permanent ledger, allowing users to verify exactly which days they took their supplements and medications.

### 4. Zero-Knowledge "Rhythm Vault" Backup 🔒
*   **Local Web Crypto:** Uses `window.crypto.subtle` to derive an AES-256-GCM encryption key from a user-provided password using PBKDF2 (100,000 iterations).
*   **Export/Import:** Encrypts the entire IndexedDB database into a chunked Base64 `.rhythm` file. It is mathematically unbreakable without the password, honoring the 100% offline pledge.

### 5. Private Integrations
*   **Google Calendar Sync:** Securely syncs "Peak Fertility" or "Low Energy" days to the user's private Google Calendar.
*   **Google Drive "AppData" Sync:** Securely uploads the AES-encrypted `.rhythm` vault file to a hidden, app-specific folder in their Google Drive.

### 6. Firebase Cloud Sync ☁️
*   **Anonymous Authentication:** Users are automatically signed in anonymously to protect identity.
*   **Real-Time Data Sync:** Synchronizes user preferences, daily logs, and active medication schedules to Firestore.

### 7. Interactive Onboarding & Tutorials 🎓
*   **3-Step Tutorial Carousel:** Beautiful Lottie-animated swipeable cards teaching users about AI, Privacy, and Diet upon first launch.
*   **Biometric Lock Screen:** Enforces privacy with a secure 4-digit PIN pad and auto-lock capability.

---

## 🔮 Future Roadmap (Voice Companion AI)
*The following is the drafted architecture for upgrading the Voice Engine into a Real-Time Conversational AI Companion. It is documented here for future implementation.*

### 🎙️ Implementation Plan: Voice Companion Mode

#### Architecture Overview
When the user speaks to the app, the data will flow in a loop:
1. **User Speaks:** Browser records audio blob.
2. **STT (Speech-to-Text):** Deepgram (Nova-2) transcribes the audio to text (or fallback to Groq).
3. **The Brain (NVIDIA Llama 3.1):** Receives the text and generates a short, empathetic text response.
4. **TTS (Text-to-Speech):** Deepgram Aura instantly converts Llama's text back into a lifelike audio file.
5. **Playback & Logging:** The app plays the audio response to the user via an invisible `<audio>` element, while simultaneously running the `parseVoiceLog` extraction to save medical JSON to the database.

#### Phase 1: Deepgram Integration (`deepgramService.js`) ✅ COMPLETED
*   **TTS Function:** Implemented `generateAuraVoice(text)` calling `aura-asteria-en` for a soothing, natural female voice.
*   **STT Fallback:** Transcribes audio as an ultimate fallback if Groq and NVIDIA are unavailable.

#### Phase 2: LLM "Chat" Logic (`nimService.js`)
*   **Action:** Create `generateConversationalResponse(userText, cycleDay, mode)` in `nimService.js`.
*   **Prompt Engineering:**
    > *"You are Rhythm, an empathetic women's health coach. The user is on Cycle Day X. They just said: {userText}. Reply with exactly 1 to 2 short, comforting sentences to be spoken out loud. Be conversational, not robotic."*
*   **Dual Processing:** When the user speaks, the app will fire off two requests to NVIDIA:
    1.  Get the conversational text (for Deepgram Aura to speak back).
    2.  Run `parseVoiceLog` to extract the hidden JSON medical data for the dashboard.

#### Phase 3: The "Glowing Orb" UI (`CompanionMode.jsx`)
*   **Action:** Create `src/components/CompanionMode.jsx`
*   **Visuals:** Build a CSS-animated, glowing fluid orb (using Tailwind `animate-blob` and `mix-blend` utilities) that changes colors based on the state:
    *   🔵 **Blue Pulse:** Idle / Waiting for user
    *   🔴 **Red Expand:** Listening to the microphone
    *   🟣 **Purple Swirl:** Thinking / Contacting NVIDIA
    *   🟢 **Green Ripple:** Speaking the Deepgram Aura response

#### Phase 4: State Management & Wiring (`App.jsx`)
*   **Action:** Update the central `App.jsx` Voice FAB (Floating Action Button).
*   Instead of opening `VoiceRecorder.jsx`, it will now open `CompanionMode.jsx`.
*   Pass the global `currentDay` and `lifecycleMode` into the Companion so the AI always knows exactly where the user is before it speaks.

---

## 🔄 Future Roadmap (Rhythm Vault Auto-Sync & 1-Click Restore)
*A highly detailed, production-ready technical blueprint for implementing invisible, background Google Drive sync with zero-knowledge AES-256-GCM encryption.*

### 1. Data Structures & State Management
We must update the central Zustand store to handle transient encryption keys and sync statuses without exposing them to local disk storage.

**`src/store/useAppStore.js` Updates:**
*   **Persisted State:** Add `isAutoSyncEnabled: false` and `lastSyncTimestamp: null`.
*   **Transient State (Not Persisted):** Add `vaultKey: null` (holds the derived `CryptoKey` object), `syncStatus: 'idle' | 'syncing' | 'error' | 'locked'`, and `googleAccessToken: null`.
*   **Actions:** 
    *   `unlockVault(password)`: Calls `deriveKey(password, salt)` and stores the `CryptoKey` in memory.
    *   `lockVault()`: Immediately nullifies `vaultKey`.
    *   `setSyncStatus(status, errorMsg)`: Updates UI state.

### 2. Cryptography Upgrades (`src/services/crypto.js`)
Currently, `encryptVault` derives the key from the password every single time. This is CPU intensive. We must split this logic.
*   **Refactor `deriveKey`:** Export it so the app can call it once upon unlock.
*   **Refactor `encryptVaultWithKey(dataObj, cryptoKey)`:** A new function that accepts the pre-derived in-memory key instead of a raw password string. It will still generate a fresh IV and Salt for every single encryption payload.

### 3. The Auto-Sync Background Worker (`src/hooks/useAutoSync.js`)
Since React components mount and unmount, the auto-sync logic should be a globally mounted hook (e.g., inside `App.jsx`) that listens to IndexedDB.
*   **Dexie Observer:** Use `db.on('changes', callback)`.
*   **Debounce Logic:** Database changes fire rapidly (e.g., typing a note). The hook must wrap the sync trigger in a `lodash.debounce` (or custom timeout) of **10 seconds**.
*   **Sync Pipeline Flow:**
    1. Check `if (!isAutoSyncEnabled || !vaultKey || !googleAccessToken) return;`
    2. Set `syncStatus` to `'syncing'`.
    3. `exportDB(db)`: Fetch all tables (logs, preferences, meds) into a single JSON blob.
    4. `encryptVaultWithKey(blob, vaultKey)`: Generate the Base64 ciphertext.
    5. `uploadBackupToDrive(googleAccessToken, ciphertext)`: HTTP PATCH/POST to Google Drive.
    6. Update `lastSyncTimestamp = Date.now()` and `syncStatus = 'idle'`.

### 4. Edge Cases & Error Handling
*   **Token Expiration:** Google Access Tokens expire after 1 hour. If `uploadBackupToDrive` returns a 401, catch the error, set `syncStatus = 'error'`, and trigger a UI prompt for the user to re-authenticate with Google.
*   **App Refresh (The "Locked" State):** If the user hard-refreshes the browser or closes the tab, the transient `vaultKey` is destroyed. Upon reopening, `isAutoSyncEnabled` will be true, but `vaultKey` is null. The UI must display a "Vault Locked - Tap to enter password and resume sync" banner at the top of the Dashboard.
*   **Concurrency:** If a sync is currently running, ignore new `db.on('changes')` triggers until the active upload completes, then queue one final sync.

### 5. UI/UX Implementation Details (`SettingsView.jsx`)

**Section A: Auto-Sync Configuration Panel**
*   **Toggle Switch:** Enable/Disable Auto-Sync.
*   **Password Setup Modal:** If enabling for the first time, require them to input a strong password twice (validation).
*   **Status Indicator:** Green dot ("Syncing in background"), Yellow dot ("Vault Locked - Enter Password"), Red dot ("Google Auth Expired").

**Section B: 1-Click Restore Modal**
*   **Trigger:** Prominent "Restore from Drive" button.
*   **Flow:**
    1. Run `useGoogleLogin()` to ensure valid access token.
    2. Show Modal: *"Enter your Rhythm Vault Password"*.
    3. Call `downloadBackupFromDrive()`. If 404, show "No backup found."
    4. Call `decryptVault(base64, password)`. If it throws, show "Incorrect Password. Data is undecryptable."
    5. **Critical Step:** Clear existing Dexie tables (`db.logs.clear()`, etc.) before bulk-inserting the decrypted payload to prevent primary key collisions.
    6. Run `window.location.reload()` to force the React tree and Zustand to re-hydrate from the freshly populated IndexedDB.
