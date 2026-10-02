import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button component', () => {
  it('renders a native button when href is not specified', () => {
    render(<Button type="submit">Submit Form</Button>);
    const button = screen.getByRole('button', { name: /submit form/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders an anchor link when href is specified', () => {
    render(<Button href="/start">Find my first contribution</Button>);
    const link = screen.getByRole('link', { name: /find my first contribution/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/start');
  });

  it('sets disabled and aria-busy when isLoading is true', () => {
    render(<Button isLoading>Analyzing</Button>);
    const button = screen.getByRole('button', { name: /analyzing/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('disables button when disabled prop is provided', () => {
    render(<Button disabled>Inactive</Button>);
    const button = screen.getByRole('button', { name: /inactive/i });
    expect(button).toBeDisabled();
  });
});
