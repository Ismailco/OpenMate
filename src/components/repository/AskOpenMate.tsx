'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { DeveloperProfile } from '@/features/developer-profile/types';
import type { ChatMessage } from '@/features/repository-assistant/types';
import {
  initializeChat,
  sendChatMessage,
  deleteChatSession,
} from '@/features/repository-assistant/client';
import {
  loadChatSession,
  saveChatSession,
  clearChatStorage,
} from '@/features/repository-assistant/storage/chat-storage';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/features/repository-assistant/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export type AssistantStatus = 'idle' | 'initializing' | 'ready' | 'sending' | 'error';

export interface AskOpenMateProps {
  profile: DeveloperProfile;
  primaryIssueNumber?: number;
}

function createMessageId(prefix: 'user' | 'asst'): string {
  return `msg_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createIsoTimestamp(): string {
  return new Date().toISOString();
}

export function AskOpenMate({ profile, primaryIssueNumber }: AskOpenMateProps) {
  const repoFullName = `${profile.repository.owner}/${profile.repository.name}`;

  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [conversationToken, setConversationToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const suggestedQuestions = [
    ...(primaryIssueNumber
      ? [`Why is the recommended issue a good fit for me?`]
      : []),
    'What should I read before starting to contribute?',
    'Explain the repository architecture simply.',
    'What should I test before submitting a pull request?',
  ];

  // Rehydrate existing chat session from sessionStorage on mount
  useEffect(() => {
    const existing = loadChatSession(repoFullName);
    if (existing && existing.conversationToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversationToken(existing.conversationToken);
      setMessages(existing.messages);
      setStatus('ready');
    }
  }, [repoFullName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (status === 'ready' || status === 'sending') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status]);

  // Cancel any active network request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartChat = async () => {
    setStatus('initializing');
    setErrorMessage(null);
    setIsTokenExpired(false);

    try {
      const result = await initializeChat(profile);
      setConversationToken(result.conversationToken);
      setStatus('ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize chat session.';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || !conversationToken || status === 'sending') {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: text,
      timestamp: createIsoTimestamp(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setStatus('sending');
    setErrorMessage(null);

    // Save user message immediately
    saveChatSession({
      conversationToken,
      repositoryFullName: repoFullName,
      messages: updatedMessages,
    });

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const answer = await sendChatMessage(
        {
          conversationToken,
          repository: profile.repository,
          message: text,
        },
        controller.signal
      );

      const assistantMessage: ChatMessage = {
        id: createMessageId('asst'),
        role: 'assistant',
        content: answer.message,
        timestamp: createIsoTimestamp(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setStatus('ready');

      // Persist assistant message
      saveChatSession({
        conversationToken,
        repositoryFullName: repoFullName,
        messages: finalMessages,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('ready');
        return;
      }

      const msg = err instanceof Error ? err.message : 'Failed to receive assistant reply.';
      if (msg.includes('expired') || (err as { status?: number }).status === 410) {
        setIsTokenExpired(true);
      }
      setErrorMessage(msg);
      setStatus('ready');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = async () => {
    if (conversationToken) {
      try {
        await deleteChatSession(conversationToken);
      } catch {
        // Best-effort cleanup
      }
    }
    clearChatStorage();
    setConversationToken(null);
    setMessages([]);
    setStatus('idle');
    setErrorMessage(null);
    setIsTokenExpired(false);
  };

  const handleQuestionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                Ask OpenMate
              </CardTitle>
              <Badge variant="accent" size="sm">
                Gemma 3 27B RAG
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Ask about the repository, your recommended issue, or what to understand before you start.
            </p>
          </div>

          {conversationToken && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleClearChat()}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear chat
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* IDLE STATE */}
        {status === 'idle' && (
          <div className="py-6 text-center">
            <div className="max-w-md mx-auto">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Have questions about the architecture, setup guide, or why an issue was recommended? OpenMate can answer follow-up questions grounded directly in this repository.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => void handleStartChat()}
                className="gap-2"
              >
                Start Repository Chat
              </Button>
            </div>

            {/* Suggested Question Pills */}
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-left">
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                Common questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      void handleStartChat().then(() => {
                        // After chat initializes, send the clicked question
                        setInputValue(q);
                      });
                    }}
                    className="text-xs rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-[var(--foreground)] hover:bg-[var(--surface)] hover:border-[var(--accent)] transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INITIALIZING STATE */}
        {status === 'initializing' && (
          <div className="py-12 text-center" role="status" aria-live="polite">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent mb-3" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              Preparing repository assistant…
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Indexing bounded repository context with Backboard RAG. This usually takes just a few seconds.
            </p>
          </div>
        )}

        {/* ERROR INITIALIZING STATE */}
        {status === 'error' && (
          <div className="py-6 text-center">
            <p className="text-sm text-[var(--danger)] mb-4">
              {errorMessage || 'Failed to initialize the repository assistant.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleStartChat()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* READY OR SENDING (CHAT ACTIVE) */}
        {(status === 'ready' || status === 'sending') && (
          <div className="flex flex-col gap-4">
            {/* Token Expiry Alert */}
            {isTokenExpired && (
              <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)] flex items-center justify-between">
                <span>This chat session has expired (24h limit). Please start a new session.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleStartChat()}
                  className="ml-2"
                >
                  Start New Session
                </Button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && !isTokenExpired && (
              <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">
                {errorMessage}
              </div>
            )}

            {/* Message Thread */}
            <div
              className="flex flex-col gap-3 min-h-[160px] max-h-[420px] overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4"
              role="log"
              aria-label="Conversation history"
            >
              {messages.length === 0 ? (
                <div className="m-auto text-center text-xs text-[var(--muted-foreground)] py-6">
                  <p>Assistant ready. Ask any question about this codebase!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] text-[var(--muted-foreground)] mb-1 px-1">
                      {msg.role === 'user' ? 'You' : 'OpenMate'}
                    </span>
                    <div
                      className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                          : 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {/* Sending indicator */}
              {status === 'sending' && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-[var(--muted-foreground)] mb-1 px-1">
                    OpenMate
                  </span>
                  <div className="rounded-lg bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                    OpenMate is thinking…
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips when thread is short */}
            {messages.length < 3 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={status === 'sending' || isTokenExpired}
                    onClick={() => void handleSendMessage(q)}
                    className="text-[11px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="flex items-center gap-2 pt-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
                disabled={status === 'sending' || isTokenExpired}
                placeholder="Ask a question about this repository..."
                maxLength={CHAT_MESSAGE_MAX_LENGTH}
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-hidden disabled:opacity-50"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputValue.trim() || status === 'sending' || isTokenExpired}
                isLoading={status === 'sending'}
              >
                Send
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
