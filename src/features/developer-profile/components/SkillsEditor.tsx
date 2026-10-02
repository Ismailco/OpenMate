'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DeveloperSkill, SkillLevel } from '../types';
import { SKILL_LEVELS, VALIDATION_LIMITS } from '../constants';

export interface SkillsEditorProps {
  skills: DeveloperSkill[];
  error?: string;
  onChange: (skills: DeveloperSkill[]) => void;
}

export function SkillsEditor({ skills, error, onChange }: SkillsEditorProps) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmed = newSkillName.trim();
    if (!trimmed) {
      setLocalError('Please enter a skill or technology name.');
      return;
    }

    if (trimmed.length > VALIDATION_LIMITS.MAX_SKILL_NAME_LENGTH) {
      setLocalError(
        `Skill name must be ${VALIDATION_LIMITS.MAX_SKILL_NAME_LENGTH} characters or fewer.`
      );
      return;
    }

    if (skills.length >= VALIDATION_LIMITS.MAX_SKILLS) {
      setLocalError(
        `You have reached the maximum of ${VALIDATION_LIMITS.MAX_SKILLS} skills.`
      );
      return;
    }

    const isDuplicate = skills.some(
      (s) => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setLocalError(`"${trimmed}" has already been added to your profile.`);
      return;
    }

    onChange([...skills, { name: trimmed, level: newSkillLevel }]);
    setNewSkillName('');
    setLocalError(null);
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    setLocalError(null);
    onChange(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const displayedError = localError || error;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="new-skill-input"
          className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] flex items-center justify-between mb-1.5"
        >
          <span>
            Technologies &amp; Languages
            <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>
          </span>
          <span className="text-xs font-normal text-[var(--muted-foreground)]">
            {skills.length}/{VALIDATION_LIMITS.MAX_SKILLS} added
          </span>
        </label>
        <p id="skills-description" className="text-xs text-[var(--muted-foreground)] mb-3">
          Add the programming languages, frameworks, or tools you are confident working with.
        </p>
      </div>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            id="new-skill-input"
            placeholder="e.g. TypeScript, React, Go, Rust, PostgreSQL"
            value={newSkillName}
            onChange={(e) => {
              setNewSkillName(e.target.value);
              if (localError) setLocalError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill(e);
              }
            }}
            aria-describedby={displayedError ? 'skills-error' : 'skills-description'}
            hasError={Boolean(displayedError)}
          />
        </div>

        <div className="sm:w-44">
          <label htmlFor="skill-level-select" className="sr-only">
            Skill proficiency level
          </label>
          <select
            id="skill-level-select"
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
            className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          >
            {SKILL_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          onClick={handleAddSkill}
          variant="secondary"
          size="md"
          className="shrink-0"
        >
          Add skill
        </Button>
      </div>

      {displayedError && (
        <p id="skills-error" role="alert" className="text-xs text-[var(--danger)] font-medium">
          {displayedError}
        </p>
      )}

      {/* Rendered Skill Chips / Rows */}
      {skills.length > 0 ? (
        <div className="pt-2">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-2">
            Configured Skills ({skills.length}):
          </span>
          <ul
            className="divide-y divide-[var(--border-muted)] border border-[var(--border)] rounded-md bg-[var(--surface)] overflow-hidden"
            aria-label="Configured skills list"
          >
            {skills.map((skill, idx) => (
              <li
                key={`${skill.name}-${idx}`}
                className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-[var(--surface-muted)]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-[var(--foreground)] text-sm">
                    {skill.name}
                  </span>
                  <Badge
                    variant={
                      skill.level === 'advanced'
                        ? 'accent'
                        : skill.level === 'intermediate'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                  >
                    {skill.level}
                  </Badge>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--danger)] focus-visible:text-[var(--danger)] p-1 rounded transition-colors"
                  aria-label={`Remove ${skill.name}`}
                >
                  <span aria-hidden="true">&times;</span> Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)] italic">
          No skills added yet. Please add at least one technology.
        </p>
      )}
    </div>
  );
}
