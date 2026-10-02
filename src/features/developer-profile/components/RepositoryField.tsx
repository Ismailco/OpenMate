'use client';

import React from 'react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

export interface RepositoryFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function RepositoryField({
  value,
  error,
  onChange,
}: RepositoryFieldProps) {
  return (
    <FormField
      id="repositoryUrl"
      label="GitHub Repository URL"
      description="Must be a public repository root on github.com (e.g. https://github.com/facebook/react)"
      error={error}
      required
    >
      <Input
        id="repositoryUrl"
        type="url"
        placeholder="https://github.com/owner/repository"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        hasError={Boolean(error)}
        autoComplete="off"
        spellCheck={false}
      />
    </FormField>
  );
}
