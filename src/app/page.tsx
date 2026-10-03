import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DEMO_REPOSITORY } from '@/data/demo-repository';
import { StartHereCard } from '@/components/repository/StartHereCard';
import { IssueCard } from '@/components/repository/IssueCard';

export default function HomePage() {
  const primaryIssue = DEMO_REPOSITORY.recommendedIssues[0];

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 border-b border-[var(--border)] bg-radial from-[var(--surface-muted)]/50 to-transparent">
        <Container size="md" className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-mono text-[var(--muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>Open-Source Onboarding Engine</span>
            <span className="text-[var(--border)]" aria-hidden="true">•</span>
            <span className="text-[var(--accent)]">Hacktoberfest Edition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--foreground)] text-balance">
            Your first contribution starts here.
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed text-balance">
            Paste a public GitHub repo, tell OpenMate your skills, and get a real issue that fits you, with a clear path to start contributing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button href="/start" size="lg" variant="primary" className="w-full sm:w-auto">
              Find my first contribution
            </Button>
            <Button href="/repo" size="lg" variant="outline" className="w-full sm:w-auto">
              Explore Demo Analysis
            </Button>
          </div>

          {/* Workflow Sequence */}
          <div className="pt-8 border-t border-[var(--border-muted)]/60 max-w-xl mx-auto">
            <nav aria-label="Workflow progression" className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
              <span className="text-[var(--foreground)]">1. Repository</span>
              <span className="text-[var(--border)]" aria-hidden="true">→</span>
              <span className="text-[var(--foreground)]">2. Understand</span>
              <span className="text-[var(--border)]" aria-hidden="true">→</span>
              <span className="text-[var(--foreground)]">3. Choose Issue</span>
              <span className="text-[var(--border)]" aria-hidden="true">→</span>
              <span className="text-[var(--accent)] font-semibold">4. Contribute</span>
            </nav>
          </div>
        </Container>
      </section>

      {/* Problem / Value Section */}
      <Container size="md">
        <Section
          title="The First-Contribution Friction"
          description="Contributing to open source should not require days of reading unstructured discussion threads."
          badge={<Badge variant="outline" size="sm">The Challenge</Badge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="muted" className="space-y-2">
              <span className="text-xs font-mono text-[var(--danger)] block">01 / Friction</span>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Intimidating Codebases
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Large repositories have hundreds of files and hidden patterns. Finding where runtime execution begins is overwhelming.
              </p>
            </Card>

            <Card variant="muted" className="space-y-2">
              <span className="text-xs font-mono text-[var(--danger)] block">02 / Friction</span>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Mismatched Issues
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Issues marked &quot;good first issue&quot; often turn out to require deep architectural shifts or outdated context.
              </p>
            </Card>

            <Card variant="muted" className="space-y-2">
              <span className="text-xs font-mono text-[var(--danger)] block">03 / Friction</span>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Uncertain Starting Point
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Even with the right issue, you are left wondering which file to open first and what prerequisite concepts matter.
              </p>
            </Card>
          </div>
        </Section>

        {/* How It Works Section */}
        <Section
          id="how-it-works"
          title="How OpenMate Works"
          description="Three simple steps from a repository URL to your first contribution."
          badge={<Badge variant="accent" size="sm">Workflow</Badge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 border-l-2 border-[var(--border)] pl-4 hover:border-[var(--accent)] transition-colors">
              <span className="text-xs font-mono text-[var(--accent)] font-semibold">Step 01</span>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Paste a GitHub repository
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Provide any public GitHub repository URL. OpenMate inspects manifests, directory trees, docs, and open issues.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[var(--border)] pl-4 hover:border-[var(--accent)] transition-colors">
              <span className="text-xs font-mono text-[var(--accent)] font-semibold">Step 02</span>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Tell OpenMate what you know
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Specify your familiar languages, technologies, experience tier, and available time budget for this contribution.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[var(--border)] pl-4 hover:border-[var(--accent)] transition-colors">
              <span className="text-xs font-mono text-[var(--accent)] font-semibold">Step 03</span>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Get your contribution path
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Receive prioritized issues with explicit fit explanations, target files, local setup sequences, and starting steps.
              </p>
            </div>
          </div>
        </Section>

        {/* Product Preview Section */}
        <Section
          id="preview"
          title="Product Preview"
          description="Explore what a repository analysis and issue recommendation look like before analyzing your own."
          badge={<Badge variant="outline" size="sm">Static Demonstration</Badge>}
          headerAction={
            <Button href="/repo" variant="outline" size="sm">
              Open Full Preview ↗
            </Button>
          }
        >
          <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
            <InlineAlert variant="info" title="Demonstration Preview">
              This preview uses static sample data for <code className="font-mono text-[var(--accent)]">colinhacks/zod</code> to demonstrate OpenMate&apos;s UI hierarchy and recommendation cards.
            </InlineAlert>

            {/* Quick Header in preview */}
            <div className="border-b border-[var(--border-muted)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-[var(--muted)]">Previewing: colinhacks/zod</span>
                <h3 className="text-xl font-bold font-mono text-[var(--foreground)]">
                  Zod - TypeScript-first schema validation
                </h3>
              </div>
              <Badge variant="accent" size="sm">TypeScript</Badge>
            </div>

            {/* Start Here Card in preview */}
            <StartHereCard startHere={DEMO_REPOSITORY.startHere} />

            {/* Sample Recommended Issue */}
            {primaryIssue && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Featured Issue Recommendation
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono">1 of {DEMO_REPOSITORY.recommendedIssues.length} matches</span>
                </div>
                <IssueCard issue={primaryIssue} isPrimary />
              </div>
            )}

            <div className="text-center pt-4">
              <Button href="/start" size="md" variant="primary">
                Find my first contribution
              </Button>
            </div>
          </div>
        </Section>
      </Container>
    </main>
  );
}
