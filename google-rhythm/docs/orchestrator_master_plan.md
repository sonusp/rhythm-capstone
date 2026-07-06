# Master Orchestrator Architecture & Security Audit

I have synthesized the reports from all four expert subagents. Below is the brutal, uncompromising audit of the current `google-rhythm` codebase, prioritized by severity.

## 🚨 Tier 1: Critical Security & Architecture Flaws (Must Fix Immediately)

### 1. Hardcoded API Key Exposure (Vetoed by Security & Privacy)
*   **The Issue:** `RhythmAssistant.jsx` attempts to fetch a Deepgram token, but if it fails, it explicitly falls back to `import.meta.env.VITE_DEEPGRAM_API_KEY`. This means your master Deepgram API key is shipped in plaintext in the Vite production bundle, open to theft and abuse.
*   **The Fix:** Remove the fallback entirely. If the secure token proxy fails, the application must fail gracefully rather than leak credentials.

### 2. AudioContext Memory Leak (Security & Performance)
*   **The Issue:** `RhythmAssistant.jsx` instantiates new `AudioContext` objects but never explicitly calls `audioCtx.close()` when the component unmounts. Browsers strictly limit contexts (usually ~6 per tab). Opening and closing the assistant multiple times will permanently crash the tab's audio.
*   **The Fix:** Add a strict `useEffect` cleanup return function that closes the Web Audio context.

### 3. Cryptographic Iteration Weakness (Privacy)
*   **The Issue:** `crypto.js` utilizes `PBKDF2` with an iteration count of `100,000`. The modern OWASP standard for SHA-256 is `600,000` iterations. 
*   **The Fix:** Increase the iteration count to prevent brute-force attacks on the local vault.

## ⚡ Tier 2: Performance & PWA Optimization (High Priority)

### 1. Zero Code-Splitting (Performance Guru)
*   **The Issue:** `App.jsx` imports all heavy UI views (`VoiceRecorder`, `DashboardView`) and massive dependencies (`firebase`, `recharts`, `framer-motion`) synchronously. This bloats the initial Javascript chunk, causing massive delays on mobile networks.
*   **The Fix:** Wrap all route-level components in `React.lazy()` and `<Suspense>`, and dynamically import heavy libraries only where they are used.

### 2. PWA Caching Masking (Performance Guru)
*   **The Issue:** The `vite.config.js` Workbox configuration masks this bloat by artificially raising the `maximumFileSizeToCacheInBytes` to 5MB. 
*   **The Fix:** Lower the limit back to 2MB, configure `manualChunks` to isolate `firebase` and `recharts`, and implement aggressive `StaleWhileRevalidate` runtime caching.

## 🔒 Tier 3: Privacy & Zero-Knowledge Architecture

### 1. Plaintext PII in IndexedDB (Privacy Auditor)
*   **The Issue:** Health logs are currently stored in `Dexie` in plaintext. If the device is compromised, sensitive health data is fully exposed.
*   **The Fix:** Wrap Dexie read/writes with the `crypto.js` AES-GCM encryption layer to enforce a true zero-knowledge local architecture.

## 🎨 Tier 4: UX & Accessibility Polish

### 1. Typography Clashes (UI/UX Expert)
*   **The Issue:** `tailwind.config.js` specifies `Roboto` and `Outfit`, but `index.css` overrides the root font to `Inter`. 
*   **The Fix:** Unify the font tokens to use a single premium font family.

### 2. Accessibility Failures (UI/UX Expert)
*   **The Issue:** The Glowing Orb and various medication toggles use generic `<div>` tags without `aria-label` or `role="button"`, and actively suppress focus rings (`focus:outline-none`), rendering the app unusable for screen readers or keyboard navigation.
*   **The Fix:** Inject proper ARIA properties and `focus-visible` ring states.

---

### Recommended Execution Plan:
If you approve, I will delegate the fixes in the following order:
1. **Phase 1 (Security Hotfixes):** Patch the `AudioContext` leak, remove the API Key fallback, and bump PBKDF2 iterations.
2. **Phase 2 (Performance):** Implement `React.lazy()` code-splitting across `App.jsx`.
3. **Phase 3 (UX/Privacy):** Unify the fonts, fix ARIA labels, and look into encrypting the Dexie DB.
