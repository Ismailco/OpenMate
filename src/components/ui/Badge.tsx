import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'accent' | 'outline' | 'muted' | 'danger' | 'warning';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]',
  accent:
    'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/30 font-medium',
  outline:
    'bg-transparent text-[var(--foreground)] border border-[var(--border)]',
  muted:
    'bg-[var(--surface-muted)] text-[var(--muted)] border border-transparent',
  danger:
    'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30',
  warning:
    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-1.5 py-0.5 rounded-sm',
  md: 'text-xs px-2 py-0.5 rounded-md',
};

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono tracking-tight font-normal leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
