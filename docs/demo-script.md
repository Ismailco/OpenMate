# OpenMate Video Demo Script (60–90 Seconds)

> A concise, judge-focused demo script walking through OpenMate's value proposition, live contributor flow, and technical architecture.

---

## Video Overview
* **Target Duration**: 75–90 seconds
* **Visuals**: Screencast of production web application (`https://openmate-zq7d.onrender.com`) and Sentry dashboard
* **Audio**: Clear, voiceover narration

---

## Script Breakdown

### 0:00 – 0:12 | The Human Problem
* **Visual**: Camera starts on the OpenMate homepage hero: *"Your first contribution starts here."* Quick pan to a crowded GitHub repository with 400+ open issues.
* **Narration**:
  > *"Every developer remembers trying to make their first open-source contribution. The challenge isn't writing code—it's understanding an unfamiliar architecture, navigating hundreds of issues, and figuring out where to safely begin. I built OpenMate for my friend [Name] to solve exactly that."*

### 0:12 – 0:28 | Onboarding & Developer Profile
* **Visual**: Click "Get Started" to navigate to `/start`. Type in a public repository URL (`Ismailco/OpenMate`), select `TypeScript` and `React`, select `developer-tools` and `documentation` interests, set `5 hours/week`, and click "Analyze Repository".
* **Narration**:
  > *"Instead of generic advice, OpenMate takes a public GitHub repository and your personal developer profile. In a single bounded pass, it ingests the codebase, builds a deterministic context, and analyzes the architecture using Google Gemma 3 27B."*

### 0:28 – 0:50 | "Your First Contribution" Dashboard
* **Visual**: Results load on `/repo`. Cursor focuses on the prominent "Your First Contribution" hero card. Scroll down to show the matched skills, implementation scope, entrypoint files, and starting steps. Briefly show the detected tech stack and local setup commands.
* **Narration**:
  > *"Here is the personalized dashboard. OpenMate deterministically shortlists real, open GitHub issues and uses Gemma to find the best match. For this issue, it explains why the developer's skills fit, estimates the scope, points directly to the three files to read first, and outlines concrete starting steps without hallucinating fake code."*

### 0:50 – 1:08 | Ask OpenMate (Backboard RAG)
* **Visual**: Open the "Ask OpenMate" drawer on the right. Type: *"Where should I look if I want to understand how the context budget is enforced?"* Gemma responds within seconds with repository-grounded guidance citing specific files.
* **Narration**:
  > *"When my friend has questions during development, 'Ask OpenMate' provides repository-grounded assistance. Powered by Backboard's thread-scoped RAG and Gemma 3 27B, the assistant answers questions grounded strictly in the repository's actual code—with persistent memory intentionally turned off to protect developer privacy."*

### 1:08 – 1:25 | Open-Weight AI & Sentry Agent Tracing
* **Visual**: Switch tabs to Sentry Trace Waterfall showing `openmate.analysis`, child spans, and latency breakdown (48.55s total, ~96% Gemma inference, 8.35s RAG initialization).
* **Narration**:
  > *"OpenMate runs on Google Gemma 3 27B—an open-weight model ensuring transparency and auditability. In production on Render, we use Sentry Agent Tracing to instrument every AI workflow. Our traces revealed that deterministic stages take under two seconds, while Gemma's multi-step reasoning accounts for 96% of analysis time."*

### 1:25 – 1:30 | Conclusion & Call to Action
* **Visual**: Return to homepage with the deployed URL visible: `https://openmate-zq7d.onrender.com`.
* **Narration**:
  > *"OpenMate is open source and live today. Thank you!"*
