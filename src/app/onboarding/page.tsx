import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InlineAlert } from '@/components/ui/InlineAlert';
import {
  CONTRIBUTION_INTERESTS,
  CONTRIBUTION_EXPERIENCES,
  SKILL_LEVELS,
} from '@/features/developer-profile/constants';

export const metadata: Metadata = {
  title: 'OpenMate Onboarding - How to Find Your First Open-Source Contribution',
  description:
    'Learn how OpenMate analyzes a public GitHub repository, matches real issues to your skills, and helps you understand where to start contributing.',
};

export default function OnboardingPage() {
  return (
    <main className="flex-1 py-10 sm:py-16">
      <Container size="form" className="space-y-12">
        {/* Hero Section */}
        <header className="space-y-4 border-b border-[var(--border-muted)] pb-10">
          <Badge variant="accent" size="sm">
            OpenMate Onboarding
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--foreground)] text-balance">
            Find a contribution you can actually start.
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] max-w-3xl leading-relaxed text-balance">
            OpenMate analyzes a public GitHub repository, combines what it learns with your skills,
            interests, experience, and available time, and recommends a real issue with a practical starting point.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button href="/start" variant="primary" size="md">
              Start analyzing a repository &rarr;
            </Button>
            <Button href="/#preview" variant="outline" size="md">
              View an example
            </Button>
          </div>
        </header>

        {/* Table of Contents */}
        <nav
          aria-label="Table of contents"
          className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted)] flex flex-wrap items-center gap-x-4 gap-y-2 font-mono"
        >
          <span className="text-[var(--foreground)] font-semibold">On this page:</span>
          <a href="#what-openmate-does" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            What OpenMate Does
          </a>
          <a href="#what-it-does-not-do" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            What It Does Not Do
          </a>
          <a href="#getting-started" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            Step-by-Step Guide
          </a>
          <a href="#repository-analysis" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            Repository Analysis
          </a>
          <a href="#recommendations" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            Your Recommendation
          </a>
          <a href="#ask-openmate" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            Ask OpenMate
          </a>
          <a href="#security" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            Security & Privacy
          </a>
          <a href="#limitations" className="hover:text-[var(--foreground)] underline underline-offset-4 decoration-[var(--border)]">
            Limitations & Tips
          </a>
        </nav>

        {/* 1. What OpenMate Does */}
        <Section
          id="what-openmate-does"
          title="What OpenMate Does"
          description="A deterministic context pipeline combined with open-weight AI reasoning to ground your first contribution."
          badge={<Badge variant="outline" size="sm">Overview</Badge>}
        >
          <div className="space-y-6">
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              OpenMate bridges the gap between wanting to contribute to open source and actually submitting your first merged pull request. Here is the complete workflow:
            </p>

            <ol className="space-y-3 text-sm text-[var(--foreground)] list-decimal list-inside pl-1">
              <li>
                <strong className="text-[var(--foreground)]">Choose a public repository:</strong> You provide the GitHub URL of a repository you want to explore.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Describe your profile:</strong> You share your technologies, focus interests, experience level, and available hours.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Bounded context extraction:</strong> OpenMate inspects manifests, key entrypoints, documentation, and open issues within a strict character budget.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Architectural analysis:</strong> Google Gemma 3 27B analyzes the codebase structure, tech stack, and contribution conventions.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Deterministic issue ranking:</strong> OpenMate filters real open GitHub issues based on label signals, issue detail, and your profile match.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Actionable recommendation:</strong> You receive &quot;Your First Contribution&quot; with fit reasoning, verified entrypoint source files, and setup instructions.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Ask OpenMate:</strong> You ask follow-up questions about files, setup commands, or architecture through a repository-grounded assistant.
              </li>
            </ol>

            <InlineAlert variant="info" title="Real Issues Only">
              OpenMate does not invent fake or synthetic issues. Every recommendation is drawn directly from active, open issues fetched from the repository on GitHub.
            </InlineAlert>
          </div>
        </Section>

        {/* 2. What OpenMate Does NOT Do */}
        <Section
          id="what-it-does-not-do"
          title="What OpenMate Does Not Do"
          description="Setting clear, practical expectations about the scope of this tool."
          badge={<Badge variant="outline" size="sm">Boundaries</Badge>}
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              To keep your experience predictable and your environment secure, OpenMate has clear functional boundaries. OpenMate does not:
            </p>

            <ul className="space-y-2 text-sm text-[var(--muted)] list-disc list-inside">
              <li>
                <strong className="text-[var(--foreground)]">Find arbitrary repositories for you:</strong> You bring the repository URL you want to explore. OpenMate is not a marketplace or general repository discovery engine.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Write, edit, or submit code:</strong> OpenMate guides you on where to begin, but writing code and creating the pull request remains your creative work.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Create pull requests or modify GitHub repositories:</strong> OpenMate is strictly read-only and requires zero write permissions to GitHub.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Execute repository code or run shell commands:</strong> Untrusted repository code is never run, compiled, or evaluated on OpenMate servers.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Browse arbitrary third-party websites:</strong> Network requests are strictly bounded to the public GitHub API and vector search endpoints.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Guarantee issue availability:</strong> Open issues can be claimed, assigned, or resolved by other community members at any time.
              </li>
            </ul>
          </div>
        </Section>

        {/* 3. Step-by-Step Guide */}
        <Section
          id="getting-started"
          title="Step-by-Step Walkthrough"
          description="How to configure your onboarding inputs for the most relevant results."
          badge={<Badge variant="accent" size="sm">Guide</Badge>}
        >
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="space-y-3 border-l-2 border-[var(--accent)] pl-4">
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Step 1: Choose a Public GitHub Repository
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Provide a standard public GitHub repository URL in the format <code className="font-mono text-[var(--accent)]">https://github.com/owner/repo</code>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <Card variant="muted" className="p-4 space-y-2">
                  <span className="text-xs font-semibold text-[var(--accent)] block font-mono">Good Choices:</span>
                  <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                    <li>Projects you actively use or find interesting</li>
                    <li>Repositories with active maintenance and open issues</li>
                    <li>Codebases using technologies you know or want to practice</li>
                  </ul>
                </Card>
                <Card variant="muted" className="p-4 space-y-2">
                  <span className="text-xs font-semibold text-[var(--danger)] block font-mono">Avoid:</span>
                  <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                    <li>Private or internal repositories</li>
                    <li>Subpages like <code className="font-mono">/issues/123</code> or <code className="font-mono">/pulls</code></li>
                    <li>Non-GitHub URLs (GitLab, Bitbucket, self-hosted)</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 border-l-2 border-[var(--accent)] pl-4">
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Step 2: Describe Your Contributor Profile
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                OpenMate uses four profile dimensions to match you with suitable issues:
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">1. Skills & Technologies</h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Declare the languages, frameworks, or tools you are comfortable reading or writing. You can rate each skill:
                  </p>
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SKILL_LEVELS.map((lvl) => (
                      <li key={lvl.value} className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface)] text-xs">
                        <span className="font-semibold text-[var(--foreground)] block">{lvl.label}</span>
                        <span className="text-[var(--muted)] text-[11px]">{lvl.description}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5 italic">
                    Note: OpenMate does not independently verify your skills. Be honest about your current level to get well-matched issues.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">2. Contribution Focus Areas</h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Select the specific subsystems or categories of work that interest you:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {CONTRIBUTION_INTERESTS.map((interest) => (
                      <div key={interest.value} className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface)] text-xs">
                        <span className="font-semibold text-[var(--foreground)] block">{interest.label}</span>
                        <span className="text-[var(--muted)] text-[11px]">{interest.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">3. Available Time</h4>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Estimate how many hours you plan to spend on this contribution (1 to 40 hours). This helps OpenMate distinguish between quick starter fixes and more involved feature tasks. It is not an exact time prediction.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">4. Open-Source Experience</h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Choose your familiarity with open-source workflows. This informs how conservatively OpenMate filters issue difficulty and architectural scope:
                  </p>
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CONTRIBUTION_EXPERIENCES.map((exp) => (
                      <li key={exp.value} className="p-2.5 rounded border border-[var(--border)] bg-[var(--surface)] text-xs">
                        <span className="font-semibold text-[var(--foreground)] block">{exp.label}</span>
                        <span className="text-[var(--muted)] text-[11px]">{exp.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. Repository Analysis */}
        <Section
          id="repository-analysis"
          title="What Happens During Analysis"
          description="Understanding OpenMate's bounded ingestion pipeline."
          badge={<Badge variant="outline" size="sm">Pipeline</Badge>}
        >
          <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
            <p>
              When you click <strong className="text-[var(--foreground)]">&quot;Analyze Repository&quot;</strong>, OpenMate runs a multi-stage context extraction pipeline:
            </p>

            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-[var(--foreground)]">Metadata & Default Branch:</strong> Queries repository basics (stars, description, primary language, default branch) via GitHub REST API.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Project File Tree:</strong> Ingests the top-level directory structure, filtering out test fixtures, lockfiles, and generated build artifacts.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Key Documentation:</strong> Extracts the README, CONTRIBUTING guides, and license files to understand local setup and community conventions.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Dependency Manifests:</strong> Inspects files like <code className="font-mono text-xs">package.json</code>, <code className="font-mono text-xs">Cargo.toml</code>, or <code className="font-mono text-xs">go.mod</code> to determine libraries, scripts, and runtime requirements.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Open GitHub Issues:</strong> Fetches open issues, prioritizes those with labels like <code className="font-mono text-xs">good first issue</code>, <code className="font-mono text-xs">help wanted</code>, or <code className="font-mono text-xs">documentation</code>, and extracts their description text.
              </li>
            </ul>

            <InlineAlert variant="info" title="Bounded Context Enforcement">
              OpenMate does not upload entire repositories blindly. It deterministically compiles an essential context snapshot capped at approximately 60,000 characters, prioritizing documentation, dependencies, and issue bodies.
            </InlineAlert>
          </div>
        </Section>

        {/* 5. Recommendations */}
        <Section
          id="recommendations"
          title="Your First Contribution Dashboard"
          description="What to expect when the analysis completes."
          badge={<Badge variant="outline" size="sm">Results</Badge>}
        >
          <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
            <p>
              Once analysis finishes, you are navigated to <code className="font-mono text-xs text-[var(--accent)]">/repo</code>, where you receive a comprehensive onboarding plan:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Card variant="muted" className="p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Your Recommended Issue</h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  The primary recommended GitHub issue with a concise summary of why it fits your skills, estimated scope category (small, medium, large), and direct link to GitHub.
                </p>
              </Card>

              <Card variant="muted" className="p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">First Files to Read</h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Specific entrypoint source files deterministically verified against the real repository tree so you know exactly which file to open first.
                </p>
              </Card>

              <Card variant="muted" className="p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Local Setup & Prerequisites</h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Prerequisites, package managers, and verification commands extracted from repo manifests and documentation to get your local environment running.
                </p>
              </Card>

              <Card variant="muted" className="p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Architecture & Concepts</h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Subsystem overview, tech stack breakdown, and a glossary of repository-specific terms to orient you before writing code.
                </p>
              </Card>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] pt-2">
              Note: Issue titles, issue numbers, and URLs are validated directly against real GitHub issues. OpenMate personalizes the explanation and starting plan, but the issue itself is authentic.
            </p>
          </div>
        </Section>

        {/* 6. Ask OpenMate */}
        <Section
          id="ask-openmate"
          title="Ask OpenMate (Repository Assistant)"
          description="Context-grounded follow-up chat powered by Backboard RAG and Gemma 3 27B."
          badge={<Badge variant="accent" size="sm">Interactive Assistant</Badge>}
        >
          <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
            <p>
              On the results page, you can open <strong className="text-[var(--foreground)]">Ask OpenMate</strong> to ask repository-specific questions. Example questions contributors often ask:
            </p>

            <div className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] space-y-1.5">
              <p>&gt; &quot;Which files should I read before writing code for this issue?&quot;</p>
              <p>&gt; &quot;Where would I likely add a new test for this feature?&quot;</p>
              <p>&gt; &quot;How does the data flow between the API router and database layer?&quot;</p>
              <p>&gt; &quot;What commands should I run locally to verify my changes?&quot;</p>
              <p>&gt; &quot;Why did you choose this issue over others in the repo?&quot;</p>
            </div>

            <p>
              How Ask OpenMate works behind the scenes:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-[var(--muted)]">
              <li>The repository context snapshot is indexed into a temporary Backboard thread.</li>
              <li>Responses are strictly grounded in the ingested files, README, and issue details.</li>
              <li>Persistent cross-user memory is disabled to protect contributor privacy.</li>
              <li>OpenMate cannot execute terminal commands or make changes to GitHub.</li>
            </ul>
          </div>
        </Section>

        {/* 7. How Recommendations are Chosen */}
        <Section
          id="how-recommendations-work"
          title="How Recommendations are Chosen"
          description="Two-stage pipeline: deterministic pre-filtering followed by open-weight AI evaluation."
          badge={<Badge variant="outline" size="sm">Architecture</Badge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="muted" className="p-5 space-y-3">
              <span className="text-xs font-mono text-[var(--accent)] font-semibold block">Stage 1: Deterministic Filtering</span>
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Heuristic Issue Scoring</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Before any AI inference takes place, OpenMate evaluates all open issues in the repository against several deterministic criteria:
              </p>
              <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                <li>Beginner-friendly labels (good first issue, help wanted, up-for-grabs)</li>
                <li>Presence of clear description bodies and reproduction steps</li>
                <li>Skill keyword overlap with your declared technologies</li>
                <li>Alignment with your chosen contribution focus areas</li>
                <li>Scope fit against your declared available time and experience</li>
              </ul>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                This scores and narrows hundreds of issues down to a focused shortlist of at most 8 real candidate issues.
              </p>
            </Card>

            <Card variant="muted" className="p-5 space-y-3">
              <span className="text-xs font-mono text-[var(--accent)] font-semibold block">Stage 2: Gemma 3 27B Reasoning</span>
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Deep Architectural Matching</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Google Gemma 3 27B evaluates the shortlisted candidates against your complete profile and the extracted repository context:
              </p>
              <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                <li>Selects the single highest-fit primary recommendation</li>
                <li>Generates personalized explanation of why your background fits</li>
                <li>Identifies the exact starting entrypoint source files to open first</li>
                <li>Synthesizes concrete, bounded investigation steps</li>
              </ul>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                The AI response is validated through strict Zod schemas before being rendered.
              </p>
            </Card>
          </div>
        </Section>

        {/* 8. Security & Privacy */}
        <Section
          id="security"
          title="Security & Privacy"
          description="A defense-in-depth architecture designed for untrusted open-source data."
          badge={<Badge variant="outline" size="sm">Security</Badge>}
        >
          <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
            <p>
              OpenMate treats all repository URLs, source blobs, and issue bodies as untrusted input. Key architectural guardrails include:
            </p>

            <ul className="space-y-2 list-disc list-inside text-xs">
              <li>
                <strong className="text-[var(--foreground)]">Server-Side Credentials:</strong> All GitHub and Backboard API tokens stay server-side. Zero API keys are ever sent to client browsers.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">SSRF Defense:</strong> Repository URLs are restricted to valid GitHub repositories. Internal, private, loopback, and metadata IP addresses are strictly blocked.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">No Code Execution:</strong> Repository code is strictly treated as text for analysis. OpenMate never compiles, runs, or executes repository files.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Zod Output Validation:</strong> All AI completions are parsed and validated against strict schemas before rendering. Hallucinated file paths are checked against the repository tree.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Transient Chat Memory:</strong> Follow-up chat threads are scoped only to your active browser session. Persistent cross-user memory is turned off.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Client Storage Safety:</strong> Session data is saved only in your browser&apos;s <code className="font-mono text-[var(--accent)]">sessionStorage</code>, which is isolated to your tab and automatically expires after 24 hours.
              </li>
            </ul>

            <p className="text-xs text-[var(--muted-foreground)] pt-2">
              For complete technical specifications, see our open-source codebase on{' '}
              <a
                href="https://github.com/Ismailco/OpenMate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                GitHub (Ismailco/OpenMate)
              </a>.
            </p>
          </div>
        </Section>

        {/* 9. Limitations & Tips */}
        <Section
          id="limitations"
          title="Limitations & Tips for Better Results"
          description="Practical advice to get the most value out of OpenMate."
          badge={<Badge variant="outline" size="sm">Practical Guide</Badge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Current Limitations</h4>
              <ul className="text-xs text-[var(--muted)] space-y-2 list-disc list-inside">
                <li><strong className="text-[var(--foreground)]">Public GitHub only:</strong> GitLab, Bitbucket, and private repositories are not currently supported.</li>
                <li><strong className="text-[var(--foreground)]">Requires open issues:</strong> If a repository has zero open issues, OpenMate cannot recommend a contribution.</li>
                <li><strong className="text-[var(--foreground)]">Context bounds:</strong> In massive monorepos, the 60,000-character context prioritizes root and main packages; deeper subpackages may be summarized.</li>
                <li><strong className="text-[var(--foreground)]">Analysis latency:</strong> Multi-stage deterministic ingestion and Gemma 27B reasoning typically take 30 to 50 seconds to complete.</li>
                <li><strong className="text-[var(--foreground)]">Unclaimed issues:</strong> OpenMate cannot reserve issues or guarantee that someone else won&apos;t submit a PR before you.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Tips for Better Results</h4>
              <ul className="text-xs text-[var(--muted)] space-y-2 list-disc list-inside">
                <li><strong className="text-[var(--foreground)]">Pick projects you use:</strong> You will understand requirements much faster if you have used the tool before.</li>
                <li><strong className="text-[var(--foreground)]">Be honest about skills:</strong> Listing intermediate for skills you just started learning can lead to overly complex recommendations.</li>
                <li><strong className="text-[var(--foreground)]">Focus your interests:</strong> Picking 1 to 3 specific focus areas yields more targeted matches than selecting all 9.</li>
                <li><strong className="text-[var(--foreground)]">Read the GitHub issue thread:</strong> Check recent comments on GitHub to verify maintainers still welcome a fix before writing code.</li>
                <li><strong className="text-[var(--foreground)]">Follow CONTRIBUTING.md:</strong> Respect project conventions for commit messages, testing requirements, and PR templates.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <div className="pt-8 border-t border-[var(--border-muted)] text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Ready to find your starting point?
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
            Paste any public GitHub repository and tell OpenMate your skills to receive your personalized onboarding plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button href="/start" variant="primary" size="md" className="w-full sm:w-auto">
              Find my first contribution &rarr;
            </Button>
            <Link
              href="/"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors py-2 px-3"
            >
              Back to OpenMate
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
