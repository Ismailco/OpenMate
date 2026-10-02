import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IssueCard } from '../IssueCard';
import { DemoRecommendedIssue } from '@/data/demo-repository';

const mockIssue: DemoRecommendedIssue = {
  number: 42,
  title: 'Add support for ISO timestamps',
  url: 'https://github.com/org/repo/issues/42',
  difficulty: 'beginner',
  estimatedScope: '2 hours',
  fitReason: 'Perfect for TypeScript beginners without deep architectural prerequisites.',
  relevantSkills: ['TypeScript', 'Testing'],
  likelyFiles: ['src/validator.ts'],
  conceptsToUnderstand: ['ISO 8601 formatting'],
  suggestedStartingPoint: 'Inspect src/validator.ts and add parser regex.',
};

describe('IssueCard component', () => {
  it('renders issue metadata correctly', () => {
    render(<IssueCard issue={mockIssue} />);

    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('Add support for ISO timestamps')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();
    expect(screen.getByText(mockIssue.fitReason)).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('src/validator.ts')).toBeInTheDocument();
  });

  it('renders secure external link to GitHub issue', () => {
    render(<IssueCard issue={mockIssue} />);

    const link = screen.getByRole('link', { name: /github issue/i });
    expect(link).toHaveAttribute('href', 'https://github.com/org/repo/issues/42');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
