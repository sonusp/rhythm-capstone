---
type: okf/concept
title: Codebase Architecture & Security Scan
description: Summary of the June 2026 full codebase scan detailing the local-first architecture, AI implementations, and critical security vulnerabilities.
tags: [architecture, security, audit, local-first]
timestamp: "2026-06-29"
---

# Codebase Architecture & Security Scan

This document serves as a summarized knowledge node based on the comprehensive codebase scan conducted on June 29, 2026. For the full report, refer to `docs/codebase_scan_report.md`.

## Core Architecture
- **Tech Stack:** React 19, Vite 8, Zustand v5, Tailwind CSS v4, Framer Motion.
- **Local-First Design:** Primary data storage is managed completely offline using **Dexie.js (IndexedDB)**.
- **Zero-Knowledge Encryption:** Sensitive exports and cloud syncing (via Google Drive) are encrypted client-side using `crypto.js` (AES-256-GCM with PBKDF2 at 600,000 iterations).

## AI Capabilities & Proxies
- **Dual LLM Strategy:** The app relies on **Google Gemini 2.0 Flash** (via `geminiService.js`) and a waterfall fallback pipeline for **NVIDIA NIM, Groq, and OpenRouter** (via `nimService.js`).
- **Voice Transcription:** Uses Deepgram STT for logging symptoms via voice.
- **Serverless API:** Integrations are proxied through Vercel serverless functions (`api/` directory) and a Cloudflare WebSocket Worker (`cloudflare-proxy/`) to prevent client-side API key leakage.

## Known Critical Security Vulnerabilities
As of the latest scan, the following high-priority issues were identified:
1. **OAuth ID Exposure:** The Google OAuth Client ID is hardcoded in `src/main.jsx`.
2. **Deepgram Key Exposure:** `VITE_DEEPGRAM_API_KEY` is bundled in the client and used in direct API calls to Deepgram TTS.
3. **Persisted Tokens:** Google OAuth access tokens are dangerously persisted to `localStorage` via Zustand `partialize`.
4. **Plaintext PINs:** Both the `lockPin` and `syncPin` are stored in plaintext in `localStorage`.
5. **PII Co-Location:** The `saveRecoveryKey()` function in `firestore.js` saves the encryption vault key alongside user PII (Email, Name).

## Planned Remediation
- Shift all exposed API calls behind serverless proxies.
- Transition plaintext PINs to hashed verifications.
- Decompose monolithic UI components (`SettingsView`, `DashboardView`) into modular pieces.
- Implement robust unit tests for the pure JavaScript `cycleEngine.js` and `patternEngine.js`.
