# Contributing to OpenMate

Thank you for contributing to OpenMate! OpenMate is an open-source contributor onboarding tool designed to help developers find grounded first-time contributions in public GitHub repositories.

---

## 1. Quickstart & Local Setup

### Prerequisites

- **Node.js**: `22.x`
- **pnpm**: `11.x` (`pnpm@11.7.0` recommended)

### Clone & Install

```bash
git clone https://github.com/Ismailco/OpenMate.git
cd OpenMate
pnpm install
```

### Environment Configuration

OpenMate does not require live API credentials for unit, integration, or browser E2E test execution.

For live development against the real GitHub API or Backboard RAG, copy `.env.example`:

```bash
cp .env.example .env.local
```

And configure:
- `BACKBOARD_API_KEY`: Backboard AI platform key.
- `GITHUB_TOKEN`: GitHub personal access token (optional for public repos, recommended to avoid rate limits).
- `OPENMATE_CHAT_SIGNING_SECRET`: Random 32+ character string for HMAC signing.

---

## 2. Development & Verification Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Starts Next.js development server on `http://localhost:3000` |
| `pnpm lint` | Runs ESLint across all source and test files |
| `pnpm typecheck` | Validates TypeScript types across the codebase |
| `pnpm test` | Runs the Vitest offline unit and integration test suite |
| `pnpm build` | Compiles production Next.js application |
| `pnpm e2e` | Runs Playwright browser E2E tests against production server |
| `pnpm e2e:ui` | Opens the interactive Playwright Test Runner UI |
| `pnpm audit` | Scans dependencies for known security vulnerabilities |

---

## 3. Testing Requirements

All contributions must pass the complete offline validation gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

### Testing Principles

1. **Zero External Calls**: Unit tests and Playwright E2E tests make zero outbound network requests to paid or rate-limited external providers (`api.github.com`, `backboard.io`, `openrouter.ai`, Google).
2. **Deterministic Interception**: Browser E2E tests mock OpenMate's own internal `/api/repositories/*` routes while exercising real Next.js routing, hydration, and `sessionStorage`.
3. **Security Invariants**: E2E verifies Content Security Policy (CSP), HTTP security headers, and DOM XSS neutralization in Chromium.

---

## 4. Pull Requests & CI

- **Fork-Friendly CI**: The GitHub Actions CI runs on all pull requests targeting `main` without requiring any repository secrets.
- **Automated Gates**:
  - `Quality Gate`: ESLint, TypeScript check, Vitest unit & integration tests.
  - `Browser E2E Gate`: Production build & Playwright Chromium suite.
- **Commit Conventions**: We follow standard Conventional Commits:
  - `feat:` New user-facing capability or integration
  - `fix:` Bug fix or security patch
  - `test:` Unit, integration, or E2E test coverage
  - `docs:` Documentation improvements
  - `chore:` Tooling, configuration, or dependency updates

---

## 5. Security Invariants

When modifying security-sensitive areas, review [`docs/security.md`](./docs/security.md):

- **SSRF Defense**: Strict validation on GitHub URLs, prohibiting private IPs, loopback addresses, and non-canonical hosts.
- **Content Security Policy**: Production CSP enforces `object-src 'none'`, `frame-ancestors 'none'`, and restricted connect domains.
- **Chat Token Signing**: HMAC-SHA256 signature verification on repository assistant conversation tokens.
- **DOM Neutralization**: Raw repository content, issues, and assistant outputs are rendered via React text bindings to prevent XSS.
