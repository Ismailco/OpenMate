import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeveloperProfileForm } from '../components/DeveloperProfileForm';

// Mock window.scrollTo
vi.stubGlobal('scrollTo', vi.fn());

describe('DeveloperProfileForm client interaction', () => {
  it('renders all form sections with default values', () => {
    render(<DeveloperProfileForm />);

    expect(screen.getByLabelText(/github repository url/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /your technologies & languages/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /contribution focus/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /experience & capacity/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/available time \(hours for this contribution\)/i)
    ).toBeInTheDocument();
  });

  it('allows adding and removing a skill', () => {
    render(<DeveloperProfileForm />);

    const skillInput = screen.getByPlaceholderText(/e\.g\. TypeScript/i);
    const addButton = screen.getByRole('button', { name: /add skill/i });

    // Add Python
    fireEvent.change(skillInput, { target: { value: 'Python' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Python')).toBeInTheDocument();

    // Remove Python
    const removeButton = screen.getByRole('button', { name: /remove python/i });
    fireEvent.click(removeButton);

    expect(screen.queryByText('Python')).not.toBeInTheDocument();
  });

  it('rejects duplicate skills ignoring case', () => {
    render(<DeveloperProfileForm />);

    const skillInput = screen.getByPlaceholderText(/e\.g\. TypeScript/i);
    const addButton = screen.getByRole('button', { name: /add skill/i });

    // Attempt to add "typescript" (already exists as "TypeScript")
    fireEvent.change(skillInput, { target: { value: 'typescript' } });
    fireEvent.click(addButton);

    expect(
      screen.getByText(/"typescript" has already been added to your profile\./i)
    ).toBeInTheDocument();
  });

  it('displays validation error if repository URL is invalid on submit', () => {
    render(<DeveloperProfileForm />);

    const repoInput = screen.getByLabelText(/github repository url/i);
    fireEvent.change(repoInput, { target: { value: 'https://gitlab.com/not/github' } });

    const submitButton = screen.getByRole('button', {
      name: /save & generate contribution profile/i,
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/only public github repositories on github\.com/i)
    ).toBeInTheDocument();
  });

  it('successfully transitions to profile-ready summary view on valid submit', () => {
    render(<DeveloperProfileForm />);

    const submitButton = screen.getByRole('button', {
      name: /save & generate contribution profile/i,
    });
    fireEvent.click(submitButton);

    // Profile ready state is rendered
    expect(screen.getByText(/profile ready/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /colinhacks\/zod/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /analyze repository/i })
    ).toBeDisabled();

    // Clicking "Edit Profile" brings user back to editing form
    const editButton = screen.getByRole('button', { name: /← edit profile/i });
    fireEvent.click(editButton);

    expect(screen.getByLabelText(/github repository url/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save & generate contribution profile/i })
    ).toBeInTheDocument();
  });
});
