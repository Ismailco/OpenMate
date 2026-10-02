# OpenMate

> Helping developers make their first contribution to unfamiliar open-source projects. Built for the Hacktoberfest DEV Launch Weekend challenge.

## Overview

OpenMate bridges the gap between *"I want to contribute to this repository"* and *"I understand exactly what I should work on first."*

By analyzing public GitHub repositories alongside a developer's specific skills, experience level, and available time, OpenMate delivers a personalized, structured onboarding guide that highlights:

- What the project does and its architecture
- Essential files and concepts to understand first
- Local setup instructions
- Carefully selected open issues matching the developer's background
- Concrete starting points and implementation guidance for their first PR

## Core Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript (strict configuration)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Validation**: Zod (runtime boundary and domain schema validation)
- **Testing**: Vitest & React Testing Library
- **AI / Reasoning**: Google Gemma open-weight models (`google/gemma-3-27b-it`) via [Backboard](https://backboard.io)
- **Deployment**: Render

## Repository Analysis Pipeline

OpenMate processes repositories through a multi-stage deterministic pipeline:

```text
GitHub REST Ingestion (Network & limits boundary)
  ↓ IngestedRepository
Repository Context Engine (Pure transformation, sanitization & character budgets)
  ↓ RepositoryContext & AI-safe serialization
AI Synthesis & Reasoning (Phase 5 - Gemma via Backboard)
  ↓ RepositoryAnalysis
Personalized Contribution Guide (Phase 6)
```

### Context Engine Guardrails & Budgets

The context engine (`src/features/repository-context`) transforms raw ingestion payloads into a bounded, model-ready representation with explicit safety guarantees:

- **Zero Network Operations**: Pure in-memory transformation with no external dependencies or API requests.
- **Untrusted Content Demarcation**: All repository text (README, code, manifests, issue bodies) is tagged with `trust: "untrusted-repository-content"` and XML-escaped to prevent prompt delimiter breakouts.
- **Explicit Character Budgets**:
  - Global serialized context ceiling: 60,000 characters
  - README: max 10,000 characters
  - CONTRIBUTING: max 6,000 characters
  - Manifests: max 6,000 characters cumulative (max 3,000 per manifest)
  - Tree structural summary: max 3,000 characters (max depth: 3, max entries: 80)
  - Representative source files: max 16,000 characters cumulative (max 4,000 per file)
  - Open issues: max 8,000 characters cumulative (max 15 issues, max 600 chars per body)
- **Deterministic Prioritization**: Root entrypoints and shallow source files are prioritized over deeply nested utilities; `good first issue` and `help wanted` issues are prioritized for contribution onboarding.

### AI Provider & Gemma Architecture (Phase 5)

Repository analysis (`src/features/repository-analysis`) uses Google's open-weight **Gemma 3 27B** (`google/gemma-3-27b-it`) accessed through the **Backboard SDK**:

- **Model Selection**: Official Google Gemma open-weight model with a 131,072-token context window, optimized for code reasoning and structured JSON output.
- **Strict Isolation & Prompt Security**:
  - The OpenMate system instructions and untrusted repository user data are strictly decoupled.
  - Repository text (comments, README, issues) can never execute instructions, alter schemas, or request secrets.
  - Zero proprietary fallback: if Gemma is unavailable, `AiModelUnavailableError` is returned to preserve open-weight integrity.
- **Single-Inference Discipline**: Consolidated repository context is evaluated in a single primary model call with an optional single controlled repair turn if output formatting fails.
- **Deterministic Path Grounding**: Hallucinated file paths in AI outputs are deterministically filtered against genuine repository tree and context paths.
- **Safe API Endpoint**: `POST /api/repositories/analyze` ingests, contexts, and analyzes public repositories without exposing server secrets or raw source blobs to clients.

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
pnpm build      # Test production build
```

## License

MIT
