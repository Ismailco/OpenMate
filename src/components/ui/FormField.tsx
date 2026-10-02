import React from 'react';
import { cn } from '@/lib/cn';

export interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement<{
    id?: string;
    hasError?: boolean;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
  }>;
}

export function FormField({
  id,
  label,
  description,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const childWithProps = React.cloneElement(children, {
    id,
    hasError: Boolean(error),
    'aria-describedby': describedBy,
    'aria-invalid': Boolean(error),
    'aria-required': required,
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>}
        </span>
      </label>

      {description && (
        <p id={descriptionId} className="text-xs text-[var(--muted-foreground)]">
          {description}
        </p>
      )}

      {childWithProps}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--danger)] font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
