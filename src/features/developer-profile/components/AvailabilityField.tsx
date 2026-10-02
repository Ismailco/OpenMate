'use client';

import React from 'react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { VALIDATION_LIMITS } from '../constants';

export interface AvailabilityFieldProps {
  value: number;
  error?: string;
  onChange: (hours: number) => void;
}

const PRESET_HOURS = [1, 2, 3, 5, 8, 12];

export function AvailabilityField({
  value,
  error,
  onChange,
}: AvailabilityFieldProps) {
  return (
    <div className="space-y-3">
      <FormField
        id="availableHours"
        label="Available Time (Hours for This Contribution)"
        description="Estimate how much time you realistically want to spend on this pull request."
        error={error}
        required
      >
        <Input
          id="availableHours"
          type="number"
          min={VALIDATION_LIMITS.MIN_HOURS}
          max={VALIDATION_LIMITS.MAX_HOURS}
          value={isNaN(value) ? '' : value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            onChange(isNaN(parsed) ? 0 : parsed);
          }}
          hasError={Boolean(error)}
        />
      </FormField>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-[var(--muted-foreground)]">Quick Presets:</span>
        {PRESET_HOURS.map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => onChange(hours)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              value === hours
                ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {hours}h
          </button>
        ))}
      </div>
    </div>
  );
}
