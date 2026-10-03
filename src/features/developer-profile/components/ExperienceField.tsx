'use client';

import React from 'react';
import { ContributionExperience } from '../types';
import { CONTRIBUTION_EXPERIENCES } from '../constants';

export interface ExperienceFieldProps {
  value: ContributionExperience;
  error?: string;
  onChange: (value: ContributionExperience) => void;
}

export function ExperienceField({
  value,
  error,
  onChange,
}: ExperienceFieldProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] flex items-center justify-between w-full">
        <span>
          Open-Source Experience Level
          <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>
        </span>
      </legend>
      <p id="experience-description" className="text-xs text-[var(--muted-foreground)]">
        Helps OpenMate gauge the appropriate architectural depth and issue scope.
      </p>

      {error && (
        <p id="experience-error" role="alert" className="text-xs text-[var(--danger)] font-medium">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 pt-1">
        {CONTRIBUTION_EXPERIENCES.map((exp) => {
          const isSelected = value === exp.value;
          const inputId = `exp-${exp.value}`;

          return (
            <label
              key={exp.value}
              htmlFor={inputId}
              className={`flex items-start gap-3.5 p-4 rounded-lg border text-left cursor-pointer transition-all select-none ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)] ring-1 ring-[var(--accent)]/30'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]/50 text-[var(--muted)]'
              }`}
            >
              <input
                type="radio"
                id={inputId}
                name="contributionExperience"
                value={exp.value}
                checked={isSelected}
                onChange={() => onChange(exp.value)}
                className="mt-0.5 h-4 w-4 shrink-0 border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] cursor-pointer"
                aria-describedby={error ? 'experience-error' : 'experience-description'}
              />
              <div className="space-y-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--foreground)] leading-snug block">
                  {exp.label}
                </span>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
