'use client';

import React from 'react';
import { ContributionInterest } from '../types';
import { CONTRIBUTION_INTERESTS } from '../constants';

export interface InterestsFieldProps {
  selectedInterests: ContributionInterest[];
  error?: string;
  onChange: (interests: ContributionInterest[]) => void;
}

export function InterestsField({
  selectedInterests,
  error,
  onChange,
}: InterestsFieldProps) {
  const handleToggle = (interest: ContributionInterest) => {
    if (selectedInterests.includes(interest)) {
      onChange(selectedInterests.filter((i) => i !== interest));
    } else {
      onChange([...selectedInterests, interest]);
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] flex items-center justify-between w-full">
        <span>
          Contribution Focus Areas
          <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>
        </span>
        <span className="text-xs font-normal text-[var(--muted-foreground)]">
          Select at least 1
        </span>
      </legend>
      <p id="interests-description" className="text-xs text-[var(--muted-foreground)]">
        Choose the areas of the codebase you find most interesting or want to learn.
      </p>

      {error && (
        <p id="interests-error" role="alert" className="text-xs text-[var(--danger)] font-medium">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {CONTRIBUTION_INTERESTS.map((interest) => {
          const isChecked = selectedInterests.includes(interest.value);
          const inputId = `interest-${interest.value}`;

          return (
            <label
              key={interest.value}
              htmlFor={inputId}
              className={`flex items-start gap-3 p-3 rounded-md border text-left cursor-pointer transition-colors select-none ${
                isChecked
                  ? 'border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]/40 text-[var(--muted)]'
              }`}
            >
              <input
                type="checkbox"
                id={inputId}
                name="interests"
                value={interest.value}
                checked={isChecked}
                onChange={() => handleToggle(interest.value)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                aria-describedby={error ? 'interests-error' : 'interests-description'}
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--foreground)] block">
                  {interest.label}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)] leading-tight block">
                  {interest.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
