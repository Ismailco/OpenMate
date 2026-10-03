---
title: I Built OpenMate to Help a Friend Make Their First Open-Source Contribution
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

---

## What I Built

Every developer remembers the intimidating barrier of making their first open-source contribution.

A good friend of mine - [FRIEND INPUT REQUIRED: Name or pseudonym, e.g. Alex] - is a capable junior developer with strong [FRIEND INPUT REQUIRED: Primary skills, e.g. TypeScript and React] fundamentals. For months, they wanted to contribute to public open-source projects during Hacktoberfest. But every time they opened a prominent repository like [FRIEND INPUT REQUIRED: Repository name, e.g. a popular UI library or developer tool], they froze:

- The repository had hundreds of open issues, and even those labeled `good first issue` assumed intimate familiarity with monorepos or complex build tooling.
- The directory tree contained thousands of files across dozens of packages, with no clear indication of where a newcomer could safely make edits.
- Contribution guidelines were dense, and estimating whether a task would take two hours or two weeks felt impossible.

The barrier was not writing code - it was **navigating repository scale and finding a grounded starting point**.

I built **OpenMate** ([https://openmate-zq7d.onrender.com](https://openmate-zq7d.onrender.com)) specifically to solve this problem for my friend.

OpenMate takes any public GitHub repository and your personal developer profile (skills, skill levels, contribution interests, and weekly available time). In a single, bounded pass, it ingests the repository, extracts its architectural context, analyzes it using **Google Gemma 3 27B**, deterministically shortlists real open GitHub issues, and delivers **"Your First Contribution"** - a personalized, actionable dashboard showing:

1. **A Primary Recommended Issue**: The single highest-fit real issue on GitHub, explaining why your skills match, estimating scope (`small`, `medium`, `large`), and providing a concrete starting plan.
2. **First Files to Read**: The exact 2–3 entrypoint source files to inspect first, deterministically verified against the real repository tree.
3. **Local Setup & Gotchas**: Prerequisites, clean setup commands, and architectural warnings.
4. **Ask OpenMate**: An interactive, repository-grounded assistant powered by **Backboard thread-scoped RAG** and Gemma 3 27B, letting contributors ask follow-up questions about codebase conventions without persistent data retention.

> **Friend Testing & Handover**:
> [FRIEND INPUT REQUIRED: Insert friend's testing experience and feedback from docs/submission-inputs.md once tested. Example: *"When Alex tested OpenMate against their target repo, they received a recommendation for an issue touching the exact React components they felt comfortable with. In Alex's words: 'Having the repo tell me which 3 files to read first made the project feel 10x smaller.' "*]

---

## Demo

OpenMate is deployed as a production Node web service on Render:

🔗 **Live Production Application**: [https://openmate-zq7d.onrender.com](https://openmate-zq7d.onrender.com)  
🩺 **Production Health Endpoint**: [https://openmate-zq7d.onrender.com/api/health](https://openmate-zq7d.onrender.com/api/health)

<!-- [SCREENSHOT: openmate-01-landing.png - OpenMate Homepage Hero] -->

### How Contributor Onboarding Works

1. **Enter Repository & Skills**: Navigate to `/start`, enter a public GitHub repository (such as `Ismailco/OpenMate`), declare your technical skills (e.g., TypeScript, React), select your contribution interests (e.g., `developer-tools`, `documentation`), and set your weekly availability (e.g., 5 hours/week).
2. **Deterministic & AI Analysis**: OpenMate ingests the repository once, constructs a bounded 60,000-character context, analyzes the architecture with Gemma 3 27B, and evaluates open issues.
3. **Review "Your First Contribution"**: The contributor dashboard (`/repo`) presents the top-matched GitHub issue with fit analysis, entrypoint files, and local setup steps.
4. **Interactive Ask OpenMate Chat**: Open the chat panel to ask repository-specific questions. Gemma answers using vector retrieval over the repository context.

<!-- [SCREENSHOT: openmate-03-recommendation.png - Personalized Contributor Dashboard] -->

---

## Code

OpenMate is fully open source under the MIT License:

🔗 **GitHub Repository**: [https://github.com/Ismailco/OpenMate](https://github.com/Ismailco/OpenMate)

The codebase was created and built from scratch during the Hacktoberfest Weekend Challenge (first commit: `2026-10-02T11:43:52Z`). It features:
- **54 Vitest test files** with **255 passing tests** (100% offline, zero mocked secret leakage).
- **14 Playwright browser E2E tests** running against the production build with full CSP and security headers.
- **Automated GitHub Actions CI** with strict linting, typechecking, unit tests, and browser E2E gates.
- **Zero security vulnerabilities** (`pnpm audit` clean).

---

## How I Built It

Building an AI onboarding guide requires a fundamental architectural discipline: **deterministic software must own the boundaries, while generative AI owns the comprehension.**

Many AI tools fail because they give the language model unconstrained freedom to hallucinate file paths, make up issue numbers, or guess API URLs. OpenMate prevents this through strict separation of concerns.

```text
User Profile + GitHub Repo
            ↓
GitHub Ingestion Gateway (SSRF-protected, bounded)
            ↓
Deterministic Context Engine (60k character budget, priority ranking)
      ┌─────┴────────────────────────┐
      ▼                              ▼
Backboard Orchestration        Deterministic Candidate Selector
(google/gemma-3-27b-it)        (Heuristic scoring: labels, skills, interests)
      │                              │
Architecture & Stack Analysis   Shortlist of max 8 real GitHub issues
      └─────────────┬────────────────┘
                    ▼
      Gemma Personalized Recommendations (Fit score, scope, entrypoints)
                    ▼
      Grounding Verification (Restore canonical GitHub titles, URLs, paths)
                    ▼
      Client Session Delivery (/repo dashboard)
                    │
                    ▼
      Ask OpenMate (Backboard thread-scoped RAG + Gemma conversational reasoning)
```

### Key Engineering Decisions

#### 1. Secure & Bounded Ingestion Layer
OpenMate never fetches arbitrary URLs. Requests are restricted to `github.com` via strict SSRF filters that reject localhost, private RFC 1918 subnets, and non-HTTPS protocols. File paths are sanitized against directory traversal (`../`). To ensure fast response times and predictable token usage, ingestion inspects up to 500 tree entries, selects up to 100 open issues, and filters out minified bundles, lockfiles, and binary assets.

#### 2. Deterministic Context Engine
The context engine enforces a strict 60,000-character ceiling. It prioritizes documentation (`README.md`, `CONTRIBUTING.md`), dependency manifests (`package.json`, `Cargo.toml`), entrypoint source files, and open issue descriptions. Repository text is encapsulated within explicit untrusted content markers to neutralize indirect prompt injection attacks.

#### 3. Gemma Structured Repository Analysis
OpenMate uses **Google Gemma 3 27B** (`google/gemma-3-27b-it`) via Backboard orchestration to understand repository architecture. With a low temperature (`0.2`), Gemma extracts architectural subsystems, core technologies, and recommended files to understand. OpenMate deterministically verifies all suggested file paths against the real repository tree, stripping any hallucinations before they reach the user.

#### 4. Deterministic Issue Candidate Selection
Before calling Gemma for personalized matching, OpenMate evaluates all open issues deterministically. It scores issues using newcomer label heuristics (`good first issue`, `help wanted`), matches issue descriptions against the contributor's declared interests, and factors in experience level. This yields a focused candidate set of at most 8 real GitHub issues.

#### 5. Grounding & Canonical Identity Restoration
Gemma evaluates the 8 candidate issues against the contributor profile to produce fit scores, scope levels, and starting investigation steps. OpenMate intercepts the model's output and **restores canonical issue titles, numbers, and URLs directly from GitHub data**. Gemma is physically incapable of inventing non-existent issue numbers or URLs in OpenMate.

#### 6. Ask OpenMate via Thread-Scoped RAG
For follow-up questions, OpenMate creates an ephemeral Backboard assistant backed by vector RAG (`gemini-embedding-001-1536`, `top_k = 8`) over the repository context. 
- **Memory is intentionally OFF**: OpenMate has no authenticated durable user identities. Disabling persistent memory prevents cross-session prompt pollution and ensures complete privacy.
- **Web search is OFF**: All answers are grounded strictly in the repository's ingested context.
- **HMAC-SHA256 Signed Tokens**: Browser clients receive an HMAC-signed conversation token binding them to their ephemeral chat session. No API keys or provider secrets ever touch the browser.

---

### Partner Technologies

#### Render
OpenMate is deployed as a production Node web service on **Render** ([srv-db029o60tbcc73fssreg](https://dashboard.render.com)). 

Render is essential to OpenMate's architecture: OpenMate is not a static site. It runs secure server-side logic:
- Secret protection: `BACKBOARD_API_KEY`, `GITHUB_TOKEN`, and `OPENMATE_CHAT_SIGNING_SECRET` remain strictly server-side.
- GitHub ingestion and deterministic context construction execute on Node 22 without exposing raw repository contents or provider credentials to client browsers.
- Render's automated deployment pipeline deploys directly from `main` once GitHub Actions quality gates pass, with an integrated `/api/health` probe verifying revisions.

<!-- [SCREENSHOT: render-01-live-service.png - Render Dashboard Live Service] -->

#### Gemma
The core reasoning intelligence in OpenMate is powered by **Google Gemma 3 27B** (`google/gemma-3-27b-it`).

Gemma is not a superficial add-on; it handles the two most cognitively demanding stages of the pipeline:
1. **Repository Comprehension**: Synthesizing directory structure, package manifests, and code conventions into clear architectural components and setup guides.
2. **Personalized Contribution Matching**: Evaluating whether a specific open GitHub issue matches a developer's skill level and time constraints, explaining *why* it fits, and outlining concrete investigation steps.

By relying on Gemma 3's 27B instruction-tuned weights and 131k token context window, OpenMate achieves nuanced developer guidance while remaining entirely within an open-weight model ecosystem.

#### Backboard
OpenMate leverages **Backboard** for two distinct architectural responsibilities:
1. **Model Orchestration**: Providing low-latency, reliable access to Google Gemma 3 27B for structured JSON extraction with strict parameter control.
2. **Thread-Scoped Vector RAG**: Powering the Ask OpenMate assistant. Backboard handles repository context document indexing, semantic chunking, and vector retrieval.

Crucially, OpenMate configures Backboard with **persistent memory disabled** (`memory = false`). This architectural choice ensures that ephemeral chat sessions cannot retain or cross-contaminate developer queries across tabs or users.

#### Sentry Agent Tracing
OpenMate implements end-to-end production observability using **Sentry Agent Tracing** and the OpenTelemetry `gen_ai.*` semantic conventions.

Because Backboard does not have an automatic out-of-the-box Sentry plugin, we manually instrumented the real pipeline into a comprehensive trace hierarchy:

```text
openmate.analysis (Root trace: 48.55s)
├── github.ingest (~1.82s)
├── openmate.context.build (~0.08s)
├── gen_ai.chat [Gemma repository analysis] (~23.40s)
├── openmate.recommendation.candidates (~0.02s)
└── gen_ai.chat [Gemma recommendations] (~22.85s)

openmate.chat.init (Chat initialization: 8.35s)
├── github.ingest
├── openmate.context.build
├── openmate.rag.upload (~0.30s)
└── openmate.rag.index (~7.10s)

gen_ai.chat [Ask OpenMate turns] (3.30s – 5.86s)
└── Grouped by conv_<sha256(threadId)>
```

<!-- [SCREENSHOT: sentry-01-analysis-waterfall.png - Sentry Analysis Trace Waterfall] -->

**What Sentry Agent Tracing Revealed in Production**:
Measuring our live pipeline on Render yielded a critical performance insight:
- Deterministic ingestion, context construction, and candidate filtering account for **under 4% of total pipeline latency** (~1.92s total).
- The two sequential Gemma 27B reasoning calls account for **roughly 96% of total latency** (~46.25s).
- RAG document upload and indexing during chat initialization requires **8.35s** (~7.1s in indexing status polling).
- Once indexed, follow-up conversational turns return in **3.30s to 5.86s** - an **8x–14x speedup** over re-analyzing the repository.

**Privacy-First Observability**:
Span attributes record counts and status codes only (`openmate.context.character_count`, `github.issue_count`, `openmate.recommendation.candidate_count`). Sentry `beforeSend` and `beforeSendSpan` scrub all authorization headers, cookies, repository source blobs, issue bodies, prompts, model completions, and raw Backboard thread IDs. Conversation turns are safely grouped using a one-way hash (`conv_<sha256(threadId)>`).

---

## Why Does Open Innovation Matter?

Open innovation is the cornerstone of OpenMate.

In closed-API architectures, the entire developer workflow is beholden to a proprietary model provider. When a closed vendor changes pricing, deprecates an endpoint, modifies safety filters, or alters model behavior, downstream applications break or are forced to accept vendor lock-in.

By building on **Google Gemma 3 27B open weights**, OpenMate demonstrates why open innovation matters:

1. **Auditable & Predictable AI**: Gemma's open weights allow developers to inspect, audit, and understand model capabilities. Its reasoning behaviors can be reproduced and evaluated transparently.
2. **Provider Independence**: OpenMate's business logic is completely decoupled from provider SDKs. Because Gemma is open-weight, the same underlying reasoning engine can be hosted via Backboard, run on private cloud instances, or served locally with Ollama/vLLM without altering OpenMate's domain contracts.
3. **Owning the Grounding & Security Boundary**: Closed AI wrappers often outsource grounding to proprietary black boxes. OpenMate explicitly owns its context construction, SSRF defense, prompt boundaries, deterministic issue ranking, and path verification. Open-weight AI fits naturally into this architecture because the developer retains full ownership over the security perimeter.
4. **Accessible to the Open-Source Community**: A tool designed to onboard contributors to open source should not require expensive proprietary AI subscriptions. Open-weight models ensure that developer tools remain accessible to the very community they serve.

---

## My Agent Session

<!-- [DEVRELAY SESSION OPTIONAL - ADD IF AVAILABLE] -->
*Note: OpenMate's implementation was orchestrated following a structured multi-phase agent workflow. Contributor documentation and full git trajectory are preserved in the repository history.*

---

## Prize Categories

OpenMate is entered into the following Hacktoberfest Weekend Challenge partner categories:

1. **Best Use of Render**: Production Next.js 16 Node web service deployed on Render (`openmate-zq7d.onrender.com`) running server-side GitHub ingestion, Gemma orchestration, HMAC token signing, and health checks.
2. **Best Use of Gemma**: Google Gemma 3 27B (`google/gemma-3-27b-it`) serves as the core reasoning engine for comprehensive repository architecture analysis and personalized contribution issue matching.
3. **Best Use of Backboard**: Backboard orchestrates low-latency Gemma inference and manages thread-scoped vector RAG for Ask OpenMate, with persistent memory intentionally disabled for privacy.
4. **Best Use of Sentry Agent Tracing**: Custom OpenTelemetry `gen_ai.*` instrumentation tracking complete analysis waterfalls, Gemma inference spans, RAG indexing latency, and one-way hashed conversation grouping, yielding actionable latency insights.
