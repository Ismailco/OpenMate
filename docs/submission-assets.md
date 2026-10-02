# OpenMate Submission Assets & Screenshot Plan

> Guidelines and checklists for capturing visual evidence for the DEV challenge submission post (*Hacktoberfest Weekend Challenge: Build for a Friend*).

---

## 1. Product Screenshots (Production Web Application)

All product screenshots should be captured directly from the live Render production environment at [https://openmate-zq7d.onrender.com](https://openmate-zq7d.onrender.com).

### `openmate-01-landing.png`
* **Target View**: Homepage (`/`)
* **What to Show**: Hero section, headline ("Your first contribution starts here"), value proposition, and the repository input entrypoint.
* **What to Omit**: Browser bookmarks, extraneous desktop windows.
* **Dimensions**: 1400–1600px width desktop viewport.
* **Article Section**: `## What I Built` / `## Demo`

### `openmate-02-profile.png`
* **Target View**: Contributor Onboarding Form (`/start`)
* **What to Show**: Repository URL input with valid GitHub target, skills selector (e.g., TypeScript, React), contribution interests pills, available weekly hours slider, and experience level selection.
* **What to Omit**: Sensitive personal email addresses or internal development bookmarks.
* **Dimensions**: 1400–1600px width desktop viewport.
* **Article Section**: `## How I Built It`

### `openmate-03-recommendation.png`
* **Target View**: Contributor Results Dashboard (`/repo`) - Primary Recommendation
* **What to Show**: "Your First Contribution" hero card displaying the matched GitHub issue number, canonical title, fit badge, matched developer skills, implementation scope, and actionable starting steps.
* **What to Omit**: Any sensitive user cookies or developer console overlays.
* **Dimensions**: 1400–1600px width desktop viewport.
* **Article Section**: `## Demo` / `## What I Built`

### `openmate-04-architecture.png`
* **Target View**: Contributor Results Dashboard (`/repo`) - Repository Onboarding Section
* **What to Show**: Detected tech stack badges, architectural subsystems breakdown, first files to understand, and local setup commands.
* **What to Omit**: None.
* **Dimensions**: 1400–1600px width desktop viewport.
* **Article Section**: `## How I Built It` (Gemma Repository Analysis)

### `openmate-05-chat.png`
* **Target View**: Ask OpenMate Interactive Chat Drawer / Panel (`/repo`)
* **What to Show**: Conversational thread displaying a developer question (e.g. asking about repository structure or testing commands) and Gemma's repository-grounded response with Backboard RAG retrieval context.
* **What to Omit**: Conversation tokens or signing parameters (these remain server-side and invisible in UI).
* **Dimensions**: 1400–1600px width desktop viewport.
* **Article Section**: `## How I Built It` (Ask OpenMate & Backboard RAG)

---

## 2. Sentry Observability Screenshots (Best Use of Sentry Agent Tracing)

Capture these directly from the Sentry dashboard for project `OpenMate` (Organization / Project: OpenMate).

### `sentry-01-analysis-waterfall.png`
* **Target View**: Sentry Performance / Traces $\rightarrow$ Trace Detail (`openmate.analysis`)
* **What to Show**: The complete trace waterfall hierarchy:
  * `openmate.analysis` (root span, ~48.55s total)
  * `github.ingest` (~1.82s)
  * `openmate.context.build` (~0.08s)
  * `gen_ai.chat` (Gemma repository analysis, ~23.40s)
  * `openmate.recommendation.candidates` (~0.02s)
  * `gen_ai.chat` (Gemma contribution recommendations, ~22.85s)
* **What to Omit**: Sentry organization billing details, unredacted account email addresses.
* **Article Section**: `### Sentry Agent Tracing`

### `sentry-02-gemma-span.png`
* **Target View**: Sentry Span Details panel for `gen_ai.chat` (`Gemma repository analysis`)
* **What to Show**: Span attributes panel showing:
  * `gen_ai.operation.name`: `repository_analysis`
  * `gen_ai.request.model`: `google/gemma-3-27b-it`
  * `gen_ai.system`: `backboard`
  * Duration and latency timeline
* **What to Omit**: Any sensitive authorization headers (already scrubbed by OpenMate's privacy hooks).
* **Article Section**: `### Sentry Agent Tracing` / `### Gemma`

### `sentry-03-rag-indexing.png`
* **Target View**: Sentry Trace Detail for `openmate.chat.init` (`OpenMate chat initialization`)
* **What to Show**: The initialization waterfall showing:
  * `github.ingest`
  * `openmate.context.build`
  * `openmate.rag.upload` (~0.30s)
  * `openmate.rag.index` (~7.10s) with status `indexed`
* **What to Omit**: Internal Backboard assistant and document IDs.
* **Article Section**: `### Sentry Agent Tracing` / `### Backboard`

### `sentry-04-ai-conversation.png`
* **Target View**: Sentry Agent Monitoring / AI Conversations View
* **What to Show**: The conversation timeline displaying both chat turns grouped under the deterministic one-way SHA-256 identifier (`conv_<sha256(threadId)>`).
* **What to Omit**: Raw thread IDs (OpenMate automatically masks these as cryptographic SHA-256 hashes).
* **Article Section**: `### Sentry Agent Tracing`

---

## 3. Render Hosting Evidence (Best Use of Render)

### `render-01-live-service.png`
* **Target View**: Render Dashboard $\rightarrow$ Web Service `openmate`
* **What to Show**: Service name `openmate`, Region (Frankfurt / Oregon), Service type (Node Web Service), Live Status indicator (Green "Live"), and the active deployed commit revision matching GitHub `main`.
* **What to Omit**: Environment variable values (`BACKBOARD_API_KEY`, `GITHUB_TOKEN`, `SENTRY_DSN`, `RENDER_API_KEY`). Ensure the "Environment" tab or values are hidden.
* **Article Section**: `### Render`

---

## 4. Privacy & Pre-Publication Sanitization Checklist

Before inserting any screenshot into the final DEV post:
- [ ] Verify no API keys, tokens, or authorization headers are visible.
- [ ] Verify no personal email addresses, browser bookmarks, or sensitive directory paths are visible.
- [ ] Confirm all numbers match the verified production measurements (48.55s total analysis, ~23.4s Gemma analysis, ~22.85s Gemma recommendations, 8.35s RAG initialization).
- [ ] Save images in PNG or WebP format with clear contrast and high resolution.
