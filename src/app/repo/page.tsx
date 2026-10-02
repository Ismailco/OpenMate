import React from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DEMO_REPOSITORY } from '@/data/demo-repository';
import {
  RepoHeader,
  StartHereCard,
  IssueCard,
  ArchitectureOverview,
  FilesToUnderstand,
  LocalSetupGuide,
  GlossaryList,
} from '@/components/repository';

export const metadata: Metadata = {
  title: `${DEMO_REPOSITORY.repository.fullName} — Contribution Guide`,
  description: `Personalized contribution guide for ${DEMO_REPOSITORY.repository.fullName}.`,
};

export default function RepoResultsPage() {
  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container size="lg">
        {/* Phase 1 Scaffold Notice */}
        <InlineAlert variant="info" className="mb-6" title="Static Demo Workspace">
          You are viewing a demonstration results shell populated from{' '}
          <code className="font-mono text-[var(--accent)]">src/data/demo-repository.ts</code>.
          Real dynamic repository ingestion and AI reasoning will run here in Phase 5–7.
        </InlineAlert>

        {/* Repository Header */}
        <RepoHeader
          repository={DEMO_REPOSITORY.repository}
          matchedProfile={DEMO_REPOSITORY.matchedProfile}
        />

        {/* Section: Start Here (Highest Visual Prominence) */}
        <div className="mb-10">
          <StartHereCard startHere={DEMO_REPOSITORY.startHere} />
        </div>

        {/* Section: Recommended Issues (Core Product Action) */}
        <Section
          id="recommended-issues"
          title="Recommended Issues for You"
          description="Issues filtered and ranked according to your skills, experience tier, and 3-hour budget."
          badge={<Badge variant="accent" size="sm">Primary Recommendations</Badge>}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DEMO_REPOSITORY.recommendedIssues.map((issue, idx) => (
              <IssueCard
                key={issue.number}
                issue={issue}
                isPrimary={idx === 0}
              />
            ))}
          </div>
        </Section>

        {/* Section: Repository Overview & Architecture */}
        <Section
          id="architecture"
          title="Architecture & Key Modules"
          description="High-level structure and critical components to understand before touching code."
          badge={<Badge variant="outline" size="sm">Architecture</Badge>}
        >
          <ArchitectureOverview architecture={DEMO_REPOSITORY.architecture} />
        </Section>

        {/* Section: Files to Understand First */}
        <Section
          id="files-to-understand"
          title="Files to Understand First"
          description="The highest-leverage files in the repository to read before making changes."
          badge={<Badge variant="outline" size="sm">Source Tour</Badge>}
        >
          <FilesToUnderstand files={DEMO_REPOSITORY.filesToUnderstand} />
        </Section>

        {/* Section: Local Setup Guide */}
        <Section
          id="local-setup"
          title="Local Setup & Verification"
          description="Commands to clone, install, test, and build the project locally."
          badge={<Badge variant="outline" size="sm">Environment</Badge>}
        >
          <LocalSetupGuide localSetup={DEMO_REPOSITORY.localSetup} />
        </Section>

        {/* Section: Core Concepts & Glossary */}
        <Section
          id="glossary"
          title="Key Concepts to Know"
          description="Domain terminology and conventions specific to this repository."
          badge={<Badge variant="outline" size="sm">Glossary</Badge>}
        >
          <GlossaryList glossary={DEMO_REPOSITORY.glossary} />
        </Section>

        {/* Section: Ask OpenMate (Assistant Placeholder for Phase 8) */}
        <Section
          id="assistant-placeholder"
          title="Ask OpenMate"
          description="Follow-up repository assistant with Backboard memory integration (arriving in Phase 8)."
          badge={<Badge variant="muted" size="sm">Coming in Phase 8</Badge>}
        >
          <Card variant="muted" className="p-6 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <span className="text-xs font-mono text-[var(--accent)] font-semibold uppercase tracking-wider block">
                Repository Q&amp;A Assistant
              </span>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                In Phase 8, you will be able to ask questions directly about specific files,
                clarify test requirements, and receive contextual explanations powered by Gemma and Backboard memory.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs font-mono px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
                &quot;Explain src/types.ts around ZodString&quot;
              </span>
              <span className="text-xs font-mono px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
                &quot;What test cases should I add for issue #2841?&quot;
              </span>
            </div>
          </Card>
        </Section>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-8 mt-12 border-t border-[var(--border-muted)]">
          <Button href="/start" variant="ghost" size="sm">
            ← Analyze Another Repository
          </Button>
          <Button href="/start" variant="primary" size="sm">
            Find my first contribution
          </Button>
        </div>
      </Container>
    </main>
  );
}
