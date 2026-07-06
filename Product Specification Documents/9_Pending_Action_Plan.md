# Google Rhythm: Action Plan & Pending Sprints Priority

After scanning the `8_Prioritized_Roadmap.md`, `Progress.md`, and `Fetures.md` specifications, I have cross-referenced what is already implemented against the original scope. 

Here is the prioritized action plan for the pending features, broken down into sprints. 

---

## 🔴 SPRINT 1: Design & UX Polish (Launch Blocker)
*Currently the biggest blocker before Private Beta. The backend and AI are powerful, but the UI needs a Google-level premium finish.*

| Priority | Feature / Task | Effort | Impact |
| :--- | :--- | :--- | :--- |
| **1.1** | **Standardize Design System:** Create `design-tokens.js` and unify `Card`, `Button`, `Modal` primitives. Fix inconsistent `p-4`/`p-5` spacing and border radii. | High | 5/5 |
| **1.2** | **Fluid Animations:** Add Framer Motion (or pure CSS) for page transitions, modal slide-ups, and add Lottie animations to the empty states. | Med | 4/5 |
| **1.3** | **Accessibility (A11y) Audit:** Fix dark mode contrast issues (`text-gray-400` on `bg-black`), add ARIA labels, and ensure focus rings are visible. | Med | 5/5 |
| **1.4** | **Dashboard Hierarchy:** Implement a shadow elevation system (`shadow-sm` to `shadow-lg`) to give cards depth. | Low | 4/5 |

---

## 🟠 SPRINT 2: "Depth & Differentiation" (The Magic)
*These features differentiate Google Rhythm from every competitor on the market.*

| Priority | Feature / Task | Effort | Impact |
| :--- | :--- | :--- | :--- |
| **2.1** | **Rhythm Voice Assistant Orb:** Implement the Siri-like Llama-powered voice orb in the Insights tab (as planned in the previous artifact). | High | 5/5 |
| **2.2** | **Gut-Cycle Tracker:** Add GI symptom tracking (Bloating, Constipation) and correlate with progesterone slow-downs. | Low | 4/5 |
| **2.3** | **Athletic Performance Optimizer:** Phase-appropriate workout advice (e.g. ACL risk at ovulation, higher RPE in luteal). | Med | 4/5 |

---

## 🟡 SPRINT 3: Clinical Power Features
*Turning the app into a medical advocacy tool.*

| Priority | Feature / Task | Effort | Impact |
| :--- | :--- | :--- | :--- |
| **3.1** | **Full PCOS Condition Mode:** Dedicated dashboard view emphasizing insulin tracking and low-glycemic AI recipes. | High | 5/5 |
| **3.2** | **Endometriosis Condition Mode:** Dedicated tracking for pain locations and anti-inflammatory AI guidance. | High | 5/5 |
| **3.3** | **Mental Health Correlation:** Integrate PHQ-2 / GAD-2 scales to track PMDD patterns alongside cycle phases. | Med | 5/5 |
| **3.4** | **Bloodwork / Lab Result Tracker:** UI to log hormone panels (FSH, LH, Ferritin) and have Gemini interpret trends. | High | 4/5 |
| **3.5** | **Customizable Dashboard:** Drag-and-drop capability so users can hide cards they don't use. | Med | 4/5 |

---

## 🔵 SPRINT 4: Google Ecosystem Superpowers
*Exclusive Google tech stack integrations.*

| Priority | Feature / Task | Effort | Impact |
| :--- | :--- | :--- | :--- |
| **4.1** | **Automated Partner Nudges:** Weekly Gemini-generated digest sent to authorized partners to increase empathy. | Med | 4/5 |
| **4.2** | **Home Screen Widget:** One-tap symptom logging (iOS/Android PWA) without opening the app. | High | 4/5 |
| **4.3** | **Google Keep Integration:** Export cycle-synced meal plans / grocery lists to Keep. | Low | 4/5 |
| **4.4** | **Google Home / Nest Hub:** Morning cycle briefing and Nest Thermostat auto-lowering during the luteal phase. | High | 4/5 |

---

## 🟣 SPRINT 5: Frontier AI
*Long-term vision features.*

| Priority | Feature / Task | Effort | Impact |
| :--- | :--- | :--- | :--- |
| **5.1** | **Photo Acne Tracking:** Gemini Vision tracks acne severity by cycle phase. | High | 4/5 |
| **5.2** | **Voice Journal Sentiment Analysis:** Audio transcription that detects distress/depression signals. | High | 4/5 |
| **5.3** | **CGM Integration:** Dexcom/Libre glucose data overlaid with cycle phase. | Very High | 4/5 |

---

### What to tackle right now?
Based on the roadmaps, **Sprint 1 (Design/UX Polish)** is flagged as the immediate blocker for the Private Beta launch. Alternatively, since you opted to skip Sprint 1, we can jump straight into building the **Rhythm Assistant Orb** or the **Gut-Cycle Tracker** from Sprint 2.
