import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadChatSession,
  saveChatSession,
  clearChatStorage,
} from '../chat-storage';
import { CHAT_STORAGE_KEY, MAX_STORED_CHAT_MESSAGES } from '../../constants';
import type { ChatMessage } from '../../types';

describe('Chat SessionStorage Management', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  const sampleMessages: ChatMessage[] = [
    {
      id: 'msg_1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'msg_2',
      role: 'assistant',
      content: 'Hi! How can I help with this repository?',
      timestamp: new Date().toISOString(),
    },
  ];

  it('saves and loads chat session for matching repository', () => {
    saveChatSession({
      conversationToken: 'valid.token',
      repositoryFullName: 'facebook/react',
      messages: sampleMessages,
    });

    const loaded = loadChatSession('facebook/react');
    expect(loaded).not.toBeNull();
    expect(loaded?.conversationToken).toBe('valid.token');
    expect(loaded?.repositoryFullName).toBe('facebook/react');
    expect(loaded?.messages).toHaveLength(2);
  });

  it('discards chat session if requested for a different repository', () => {
    saveChatSession({
      conversationToken: 'valid.token',
      repositoryFullName: 'facebook/react',
      messages: sampleMessages,
    });

    const loaded = loadChatSession('vercel/next.js');
    expect(loaded).toBeNull();
    // Verify it was cleaned up
    expect(window.sessionStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
  });

  it('discards corrupted JSON data and returns null', () => {
    window.sessionStorage.setItem(CHAT_STORAGE_KEY, 'invalid-json{{{');

    const loaded = loadChatSession('facebook/react');
    expect(loaded).toBeNull();
    expect(window.sessionStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
  });

  it('bounds stored messages to MAX_STORED_CHAT_MESSAGES (40)', () => {
    const manyMessages: ChatMessage[] = Array.from({ length: 60 }, (_, i) => ({
      id: `msg_${i}`,
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
      timestamp: new Date().toISOString(),
    }));

    saveChatSession({
      conversationToken: 'valid.token',
      repositoryFullName: 'facebook/react',
      messages: manyMessages,
    });

    const loaded = loadChatSession('facebook/react');
    expect(loaded?.messages).toHaveLength(MAX_STORED_CHAT_MESSAGES);
    // Should have preserved the newest messages (20 to 59)
    expect(loaded?.messages[0]?.id).toBe('msg_20');
    expect(loaded?.messages[MAX_STORED_CHAT_MESSAGES - 1]?.id).toBe('msg_59');
  });

  it('clears chat storage cleanly', () => {
    saveChatSession({
      conversationToken: 'valid.token',
      repositoryFullName: 'facebook/react',
      messages: sampleMessages,
    });

    clearChatStorage();
    expect(loadChatSession('facebook/react')).toBeNull();
  });
});
