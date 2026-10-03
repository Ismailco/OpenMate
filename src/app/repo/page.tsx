import React from 'react';
import type { Metadata } from 'next';
import { RepositoryResultsClient } from '@/components/repository';

export const metadata: Metadata = {
  title: 'Repository Contribution Analysis - OpenMate',
  description:
    'Find a real open-source issue that fits your skills and learn exactly where to start.',
};

export default function RepoResultsPage() {
  return <RepositoryResultsClient />;
}
