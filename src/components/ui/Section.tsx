import React from 'react';
import { cn } from '@/lib/cn';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({
  id,
  title,
  description,
  badge,
  headerAction,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section id={id} className={cn('py-8 sm:py-12 scroll-mt-16', className)} {...props}>
      {(title || description || badge || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 pb-3 border-b border-[var(--border-muted)]">
          <div>
            {badge && <div className="mb-1.5">{badge}</div>}
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--foreground)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{description}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
