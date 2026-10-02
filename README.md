# OpenMate

> Deterministic open-source contributor onboarding powered by Google Gemma and Backboard.

OpenMate helps developers find and make their first meaningful open-source contributions. It combines developer profiles, deterministic repository context extraction, and Google Gemma open-weight AI reasoning to recommend well-matched issues and actionable onboarding guides.

## Features & Core Architecture

```text
Landing Page (/)
       ↓
Developer Profile Form (/start)
       ↓
POST /api/repositories/analyze
       ↓
GitHub Ingestion (once)
       ↓
Deterministic Repository Context Engine (once)
       ↓
Gemma Repository Architecture Analysis (once)
       ↓
Deterministic Candidate Shortlisting (max 8 candidates)
       ↓
Gemma Personalized Recommendations (max 3 recommendations)
       ↓
Zod Validation & Grounding Enforcement (profile, issue identity, paths)
       ↓
Client Session Storage (openmate.analysis.v1)
       ↓
Personalized Contributor Dashboard (/repo)
       ↓
Ask OpenMate Conversational Assistant (Backboard RAG)
```

### 1. Developer Profile Domain
- Captures developer skills, skill levels, contribution interests, available hours, and prior open-source experience.
- Strict client- and server-side validation via Zod with canonical repository normalization.

### 2. GitHub Integration & Security Boundaries
- Fast, secure repository ingestion with strict SSRF controls, path traversal prevention, and rate-limit handling.
- Selects and extracts crucial repository entrypoints, manifests, documentation, and open issues.

### 3. Repository Context Engine
- Compiles bounded, deterministic repository summaries adhering to token budgets and security boundaries.
- Separates untrusted repository data with explicit security markers.

### 4. Gemma Repository Analysis
- **Model Selection**: Official Google Gemma 3 27B open-weight model (`google/gemma-3-27b-it`) via OpenRouter/Backboard with a 131,072-token context window.
- **Strict Isolation & Prompt Security**: Separates system instructions from untrusted repository content. Neutralizes prompt injections.
- **Deterministic Path Grounding**: Hallucinated file paths are deterministically filtered against genuine repository context paths.

### 5. Personalized Contribution Recommendations
- **Deterministic Candidate Selection**: Evaluates all open issues before any AI call using label heuristics (`good first issue`, `help wanted`), interest mappings, skill overlap, and experience level adjustments. Shortlists at most 8 candidates.
- **Zero Hallucinated Issues or Identities**: Issue numbers must originate from the candidate set; canonical issue titles and URLs are strictly restored from GitHub data.
- **Profile & Path Grounding**: Relevant skills and matched interests are strictly filtered to subsets of the user's declared profile. File paths are verified against repository context.
- **Actionable Guidance**: Every recommendation provides concrete starting investigation steps, concepts to understand, and cautions—without generating fake code solutions or precise fake hour estimates.
- **Zero Proprietary Fallback**: Runs strictly on open-weight Gemma with no silent fallback to proprietary models.

### 6. End-to-End Contributor Experience
- **Single-Pass Ingestion & Reasoning**: Submits user profile to `POST /api/repositories/analyze`, fetching GitHub data and executing Gemma reasoning in a single unified pipeline.
- **Session Lifecycle & Security**: Uses versioned browser session storage (`openmate.analysis.v1`) scoped to the active tab. Sensitive credentials and raw repository dump contexts are never stored client-side. Corrupted or expired (24h) sessions are gracefully purged.
- **Interactive State Transitions**: Smooth UI state machine (`editing` → `ready` → `analyzing` → `error`). Includes indeterminate progress indicators, request cancellation via `AbortController`, and retry/profile edit recovery flows.
- **Production Contributor Dashboard (`/repo`)**:
  - **Your First Contribution**: Visually dominant primary recommendation card with fit summary, matched skills, scope indicators, entrypoint files, and starting steps.
  - **Other Good Matches**: Secondary recommendation cards with expandable details.
  - **Empty States**: Explicit guidance when no open issues or suitable candidates exist.
  - **Deep Repository Onboarding**: Repository overview, detected technology stack, architectural subsystems, first files to read, local setup command sequence, and glossary terms.

### 7. Ask OpenMate Conversational Assistant
- Grounded follow-up chat powered by Backboard RAG and Gemma 3 27B.
- Cryptographically signed HMAC-SHA256 conversation tokens bound to the repository context.
- Ephemeral RAG document lifetimes with automatic cleanup.

---

## Getting Started

### Prerequisites

- Node.js >= 22.x
- pnpm >= 11.x (`pnpm@11.7.0` pinned in `packageManager`)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ismailco/OpenMate.git
cd OpenMate

# Install dependencies strictly from lockfile
pnpm install --frozen-lockfile

# Configure environment variables
cp .env.example .env.local
```

### Environment Configuration

In `.env.local`:

```bash
# GitHub Access Token (optional for public repositories)
GITHUB_TOKEN=

# Backboard API Key for Gemma repository reasoning
BACKBOARD_API_KEY=

# Gemma model configuration (default: google/gemma-3-27b-it via openrouter)
BACKBOARD_MODEL_PROVIDER=openrouter
BACKBOARD_MODEL_NAME=google/gemma-3-27b-it
BACKBOARD_TIMEOUT_MS=60000

# Chat conversation token HMAC secret (min 32 characters)
OPENMATE_CHAT_SIGNING_SECRET=
```

### Development & Model Catalog

```bash
pnpm dev                 # Run local Next.js dev server
pnpm backboard:models    # Query available Gemma models
```

---

## Testing & Quality Gates

OpenMate maintains a complete multi-tier testing pipeline. **All automated tests run completely offline** with zero external network requests to GitHub, Backboard, OpenRouter, or Google. No live provider credentials or API keys are required for test execution.

```bash
# Run unit & integration test suite (Vitest)
pnpm test

# Run browser E2E test suite (Playwright against production Next.js build)
pnpm e2e

# Run Playwright with interactive UI
pnpm e2e:ui

# View latest Playwright HTML report
pnpm e2e:report

# Run complete quality validation gate
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```

### Test Architecture

- **Unit & Integration Suite (Vitest)**: Tests domain logic, schema validation, ingestion boundaries, candidate ranking heuristics, RAG context formatting, and HMAC token signing.
- **Browser E2E Suite (Playwright + Chromium)**: Launches a real production build (`pnpm build` + `next start`) with HTTP security headers and CSP enabled. Tests full onboarding navigation, sessionStorage handoff, results rendering, chat lifecycle, error recovery, mobile viewport (375×812), and XSS neutralization.
- **GitHub Actions CI (`.github/workflows/ci.yml`)**: Parallel quality gate (lint, typecheck, unit tests) and browser E2E gate on every push and pull request targeting `main`. Completely fork-friendly with least-privilege permissions and zero required repository secrets.
