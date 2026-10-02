import React from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { DeveloperProfileForm } from '@/features/developer-profile';

export const metadata: Metadata = {
  title: 'Start Contribution Onboarding',
  description:
    'Provide your familiar technologies, open-source experience, and target GitHub repository to build your personalized contribution profile.',
};

export default function StartPage() {
  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container size="sm">
        <PageHeader
          title="Find your first contribution"
          description="Tell OpenMate which repository you want to explore and configure your skills to receive matched issues."
          badge={<Badge variant="accent" size="sm">Contribution Onboarding</Badge>}
        />

        <DeveloperProfileForm />
      </Container>
    </main>
  );
}
