import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingPage, { metadata } from '../page';

describe('Onboarding Page', () => {
  it('defines factual SEO metadata', () => {
    expect(metadata.title).toContain('OpenMate Onboarding');
    expect(metadata.description).toContain('Learn how OpenMate analyzes');
  });

  it('renders main hero heading and primary CTA to /start', () => {
    render(<OnboardingPage />);
    const heading = screen.getByRole('heading', { level: 1, name: /find a contribution you can actually start/i });
    expect(heading).toBeInTheDocument();

    const startCta = screen.getByRole('link', { name: /start analyzing a repository/i });
    expect(startCta).toBeInTheDocument();
    expect(startCta).toHaveAttribute('href', '/start');

    const previewCta = screen.getByRole('link', { name: /view an example/i });
    expect(previewCta).toBeInTheDocument();
    expect(previewCta).toHaveAttribute('href', '/#preview');
  });

  it('renders key section headings and boundaries', () => {
    render(<OnboardingPage />);
    expect(screen.getByRole('heading', { name: /^what openmate does$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what openmate does not do/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /step-by-step walkthrough/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ask openmate/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /security & privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /limitations & tips/i })).toBeInTheDocument();
  });
});
