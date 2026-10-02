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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {CONTRIBUTION_EXPERIENCES.map((exp) => {
          const isSelected = value === exp.value;
          const inputId = `exp-${exp.value}`;

          return (
            <label
              key={exp.value}
              htmlFor={inputId}
              className={`flex flex-col justify-between p-3.5 rounded-md border text-left cursor-pointer transition-colors select-none ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]/40 text-[var(--muted)]'
              }`}
            >
              <div className="flex items-start gap-2.5 mb-2">
                <input
                  type="radio"
                  id={inputId}
                  name="contributionExperience"
                  value={exp.value}
                  checked={isSelected}
                  onChange={() => onChange(exp.value)}
                  className="mt-0.5 h-4 w-4 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                  aria-describedby={error ? 'experience-error' : 'experience-description'}
                />
                <span className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                  {exp.label}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed pl-6.5">
                {exp.description}
              </p>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
