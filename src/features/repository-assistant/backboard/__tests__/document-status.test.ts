import { describe, it, expect, vi } from 'vitest';
import { awaitDocumentIndexed } from '../document-status';
import {
  RepositoryAssistantIndexingError,
  RepositoryAssistantTimeoutError,
} from '../../errors';
import type { BackboardAssistantClientLike } from '../client';

describe('Backboard Document Indexing Polling', () => {
  it('resolves cleanly when document transitions from pending -> processing -> indexed', async () => {
    let callCount = 0;
    const mockClient = {
      getDocumentStatus: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return { documentId: 'doc_1', status: 'pending' };
        if (callCount === 2) return { documentId: 'doc_1', status: 'processing' };
        return { documentId: 'doc_1', status: 'indexed' };
      }),
    } as unknown as BackboardAssistantClientLike;

    const mockSleep = vi.fn().mockResolvedValue(undefined);

    await awaitDocumentIndexed(mockClient, 'doc_1', {
      timeoutMs: 5000,
      pollIntervalMs: 10,
      sleepFn: mockSleep,
    });

    expect(mockClient.getDocumentStatus).toHaveBeenCalledTimes(3);
    expect(mockSleep).toHaveBeenCalledTimes(2);
  });

  it('throws RepositoryAssistantIndexingError when status is failed', async () => {
    const mockClient = {
      getDocumentStatus: vi.fn().mockResolvedValue({
        documentId: 'doc_1',
        status: 'failed',
        statusMessage: 'Invalid file format',
      }),
    } as unknown as BackboardAssistantClientLike;

    await expect(
      awaitDocumentIndexed(mockClient, 'doc_1', {
        timeoutMs: 5000,
        pollIntervalMs: 10,
        sleepFn: vi.fn().mockResolvedValue(undefined),
      })
    ).rejects.toThrow(RepositoryAssistantIndexingError);
  });

  it('throws RepositoryAssistantTimeoutError when status stays pending beyond timeout', async () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 2000;
      return now;
    });

    const mockClient = {
      getDocumentStatus: vi.fn().mockResolvedValue({
        documentId: 'doc_1',
        status: 'processing',
      }),
    } as unknown as BackboardAssistantClientLike;

    await expect(
      awaitDocumentIndexed(mockClient, 'doc_1', {
        timeoutMs: 3000,
        pollIntervalMs: 10,
        sleepFn: vi.fn().mockResolvedValue(undefined),
      })
    ).rejects.toThrow(RepositoryAssistantTimeoutError);

    vi.restoreAllMocks();
  });
});
