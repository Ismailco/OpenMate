import React from 'react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'warning' | 'danger' | 'success';

export interface InlineAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; title: string }> = {
  info: {
    container: 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--foreground)]',
    title: 'text-[var(--foreground)]',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/25 text-amber-200',
    title: 'text-amber-400',
  },
  danger: {
    container: 'bg-[var(--danger)]/10 border-[var(--danger)]/25 text-red-200',
    title: 'text-[var(--danger)]',
  },
  success: {
    container: 'bg-[var(--accent-subtle)] border-[var(--accent)]/30 text-[var(--foreground)]',
    title: 'text-[var(--accent)]',
  },
};

export function InlineAlert({
  variant = 'info',
  title,
  children,
  className,
}: InlineAlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="status"
      className={cn(
        'rounded-md border p-3.5 text-xs leading-relaxed flex flex-col gap-1',
        styles.container,
        className
      )}
    >
      {title && <span className={cn('font-semibold tracking-wide', styles.title)}>{title}</span>}
      <div>{children}</div>
    </div>
  );
}
