# Kaggle Writeup: Google Rhythm

*Use this document to easily copy and paste your project details directly into the Kaggle Writeup UI.*

---

## Basic Details

**Title (Max 80 chars):**
Google Rhythm: The Autonomous, Privacy-First Health Concierge

**Writeup URL:**
*(Keep the auto-generated Kaggle URL)*

**Subtitle (Max 140 chars):**
A localized AI agent using STT and LLMs to track, predict, and manage women's health with 100% offline-first privacy.

---

## Assets & Categories

**Card and Thumbnail Image:**
*(Upload a screenshot of the `Dashboard` or `Onboarding Wizard` showing the clean, Google-inspired UI. Ensure dimensions are exactly **560 x 280 pixels**.)*

**Submission Tracks:**
Concierge Agents

**Media Gallery:**
- **Cover Image:** *(Upload your 560x280 thumbnail here)*
- **Video:** *(Insert your YouTube Video URL here - Max 5 minutes)*
  > 💡 **Tip for Video:** Ensure your video explicitly demonstrates **Antigravity** usage, app **Deployability** (e.g., showing it live on Vercel), and highlights the **Security features** (like the Vercel Proxy and Local-first architecture) to hit the evaluation criteria!

---

## Project Description
*(Max 2500 Words)*

### 1. Problem Statement: The Privacy & Personalization Crisis
Women’s health tracking is fundamentally broken on two fronts: Privacy and Personalization. 

First, the **Privacy Crisis**: Major period tracking applications have faced massive FTC fines for secretly sharing highly sensitive medical data with third-party advertisers. Users are forced to choose between managing their personal health and surrendering their intimate data to the cloud. 

Second, the **Personalization Deficit**: Existing apps rely on rigid calendar-math averages (the "28-day myth") and serve generic, static tips. They fail to adapt to the complex, non-linear realities of the human body, especially for those navigating conditions like PCOS, Endometriosis, or changing life stages like Perimenopause or trying to conceive (TTC).

### 2. Why Agents? 
Traditional, deterministic software cannot adapt to the dynamic nuances of human health. AI Agents uniquely solve this by continuously reasoning over multi-modal inputs. Instead of clicking through menus, users can simply talk to Google Rhythm. Our agentic system parses unstructured, spoken audio into structured clinical data, detects irregular biological patterns, and autonomously generates highly contextualized guidance—all while executing complex tasks like scheduling strict medication alarms across the user's operating system. 

### 3. The Solution: Google Rhythm
Google Rhythm operates as a localized "Concierge Agent" that deeply understands the user's current lifecycle stage and proactively manages their health journey.
*   **100% Privacy by Design (The Rhythm Vault):** The app runs an offline-first architecture using IndexedDB. User data is encrypted locally, and zero health data is ever sold, shared, or accessible to us.
*   **Agentic Voice Logging:** Users can speak their symptoms ("I have a splitting headache and my cramps are terrible today"). The app's STT->LLM pipeline autonomously transcribes the audio, extracts clinical metadata, and logs it directly.
*   **Predictive Health Forecasting:** Using background agent skills, the app reasons over the past 3 days of logs to predict upcoming symptoms and autonomously caches insights.

### 4. Architecture & Implementation
Google Rhythm is built using a modern, serverless web stack designed for rapid deployment, high performance, and maximum security. We leaned heavily into **Antigravity** and multi-agent workflows (Vibe Coding) to rapidly prototype, build, and debug this application. 

**Tech Stack:** React 19, Vite, Tailwind CSS, Zustand, Dexie.js (IndexedDB).
**AI Frameworks:** Gemini 2.0 Flash, Llama 3.1 70B (via NVIDIA NIM), Deepgram, Groq.

**The Multi-Agent System:**
1.  **The Clinical Extraction Agent (Llama 3.1 70B):** Voice logs are routed to Deepgram/Groq for transcription, then passed to Llama 3.1 with a strict system prompt to perform clinical extraction, flagging severe symptoms and returning structured JSON.
2.  **The Cycle Engine & Pattern Reasoner (Gemini 2.0 Flash):** An agent skill that evaluates daily states against historical IndexedDB logs. It calculates cycle phases proportionally and triggers Gemini to generate a personalized "Daily Insight".
3.  **The Autonomous Alert Manager:** A Service Worker agent that monitors medication schedules and triggers aggressive OS-level push notifications.

**Security & Deployability (Key Concepts Demonstrated):**
*   **Security Features:** To protect API keys and user privacy, all LLM reasoning occurs through a secure Vercel Serverless proxy (`/api/llm.js`). The frontend holds no API keys.
*   **Deployability:** The app is a fully installable Progressive Web App (PWA) instantly deployed to Vercel, demonstrating production-ready architecture.

### 5. The Build Journey
Building Google Rhythm during this intensive capstone sprint required rapid iteration via "vibe coding". We utilized **Antigravity** to orchestrate the build process, leveraging its capabilities to tackle different facets of the architecture simultaneously. 

The biggest hurdle was bridging AI capabilities with strict medical privacy. Initially, exposing API keys in the browser was a severe flaw. We utilized AI to help architect a secure Vercel Serverless proxy layer. For the audio pipeline, we abandoned the native Web Speech API and engineered a raw `.webm` pipeline connected directly to Groq/Deepgram for flawless medical transcription. 

By combining the reasoning power of frontier LLMs with a strict, localized architecture, Google Rhythm proves that AI Concierge Agents can handle our most sensitive data safely, beautifully, and autonomously.

---

## Attachments

**Project Links:**
- **Live Interactive Demo:** *(Insert your Vercel app link here)*
- **Public Code Repository:** *(Insert your GitHub link here)* 
  > 💡 **Tip:** Ensure your GitHub repository has a `README.md` explaining the problem, solution, architecture, and instructions for setup.
