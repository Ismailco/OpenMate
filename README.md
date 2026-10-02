# OpenMate

> Deterministic open-source contributor onboarding powered by Google Gemma and Backboard.

OpenMate helps developers find and make their first meaningful open-source contributions. It combines developer profiles, deterministic repository context extraction, and Google Gemma open-weight AI reasoning to recommend well-matched issues and actionable onboarding guides.

## Features & Core Architecture

```text
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
ContributionRecommendations Result
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

### 5. Personalized Contribution Recommendations (Phase 6)
- **Deterministic Candidate Selection**: Evaluates all open issues before any AI call using label heuristics (`good first issue`, `help wanted`), interest mappings, skill overlap, and experience level adjustments. Shortlists at most 8 candidates.
- **Zero Hallucinated Issues or Identities**: Issue numbers must originate from the candidate set; canonical issue titles and URLs are strictly restored from GitHub data.
- **Profile & Path Grounding**: Relevant skills and matched interests are strictly filtered to subsets of the user's declared profile. File paths are verified against repository context.
- **Actionable Guidance**: Every recommendation provides concrete starting investigation steps, concepts to understand, and cautions—without generating fake code solutions or precise fake hour estimates.
- **Zero Proprietary Fallback**: Runs strictly on open-weight Gemma with no silent fallback to proprietary models.

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/Ismailco/OpenMate.git
cd OpenMate

# Install dependencies
pnpm install

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
```

### Development & Model Catalog

```bash
pnpm dev                 # Run local Next.js dev server
pnpm backboard:models    # Query available Gemma models
```

### Validation Scripts

```bash
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type check
pnpm test       # Run Vitest test suite
pnpm build      # Run Next.js production build
```
