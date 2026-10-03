import React from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { DeveloperProfileForm } from '@/features/developer-profile';

export const metadata: Metadata = {
  title: 'Start Contribution Onboarding',
  description:
    'Find a real open-source issue that fits your skills and learn exactly where to start.',
};

export default function StartPage() {
  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container size="sm">
        <PageHeader
          title="Find your first contribution"
          description="Paste a public GitHub repo, tell OpenMate what you know, and get matched issues with a clear path to start."
          badge={<Badge variant="accent" size="sm">Contribution Onboarding</Badge>}
        />

        <DeveloperProfileForm />
      </Container>
    </main>
  );
}
