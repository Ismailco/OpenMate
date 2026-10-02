import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeveloperProfileForm } from '../components/DeveloperProfileForm';

describe('DeveloperProfileForm client interaction', () => {
  it('renders all form sections with default values', () => {
    render(<DeveloperProfileForm />);

    expect(screen.getByLabelText(/github repository url/i)).toHaveValue(
      'https://github.com/colinhacks/zod'
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save & generate contribution profile/i })
    ).toBeInTheDocument();
  });

  it('allows adding and removing a skill', () => {
    render(<DeveloperProfileForm />);

    const input = screen.getByLabelText(/technologies & languages/i);
    const addButton = screen.getByRole('button', { name: /add skill/i });

    fireEvent.change(input, { target: { value: 'Rust' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Rust')).toBeInTheDocument();

    const removeRustBtn = screen.getByRole('button', {
      name: /remove rust/i,
    });
    fireEvent.click(removeRustBtn);

    expect(screen.queryByText('Rust')).not.toBeInTheDocument();
  });

  it('rejects duplicate skills ignoring case', () => {
    render(<DeveloperProfileForm />);

    const input = screen.getByLabelText(/technologies & languages/i);
    const addButton = screen.getByRole('button', { name: /add skill/i });

    fireEvent.change(input, { target: { value: 'typescript' } });
    fireEvent.click(addButton);

    expect(
      screen.getByText(/has already been added to your profile/i)
    ).toBeInTheDocument();
  });

  it('displays validation error if repository URL is invalid on submit', () => {
    render(<DeveloperProfileForm />);

    const repoInput = screen.getByLabelText(/github repository url/i);
    fireEvent.change(repoInput, {
      target: { value: 'https://gitlab.com/user/project' },
    });

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
    ).toBeEnabled();

    // Clicking "Edit Profile" brings user back to editing form
    const editButton = screen.getByRole('button', { name: /← edit profile/i });
    fireEvent.click(editButton);

    expect(screen.getByLabelText(/github repository url/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save & generate contribution profile/i })
    ).toBeInTheDocument();
  });
});
