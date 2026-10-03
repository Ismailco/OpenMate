'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RepositoryField } from './RepositoryField';
import { SkillsEditor } from './SkillsEditor';
import { InterestsField } from './InterestsField';
import { AvailabilityField } from './AvailabilityField';
import { ExperienceField } from './ExperienceField';
import { ProfileReadyView, AnalysisErrorViewModel } from './ProfileReadyView';
import {
  DeveloperProfile,
  DeveloperSkill,
  ContributionInterest,
  ContributionExperience,
  RawProfileInput,
} from '../types';
import { VALIDATION_LIMITS } from '../constants';
import { RawProfileInputSchema } from '../schemas';
import { normalizeProfile } from '../normalize-profile';
import { analyzeRepository, AnalysisClientError } from '@/features/repository-analysis/client';
import { saveAnalysisSession, AnalysisSession } from '@/features/analysis-session';

export function DeveloperProfileForm() {
  const router = useRouter();

  // Form State
  const [repositoryUrl, setRepositoryUrl] = useState('https://github.com/colinhacks/zod');
  const [skills, setSkills] = useState<DeveloperSkill[]>([
    { name: 'TypeScript', level: 'intermediate' },
    { name: 'JavaScript', level: 'intermediate' },
  ]);
  const [interests, setInterests] = useState<ContributionInterest[]>([
    'frontend',
    'testing',
  ]);
  const [availableHours, setAvailableHours] = useState<number>(3);
  const [experience, setExperience] = useState<ContributionExperience>('first-time');

  // UI Flow State Machine
  const [flowStatus, setFlowStatus] = useState<'editing' | 'ready' | 'analyzing' | 'error'>('editing');
  const [normalizedProfile, setNormalizedProfile] = useState<DeveloperProfile | null>(null);
  const [analysisError, setAnalysisError] = useState<AnalysisErrorViewModel | null>(null);

  // Errors & Touched
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-flight request controller reference
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSkillsChange = useCallback((newSkills: DeveloperSkill[]) => {
    setSkills(newSkills);
    if (newSkills.length >= VALIDATION_LIMITS.MIN_SKILLS) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.skills;
        return next;
      });
    }
  }, []);

  const handleInterestsChange = useCallback((newInterests: ContributionInterest[]) => {
    setInterests(newInterests);
    if (newInterests.length >= VALIDATION_LIMITS.MIN_INTERESTS) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.interests;
        return next;
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const rawInput: RawProfileInput = {
      repositoryUrl,
      skills,
      interests,
      availableHours,
      contributionExperience: experience,
    };

    const result = RawProfileInputSchema.safeParse(rawInput);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setFormErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const profile = normalizeProfile(result.data);
      setNormalizedProfile(profile);
      setFlowStatus('ready');
      setAnalysisError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to normalize profile';
      setFormErrors({ form: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProfile = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setFlowStatus('editing');
    setAnalysisError(null);
  };

  const handleChooseAnotherRepo = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setRepositoryUrl('');
    setNormalizedProfile(null);
    setFlowStatus('editing');
    setAnalysisError(null);
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setFlowStatus('ready');
    setAnalysisError(null);
  };

  const handleAnalyze = async () => {
    if (!normalizedProfile) return;
    if (flowStatus === 'analyzing') return; // Prevent duplicate concurrent requests

    // Create fresh AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setFlowStatus('analyzing');
    setAnalysisError(null);

    try {
      const analysisResult = await analyzeRepository(normalizedProfile, controller.signal);

      // Package session envelope
      const sessionEnvelope: AnalysisSession = {
        version: 1,
        createdAt: new Date().toISOString(),
        profile: normalizedProfile,
        result: analysisResult,
      };

      saveAnalysisSession(sessionEnvelope);
      router.push('/repo');
    } catch (err) {
      // If request was canceled by user, revert silently to ready state
      if (err instanceof AnalysisClientError && err.code === 'aborted') {
        setFlowStatus('ready');
        return;
      }

      setFlowStatus('error');
      if (err instanceof AnalysisClientError) {
        setAnalysisError({
          code: err.code,
          message: err.userMessage,
        });
      } else {
        setAnalysisError({
          code: 'unknown',
          message: err instanceof Error ? err.message : 'An unexpected error occurred during repository analysis.',
        });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="w-full">
      {flowStatus !== 'editing' && normalizedProfile ? (
        <ProfileReadyView
          profile={normalizedProfile}
          status={flowStatus}
          error={analysisError}
          onEdit={handleEditProfile}
          onAnalyze={handleAnalyze}
          onCancel={handleCancelAnalysis}
          onRetry={handleAnalyze}
          onChangeRepository={handleChooseAnotherRepo}
        />
      ) : (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Developer Contribution Profile</CardTitle>
            <CardDescription>
              OpenMate matches open issues to your skills and available time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {formErrors.form && (
                <div
                  role="alert"
                  className="p-3 text-sm text-[var(--danger)] bg-[var(--danger-subtle)] border border-[var(--danger)] rounded-md font-mono"
                >
                  {formErrors.form}
                </div>
              )}

              {/* Repository Field */}
              <RepositoryField
                value={repositoryUrl}
                onChange={(url) => {
                  setRepositoryUrl(url);
                  if (formErrors.repositoryUrl) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.repositoryUrl;
                      return next;
                    });
                  }
                }}
                error={formErrors.repositoryUrl}
              />

              {/* Skills Field */}
              <SkillsEditor
                skills={skills}
                onChange={handleSkillsChange}
                error={formErrors.skills}
              />

              {/* Interests Field */}
              <InterestsField
                selectedInterests={interests}
                onChange={handleInterestsChange}
                error={formErrors.interests}
              />

              {/* Experience and Availability Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <ExperienceField
                  value={experience}
                  onChange={setExperience}
                  error={formErrors.contributionExperience}
                />
                <AvailabilityField
                  value={availableHours}
                  onChange={setAvailableHours}
                  error={formErrors.availableHours}
                />
              </div>

              {/* Form Action */}
              <div className="pt-6 border-t border-[var(--border-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[var(--muted)]">
                  Profiles are analyzed locally and securely against repository context.
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? 'Validating...' : 'Save & Generate Contribution Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
