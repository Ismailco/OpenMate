import React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-md transition-colors',
          'bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]',
          'border border-[var(--border)] focus:border-[var(--accent)]',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError && 'border-[var(--danger)] focus:border-[var(--danger)] focus-visible:outline-[var(--danger)]',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
