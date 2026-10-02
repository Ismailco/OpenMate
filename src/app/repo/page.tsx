import React from 'react';
import type { Metadata } from 'next';
import { RepositoryResultsClient } from '@/components/repository';

export const metadata: Metadata = {
  title: 'Repository Contribution Analysis — OpenMate',
  description:
    'Grounded open-source contribution recommendations and architectural onboarding guide powered by Google Gemma.',
};

export default function RepoResultsPage() {
  return <RepositoryResultsClient />;
}
