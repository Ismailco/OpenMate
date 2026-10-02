'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  loadAnalysisSession,
  clearAnalysisSession,
  AnalysisSession,
} from '@/features/analysis-session';
import { clearChatStorage } from '@/features/repository-assistant/storage/chat-storage';
import { RepoHeader } from './RepoHeader';
import { PrimaryRecommendation } from './PrimaryRecommendation';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { AnalysisMissingState } from './AnalysisMissingState';
import { RepositoryOverview } from './RepositoryOverview';
import { TechnologyList } from './TechnologyList';
import { ArchitectureOverview } from './ArchitectureOverview';
import { FilesToUnderstand } from './FilesToUnderstand';
import { LocalSetupGuide } from './LocalSetupGuide';
import { ContributionNotesView } from './ContributionNotesView';
import { GlossaryList } from './GlossaryList';
import { AskOpenMate } from './AskOpenMate';

type ClientSessionState =
  | { status: 'loading-session' }
  | { status: 'missing' }
  | { status: 'found'; session: AnalysisSession };

export function RepositoryResultsClient() {
  const router = useRouter();
  const [state, setState] = useState<ClientSessionState>({ status: 'loading-session' });

  useEffect(() => {
    const session = loadAnalysisSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(session ? { status: 'found', session } : { status: 'missing' });
  }, []);

  const handleReset = () => {
    clearChatStorage();
    clearAnalysisSession();
    router.push('/start');
  };

  if (state.status === 'loading-session') {
    return (
      <main className="flex-1 py-12">
        <Container size="lg">
          <div
            role="status"
            aria-live="polite"
            className="animate-pulse space-y-8 max-w-4xl mx-auto py-8"
          >
            <div className="h-8 bg-[var(--surface-muted)] rounded-md w-1/3" />
            <div className="h-4 bg-[var(--surface-muted)] rounded-md w-2/3" />
            <div className="h-64 bg-[var(--surface-muted)] rounded-lg w-full" />
            <div className="h-48 bg-[var(--surface-muted)] rounded-lg w-full" />
            <span className="sr-only">Loading repository analysis results...</span>
          </div>
        </Container>
      </main>
    );
  }

  if (state.status === 'missing') {
    return (
      <main className="flex-1 py-8 sm:py-12">
        <Container size="sm">
          <AnalysisMissingState />
        </Container>
      </main>
    );
  }

  const { repository, analysis, recommendations } = state.session.result;
  const profile = state.session.profile;

  const isRecommended =
    recommendations.status === 'recommended' && recommendations.recommendations.length > 0;
  const primaryRec = isRecommended ? recommendations.recommendations[0] : null;
  const additionalRecs = isRecommended ? recommendations.recommendations.slice(1) : [];

  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container size="lg">
        {/* Repository Header with Profile Summary */}
        <RepoHeader
          repository={repository}
          profile={profile}
          onReset={handleReset}
        />

        {/* 1. Primary Recommendation (Highest Visual Prominence) */}
        {primaryRec && (
          <div className="mb-12">
            <Section
              id="primary-recommendation"
              title="Your First Contribution"
              description="OpenMate selected this issue as the most suitable starting point matching your technical profile and availability."
              badge={<Badge variant="accent" size="sm">Recommended Issue</Badge>}
            >
              <PrimaryRecommendation recommendation={primaryRec} />
            </Section>
          </div>
        )}

        {/* 2. Additional Matches (if 2 or 3 exist) */}
        {additionalRecs.length > 0 && (
          <div className="mb-12">
            <Section
              id="other-recommendations"
              title="Other Good Matches"
              description="Additional open issues that fit aspects of your skills or focus areas."
              badge={<Badge variant="outline" size="sm">Alternative Matches</Badge>}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {additionalRecs.map((rec) => (
                  <RecommendationCard key={rec.issueNumber} recommendation={rec} />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* 3. Empty Recommendation States (no-open-issues or no-suitable-issues) */}
        {recommendations.status === 'no-open-issues' && (
          <div className="mb-12">
            <RecommendationEmptyState
              status="no-open-issues"
              repositoryUrl={repository.htmlUrl}
            />
          </div>
        )}

        {recommendations.status === 'no-suitable-issues' && (
          <div className="mb-12">
            <RecommendationEmptyState
              status="no-suitable-issues"
              explanation={recommendations.explanation}
            />
          </div>
        )}

        {/* 4. Ask OpenMate (Conversational Repository Assistant with Backboard RAG) */}
        <div className="mb-12">
          <AskOpenMate
            profile={profile}
            primaryIssueNumber={primaryRec?.issueNumber}
          />
        </div>

        {/* 5. Repository Overview */}
        <Section
          id="repository-overview"
          title="Repository Overview"
          description="High-level purpose and scope synthesized from repository manifests and documentation."
          badge={<Badge variant="outline" size="sm">Overview</Badge>}
        >
          <RepositoryOverview summary={analysis.repositorySummary} />
        </Section>

        {/* 6. Detected Technologies */}
        <Section
          id="technologies"
          title="Technologies &amp; Tooling"
          description="Core frameworks, languages, and tools identified in this repository."
          badge={<Badge variant="outline" size="sm">Stack</Badge>}
        >
          <TechnologyList technologies={analysis.technologies} />
        </Section>

        {/* 7. Architecture & Key Modules */}
        <Section
          id="architecture"
          title="Architecture &amp; Key Modules"
          description="High-level structure and components to understand before touching code."
          badge={<Badge variant="outline" size="sm">Architecture</Badge>}
        >
          <ArchitectureOverview architecture={analysis.architecture} />
        </Section>

        {/* 8. Files to Understand First */}
        <Section
          id="files-to-understand"
          title="Files to Understand First"
          description="The highest-leverage files in the repository to read before making changes."
          badge={<Badge variant="outline" size="sm">Source Tour</Badge>}
        >
          <FilesToUnderstand files={analysis.filesToUnderstand} />
        </Section>

        {/* 9. Local Setup Guide */}
        <Section
          id="local-setup"
          title="Local Setup &amp; Verification"
          description="Documented instructions to clone, install, test, and build the project locally."
          badge={<Badge variant="outline" size="sm">Environment</Badge>}
        >
          <LocalSetupGuide localSetup={analysis.localSetup} />
        </Section>

        {/* 10. Contribution Guidelines */}
        <Section
          id="contribution-guidelines"
          title="Contribution Guidelines &amp; Quality Notes"
          description="Contribution expectations and testing conventions observed for this project."
          badge={<Badge variant="outline" size="sm">Process</Badge>}
        >
          <ContributionNotesView notes={analysis.contributionNotes} />
        </Section>

        {/* 11. Glossary (conditional) */}
        {analysis.glossary.length > 0 && (
          <Section
            id="glossary"
            title="Domain Concepts &amp; Glossary"
            description="Domain terminology and conventions specific to this repository."
            badge={<Badge variant="outline" size="sm">Glossary</Badge>}
          >
            <GlossaryList glossary={analysis.glossary} />
          </Section>
        )}

        {/* Subtle Disclaimer Footnote */}
        <div className="pt-6 pb-2 text-center text-xs text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
          Recommendations are based on the repository information currently available through GitHub.
          Review the issue and contribution guide before starting work.
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-[var(--border-muted)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="font-mono text-xs"
          >
            &larr; Analyze Another Repository
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleReset}
          >
            Find My Next Contribution
          </Button>
        </div>
      </Container>
    </main>
  );
}
