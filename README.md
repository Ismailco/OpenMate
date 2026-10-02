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
