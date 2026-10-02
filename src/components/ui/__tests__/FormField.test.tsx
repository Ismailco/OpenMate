import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '../FormField';
import { Input } from '../Input';

describe('FormField component', () => {
  it('associates label with input via htmlFor/id', () => {
    render(
      <FormField id="test-field" label="Repository URL">
        <Input placeholder="Enter URL" />
      </FormField>
    );

    const input = screen.getByLabelText(/repository url/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test-field');
  });

  it('connects description and error to input using aria-describedby', () => {
    render(
      <FormField
        id="test-field"
        label="Repository URL"
        description="Public GitHub repos only"
        error="Invalid repository format"
      >
        <Input />
      </FormField>
    );

    const input = screen.getByLabelText(/repository url/i);
    expect(input).toHaveAttribute('aria-describedby', 'test-field-description test-field-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveTextContent(/invalid repository format/i);
  });
});
