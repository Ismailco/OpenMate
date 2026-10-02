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
- **AI / Reasoning**: Gemma open-weight models via Backboard
- **Deployment**: Render

## GitHub Ingestion & Limits

OpenMate integrates with GitHub's REST API (`2022-11-28`) for secure, deterministic ingestion of public repositories. Ingestion safeguards include:

- **SSRF Boundary**: All outbound requests strictly target `https://api.github.com`. Links found in READMEs, issues, or payloads are never followed.
- **Server-Only Execution**: The GitHub integration and `GITHUB_TOKEN` are protected by `server-only` and are never exposed to browser bundles.
- **Bounded Thresholds**:
  - Max tree entries: 3,000
  - Max README size: 256 KB
  - Max CONTRIBUTING size: 128 KB
  - Max individual source/manifest file size: 128 KB
  - Max representative source files: 8 files (max 384 KB cumulative)
  - Max open issues: 50 (pull requests are filtered out)
  - Request timeout: 10 seconds with `AbortController`
- **Rate Limits**: Unauthenticated requests are limited to 60 requests/hour by GitHub. Setting `GITHUB_TOKEN` in `.env.local` raises this limit to 5,000 requests/hour.

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

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Validation Scripts

```bash
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type check
pnpm test       # Run Vitest test suite
pnpm build      # Test production build
```

## License

MIT
