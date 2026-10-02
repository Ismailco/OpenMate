'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RepositoryField } from './RepositoryField';
import { SkillsEditor } from './SkillsEditor';
import { InterestsField } from './InterestsField';
import { AvailabilityField } from './AvailabilityField';
import { ExperienceField } from './ExperienceField';
import { ProfileReadyView } from './ProfileReadyView';
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

const DEFAULT_INITIAL_INPUT: RawProfileInput = {
  repositoryUrl: 'https://github.com/colinhacks/zod',
  skills: [
    { name: 'TypeScript', level: 'intermediate' },
    { name: 'JavaScript', level: 'intermediate' },
  ],
  interests: ['frontend', 'testing'],
  availableHours: VALIDATION_LIMITS.DEFAULT_HOURS,
  contributionExperience: 'first-time',
};

type FormStatus = 'editing' | 'ready';

export function DeveloperProfileForm() {
  const [status, setStatus] = useState<FormStatus>('editing');
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);

  // Form input state
  const [repositoryUrl, setRepositoryUrl] = useState(DEFAULT_INITIAL_INPUT.repositoryUrl);
  const [skills, setSkills] = useState<DeveloperSkill[]>(DEFAULT_INITIAL_INPUT.skills);
  const [interests, setInterests] = useState<ContributionInterest[]>(
    DEFAULT_INITIAL_INPUT.interests as ContributionInterest[]
  );
  const [availableHours, setAvailableHours] = useState(DEFAULT_INITIAL_INPUT.availableHours);
  const [experience, setExperience] = useState<ContributionExperience>(
    DEFAULT_INITIAL_INPUT.contributionExperience as ContributionExperience
  );

  // Error state mapped by field
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const rawInput: RawProfileInput = {
      repositoryUrl,
      skills,
      interests,
      availableHours,
      contributionExperience: experience,
    };

    const parseResult = RawProfileInputSchema.safeParse(rawInput);

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const topField = issue.path[0] ? String(issue.path[0]) : 'form';
        if (!errors[topField]) {
          errors[topField] = issue.message;
        }
      }
      setFieldErrors(errors);

      // Attempt to focus the first invalid field
      if (errors['repositoryUrl']) {
        const repoInput = document.getElementById('repositoryUrl');
        repoInput?.focus();
      } else if (errors['skills']) {
        const skillInput = document.getElementById('new-skill-input');
        skillInput?.focus();
      } else if (errors['availableHours']) {
        const hoursInput = document.getElementById('availableHours');
        hoursInput?.focus();
      }
      return;
    }

    try {
      const normalized = normalizeProfile(rawInput);
      setProfile(normalized);
      setStatus('ready');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setFieldErrors({ form: 'An unexpected validation error occurred. Please review your inputs.' });
    }
  };

  const handleEdit = () => {
    setStatus('editing');
    setFieldErrors({});
  };

  if (status === 'ready' && profile) {
    return <ProfileReadyView profile={profile} onEdit={handleEdit} />;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-8">
      {fieldErrors['form'] && (
        <div role="alert" className="p-3 text-xs rounded-md bg-[var(--danger)]/10 border border-[var(--danger)] text-[var(--danger)]">
          {fieldErrors['form']}
        </div>
      )}

      {/* Section 1: Target Repository */}
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">01</span>
            <span>Target Repository</span>
          </CardTitle>
          <CardDescription>
            Specify the public GitHub repository you want to explore and contribute to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepositoryField
            value={repositoryUrl}
            error={fieldErrors['repositoryUrl']}
            onChange={(val) => {
              setRepositoryUrl(val);
              if (fieldErrors['repositoryUrl']) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated['repositoryUrl'];
                  return updated;
                });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Section 2: Developer Skills */}
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">02</span>
            <span>Your Technologies &amp; Languages</span>
          </CardTitle>
          <CardDescription>
            OpenMate uses your technical background to filter for issues where you can be immediately productive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkillsEditor
            skills={skills}
            error={fieldErrors['skills']}
            onChange={(newSkills) => {
              setSkills(newSkills);
              if (fieldErrors['skills']) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated['skills'];
                  return updated;
                });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Section 3: Focus Areas / Interests */}
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">03</span>
            <span>Contribution Focus</span>
          </CardTitle>
          <CardDescription>
            Select areas of contribution that interest you in this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterestsField
            selectedInterests={interests}
            error={fieldErrors['interests']}
            onChange={(newInterests) => {
              setInterests(newInterests);
              if (fieldErrors['interests']) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated['interests'];
                  return updated;
                });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Section 4: Experience & Time Budget */}
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">04</span>
            <span>Experience &amp; Capacity</span>
          </CardTitle>
          <CardDescription>
            Calibrate issue difficulty and scope expectations to your available time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ExperienceField
            value={experience}
            error={fieldErrors['contributionExperience']}
            onChange={(newExp) => {
              setExperience(newExp);
              if (fieldErrors['contributionExperience']) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated['contributionExperience'];
                  return updated;
                });
              }
            }}
          />

          <div className="pt-4 border-t border-[var(--border-muted)]">
            <AvailabilityField
              value={availableHours}
              error={fieldErrors['availableHours']}
              onChange={(hours) => {
                setAvailableHours(hours);
                if (fieldErrors['availableHours']) {
                  setFieldErrors((prev) => {
                    const updated = { ...prev };
                    delete updated['availableHours'];
                    return updated;
                  });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-muted)]">
        <Button href="/" variant="ghost" size="md">
          ← Back to Overview
        </Button>
        <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
          Save &amp; Generate Contribution Profile
        </Button>
      </div>
    </form>
  );
}
