---
type: okf/concept
title: Google Rhythm Project Progress
description: Current state, roadmap, and handoff notes for Google Rhythm
tags: [roadmap, context, architecture]
timestamp: "2026-06-29"
---
# Google Rhythm - Agent Progress & Handoff


## Goal
Build and deploy the "Google Rhythm" React application. The app aims to provide a mobile-first, dark-themed cycle intelligence tracker with integrated Gemini AI forecasting. We have shifted the architecture to a **Local-First (Bring Your Own Cloud)** approach for maximum privacy.

## Current State ✅
- **Phase 1-3 (UI/State/Scaffolding)**: ✅ Complete. Zustand store in place. UI separated into modular views (`DashboardView`, `LogView`, `InsightsView`, `SettingsView`).
- **Phase 4-5 (AI / Export / Multi-Mode)**: ✅ Complete. PDF Export is functional. Cycle, Pregnancy, and Perimenopause dashboards are actively swapping.
- **Phase 6 (Google Calendar Integration)**: ✅ Complete. Built deep-linking into Google Calendar directly from the Milestone list.
- **Phase 7 (Local-First Privacy Architecture)**: ✅ Complete. Migrated away from centralized Firebase to **Dexie.js (IndexedDB)**. All user logs and AI insights are now cached and stored purely on the user's local browser device (`src/services/db.js`).
- **Phase 8 (Daily Forecast Caching)**: ✅ Complete. `InsightsView` now checks `db.js` for a cached AI insight before hitting the Gemini API to save API calls.
- **Phase 9 (Settings Widgets Redesign)**: ✅ Complete. Redesigned the home screen widgets in `SettingsView` to match minimal, sleek Apple-style complications (2x2 Phase widget and a Voice Pill widget).
- **Phase 10 (Deployment / Tunneling)**: ✅ Setup a Production Build (`npm run build`) and served it via `npx serve dist -l 5174`, which was then tunneled via Localtunnel to avoid Vite dev-server HMR chunking issues on mobile.

## Next Steps for Tomorrow 🚀
1. **Google Keep / Instacart Grocery Integration**: Brainstormed earlier, we need to build a feature that suggests meals based on hormonal phases and exports the list to Google Keep or Instacart.
2. **"Bring Your Own Cloud" (BYOC)**: Implement a daily JSON backup button to dump the IndexedDB data securely to the user's personal Google Drive.
3. **Passive Wearable Integration Concept**: Begin sketching the UI for Oura Ring/Fitbit passive tracking.

## Critical Notes for Next Agent
- **No Central Database**: We deliberately removed Firebase storage logic in favor of `dexie.js`. Do not attempt to add a central Postgres or Firebase DB. Privacy is the core selling point.
- **Tailwind CSS v4**: Uses `@tailwindcss/vite` plugin.
- **Icons**: Ensure any Lucide-react components used dynamically (like `Phase.icon`) are properly capitalized in JSX to avoid React throwing undefined element errors.
- **Running Locally**: Use `npm run dev`. To share a live link to mobile, run `npm run build`, then `npx serve dist -l 5174`, and `npx localtunnel --port 5174 --subdomain <name>`. Dev-server tunnels will fail with Vite 5 due to HMR chunks getting blocked.
