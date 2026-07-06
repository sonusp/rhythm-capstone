# Google Rhythm 🌸

An AI-powered, privacy-first women's health Concierge Agent. Built for the Kaggle **AI Agents: Intensive Vibe Coding Capstone Project**.

![Google Rhythm](public/screenshot.png)

## 🏆 Kaggle Capstone Submission Overview
**Track:** Concierge Agents

Google Rhythm is an autonomous health companion that deeply understands a user's lifecycle stage (Cycle, TTC, Pregnancy, Perimenopause, Childfree) and proactively manages their health journey without ever compromising their data privacy.

---

## 🛑 The Problem
Women’s health tracking is fundamentally broken on two fronts: **Privacy** and **Personalization**. 
1. **The Privacy Crisis:** Major period tracking applications have faced massive FTC fines for secretly sharing highly sensitive medical data with third-party advertisers. Users are forced to choose between managing their personal health and surrendering their intimate data to the cloud. 
2. **The Personalization Deficit:** Existing apps rely on rigid calendar-math averages (the "28-day myth") and serve generic, static tips. They fail to adapt to the complex, non-linear realities of the human body, especially for those navigating conditions like PCOS, Endometriosis, or changing life stages.

## 💡 The Solution
Google Rhythm solves this by utilizing **AI Agents** as a localized "Concierge". Traditional, deterministic software cannot adapt to the dynamic nuances of human health, but AI Agents uniquely solve this by continuously reasoning over multi-modal inputs.
* **100% Privacy by Design:** The app runs an offline-first architecture using IndexedDB. User data is encrypted locally, and zero health data is ever sold, shared, or accessible to us.
* **Agentic Voice Logging:** Instead of clicking through menus, users can simply talk to Google Rhythm. Our agentic system parses unstructured, spoken audio into structured clinical data (symptoms, severity, mood) and logs it directly to the local database.
* **Predictive Health Forecasting:** Using our background agent skills, the app reasons over the past 3 days of logs to predict upcoming symptoms and autonomously generates highly contextualized guidance.

---

## 🏗️ Architecture
Google Rhythm is built using a modern, serverless web stack designed for rapid deployment, high performance, and maximum security. We leaned heavily into multi-agent workflows (Vibe Coding) via **Antigravity** to rapidly prototype and build this application.

### Tech Stack
* **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion
* **State Management:** Zustand (with persist middleware)
* **Local Database:** Dexie.js (IndexedDB v3 Schema)
* **AI Providers:** Gemini 2.0 Flash, Llama 3.1 70B (via NVIDIA NIM), Deepgram, Groq
* **Backend (Proxy):** Vercel Serverless Functions (`/api/*`)

### The Multi-Agent System
1. **The Clinical Extraction Agent (Llama 3.1 70B):** Voice logs are routed to Deepgram/Groq for transcription, then passed to Llama 3.1 with a strict system prompt to perform clinical extraction, flagging severe symptoms and returning structured JSON.
2. **The Cycle Engine & Pattern Reasoner (Gemini 2.0 Flash):** An agent skill that evaluates daily states against historical IndexedDB logs. It calculates cycle phases proportionally and triggers Gemini to generate a personalized "Daily Insight".
3. **The Autonomous Alert Manager:** A Service Worker agent that monitors medication schedules and triggers aggressive OS-level push notifications.

### Security Features
To protect API keys and user privacy, all LLM reasoning occurs through a secure Vercel Serverless proxy (`/api/llm.js`). The frontend holds no API keys.

---

## 🛠️ Instructions for Setup
To run this project locally and reproduce the agentic features, follow these steps:

### 1. Prerequisites
* Node.js (v18 or higher recommended)
* Obtain your API Keys for full AI functionality:
  * Gemini API Key
  * NVIDIA NIM API Key (Optional for Llama 3.1 extraction)
  * Groq API Key (Optional for high-speed STT)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd google-rhythm
npm install
```

### 3. Environment Variables
Copy the example environment file and populate it with your keys:
```bash
cp .env.example .env.local
```
*(Open `.env.local` in your editor and paste your API keys. Note: Due to our secure architecture, browser-exposed keys are limited. Secure keys are strictly used by the Vercel API functions.)*

### 4. Running the Development Server
Start the Vite frontend and the Vercel API proxy:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📜 License
This project is licensed under the **CC-BY 4.0 License** as per the Kaggle Capstone Competition rules. See the `LICENSE` file for details.
