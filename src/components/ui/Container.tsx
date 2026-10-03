import React from 'react';
import { cn } from '@/lib/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'main' | 'header' | 'footer';
  size?: 'sm' | 'form' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-3xl',
  form: 'max-w-4xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({
  as: Component = 'div',
  size = 'md',
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
