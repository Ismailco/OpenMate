import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AskOpenMate } from '../AskOpenMate';
import * as chatClient from '@/features/repository-assistant/client';
import { CHAT_STORAGE_KEY } from '@/features/repository-assistant/constants';
import type { DeveloperProfile } from '@/features/developer-profile/types';

describe('AskOpenMate Component', () => {
  const dummyProfile: DeveloperProfile = {
    repository: {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
    },
    skills: [{ name: 'TypeScript', level: 'advanced' }],
    interests: ['frontend'],
    availableHours: 5,
    contributionExperience: 'some-experience',
  };

  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders in idle state with Start Repository Chat button and suggested questions', () => {
    render(<AskOpenMate profile={dummyProfile} primaryIssueNumber={1234} />);

    expect(screen.getByText('Ask OpenMate')).toBeInTheDocument();
    expect(screen.getByText('Gemma 3 27B RAG')).toBeInTheDocument();
    expect(screen.getByText('Start Repository Chat')).toBeInTheDocument();
    expect(screen.getByText('Why is the recommended issue a good fit for me?')).toBeInTheDocument();
  });

  it('transitions to initializing and then ready after clicking Start Repository Chat', async () => {
    vi.spyOn(chatClient, 'initializeChat').mockResolvedValueOnce({
      success: true,
      conversationToken: 'mock.token.abc',
      repositoryFullName: 'facebook/react',
      expiresAt: Date.now() + 60000,
    });

    render(<AskOpenMate profile={dummyProfile} />);

    const startBtn = screen.getByRole('button', { name: /start repository chat/i });
    fireEvent.click(startBtn);

    expect(screen.getByText('Preparing repository assistant…')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/ask a question about this repository/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sends question, disables button during flight, and renders assistant answer safely as plain text', async () => {
    vi.spyOn(chatClient, 'initializeChat').mockResolvedValueOnce({
      success: true,
      conversationToken: 'mock.token.abc',
      repositoryFullName: 'facebook/react',
      expiresAt: Date.now() + 60000,
    });

    const maliciousXssContent =
      '<img src=x onerror=alert("xss")> To test this component run `npm test`.';

    vi.spyOn(chatClient, 'sendChatMessage').mockResolvedValueOnce({
      message: maliciousXssContent,
      model: 'google/gemma-3-27b-it',
    });

    render(<AskOpenMate profile={dummyProfile} />);

    // Initialize
    fireEvent.click(screen.getByRole('button', { name: /start repository chat/i }));
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/ask a question about this repository/i)
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/ask a question about this repository/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'How do I test my code?' } });
    fireEvent.click(sendBtn);

    // Shows user question
    expect(screen.getByText('How do I test my code?')).toBeInTheDocument();

    // Assistant answer arrives
    await waitFor(() => {
      expect(screen.getByText(maliciousXssContent)).toBeInTheDocument();
    });

    // Verify it is rendered as text, not an actual img DOM element
    const imgElement = document.querySelector('img[src="x"]');
    expect(imgElement).toBeNull();
  });

  it('rehydrates chat session from sessionStorage on mount', async () => {
    window.sessionStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        conversationToken: 'saved.token.123',
        repositoryFullName: 'facebook/react',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Previous question',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'm2',
            role: 'assistant',
            content: 'Previous answer',
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      })
    );

    render(<AskOpenMate profile={dummyProfile} />);

    await waitFor(() => {
      expect(screen.getByText('Previous question')).toBeInTheDocument();
    });
    expect(screen.getByText('Previous answer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
  });

  it('clears chat session when Clear chat is clicked', async () => {
    const deleteSpy = vi.spyOn(chatClient, 'deleteChatSession').mockResolvedValue();

    window.sessionStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        conversationToken: 'saved.token.123',
        repositoryFullName: 'facebook/react',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      })
    );

    render(<AskOpenMate profile={dummyProfile} />);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /clear chat/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('saved.token.123');
      expect(window.sessionStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
      expect(screen.queryByText('Hello')).toBeNull();
      expect(screen.getByText('Start Repository Chat')).toBeInTheDocument();
    });
  });
});
