import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeveloperProfileForm } from '../components/DeveloperProfileForm';
import * as analysisClient from '@/features/repository-analysis/client/analyze-repository';
import {
  loadAnalysisSession,
  clearAnalysisSession,
  OpenMateAnalysisResult,
} from '@/features/analysis-session';

const mockSuccessResult: OpenMateAnalysisResult = {
  repository: {
    id: 1234,
    owner: 'colinhacks',
    name: 'zod',
    fullName: 'colinhacks/zod',
    description: 'TypeScript schema validation',
    defaultBranch: 'master',
    primaryLanguage: 'TypeScript',
    topics: ['schema'],
    stars: 30000,
    forks: 1000,
    openIssuesCount: 20,
    isArchived: false,
    isFork: false,
    license: 'MIT',
    htmlUrl: 'https://github.com/colinhacks/zod',
  },
  analysis: {
    repositorySummary: {
      purpose: 'Schema validation library for TypeScript',
      audience: null,
      maturity: 'established',
    },
    technologies: [],
    architecture: {
      overview: 'Modular schema system with type inference',
      components: [],
      dataFlow: null,
    },
    filesToUnderstand: [],
    localSetup: {
      prerequisites: [],
      steps: [],
      caveats: [],
    },
    contributionNotes: {
      contributionProcess: null,
      testingExpectations: [],
      styleExpectations: [],
      importantWarnings: [],
    },
    glossary: [],
    analysisMetadata: {
      modelProvider: 'backboard',
      modelName: 'google/gemma-3-27b-it',
      analyzedAt: new Date().toISOString(),
    },
  },
  recommendations: {
    status: 'recommended',
    recommendations: [
      {
        issueNumber: 10,
        title: 'Add date validation',
        url: 'https://github.com/colinhacks/zod/issues/10',
        fit: {
          summary: 'Fits beginner profile nicely',
          relevantSkills: ['TypeScript'],
          matchedInterests: ['testing'],
          experienceFit: 'good',
        },
        scope: {
          level: 'small',
          reasoning: 'Scoped helper function',
        },
        likelyFiles: [],
        conceptsToUnderstand: [],
        startingPoint: {
          summary: 'Read tests in tests directory',
          steps: [],
        },
        cautions: [],
      },
    ],
    metadata: {
      candidateIssuesConsidered: 1,
      generatedAt: new Date().toISOString(),
      modelProvider: 'backboard',
      modelName: 'google/gemma-3-27b-it',
    },
  },
};

describe('Onboarding to Analysis Integration Flow', () => {
  beforeEach(() => {
    clearAnalysisSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes onboarding form, triggers analysis, saves session, and routes to /repo', async () => {
    vi.spyOn(analysisClient, 'analyzeRepository').mockResolvedValue(mockSuccessResult);

    render(<DeveloperProfileForm />);

    // Step 1: Submit profile form
    const submitBtn = screen.getByRole('button', {
      name: /save & generate contribution profile/i,
    });
    fireEvent.click(submitBtn);

    // Profile ready state
    const analyzeBtn = screen.getByRole('button', { name: /analyze repository/i });
    expect(analyzeBtn).toBeInTheDocument();

    // Step 2: Trigger analyze
    fireEvent.click(analyzeBtn);

    // Await analysis completion
    await waitFor(() => {
      const session = loadAnalysisSession();
      expect(session).not.toBeNull();
      expect(session?.result.repository.name).toBe('zod');
    });
  });

  it('displays loading state during analysis and supports user cancellation', async () => {
    let capturedSignal: AbortSignal | undefined;

    vi.spyOn(analysisClient, 'analyzeRepository').mockImplementation(
      (_profile, signal) => {
        capturedSignal = signal;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new analysisClient.AnalysisClientError('aborted', 'Request canceled.'));
          });
        });
      }
    );

    render(<DeveloperProfileForm />);

    fireEvent.click(
      screen.getByRole('button', { name: /save & generate contribution profile/i })
    );

    const analyzeBtn = screen.getByRole('button', { name: /analyze repository/i });
    fireEvent.click(analyzeBtn);

    // Loading state is rendered
    expect(screen.getByText(/analyzing colinhacks\/zod/i)).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: /cancel analysis/i });
    expect(cancelBtn).toBeInTheDocument();

    // User cancels
    fireEvent.click(cancelBtn);

    expect(capturedSignal?.aborted).toBe(true);

    // Reverts to ready state without an error alert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze repository/i })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('displays error alert on failure and provides retry action', async () => {
    let callCount = 0;
    vi.spyOn(analysisClient, 'analyzeRepository').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new analysisClient.AnalysisClientError(
          'rate-limited',
          'GitHub API rate limit reached. Please wait a moment.'
        );
      }
      return mockSuccessResult;
    });

    render(<DeveloperProfileForm />);

    fireEvent.click(
      screen.getByRole('button', { name: /save & generate contribution profile/i })
    );

    fireEvent.click(screen.getByRole('button', { name: /analyze repository/i }));

    // Error alert is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/github api rate limit reached/i)
      ).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(callCount).toBe(2);
      expect(loadAnalysisSession()).not.toBeNull();
    });
  });
});
