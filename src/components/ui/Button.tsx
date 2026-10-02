import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
}

export type ButtonAsButton = BaseButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: undefined;
  };

export type ButtonAsLink = BaseButtonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold hover:opacity-90 active:scale-[0.98] border border-transparent shadow-xs',
  secondary:
    'bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--surface)] border border-[var(--border)] active:scale-[0.98]',
  outline:
    'bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)] border border-[var(--border)] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] active:scale-[0.98]',
  danger:
    'bg-[var(--danger)] text-[var(--danger-foreground)] font-semibold hover:opacity-90 active:scale-[0.98] border border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-sm gap-1.5',
  md: 'text-sm px-4 py-2 rounded-md gap-2',
  lg: 'text-base px-6 py-2.5 rounded-md gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const commonClasses = cn(
    'inline-flex items-center justify-center font-medium transition-all select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if ('href' in props && props.href) {
    const { href, ...anchorProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={commonClasses} {...anchorProps}>
        {isLoading && (
          <span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </Link>
    );
  }

  const { type = 'button', disabled, ...buttonProps } = props as ButtonAsButton;
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={commonClasses}
      {...buttonProps}
    >
      {isLoading && (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
