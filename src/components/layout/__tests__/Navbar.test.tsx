import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '../Navbar';

describe('Navbar component', () => {
  it('renders branding and primary call-to-action to /start', () => {
    render(<Navbar />);

    const brand = screen.getByRole('link', { name: /openmate/i });
    expect(brand).toBeInTheDocument();
    expect(brand).toHaveAttribute('href', '/');

    const cta = screen.getByRole('link', { name: /find my first contribution/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/start');
  });

  it('renders accessible navigation landmark', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('renders navigation link to onboarding guide', () => {
    render(<Navbar />);
    const link = screen.getByRole('link', { name: /^onboarding$/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/onboarding');
  });
});
