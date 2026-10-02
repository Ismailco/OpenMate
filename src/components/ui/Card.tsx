import React from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'interactive';
}

export function Card({
  className,
  children,
  variant = 'default',
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-[var(--surface)] border-[var(--border)]',
    muted: 'bg-[var(--surface-muted)] border-[var(--border-muted)]',
    interactive:
      'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--muted)]/50 transition-colors cursor-pointer',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-5 transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  as: Component = 'h3',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) {
  return (
    <Component
      className={cn('text-base font-semibold text-[var(--foreground)] tracking-tight', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[var(--muted)] leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-sm text-[var(--foreground)]', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-muted)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}
