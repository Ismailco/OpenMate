import 'server-only';
import {
  DOCUMENT_INDEX_POLL_INTERVAL_MS,
  DOCUMENT_INDEX_TIMEOUT_MS,
} from '../constants';
import {
  RepositoryAssistantIndexingError,
  RepositoryAssistantTimeoutError,
} from '../errors';
import type { BackboardAssistantClientLike } from './client';

export interface AwaitDocumentIndexedOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Polls Backboard document status until it reaches 'indexed'.
 * Throws a typed RepositoryAssistantIndexingError if indexing fails or times out.
 */
export async function awaitDocumentIndexed(
  client: BackboardAssistantClientLike,
  documentId: string,
  options: AwaitDocumentIndexedOptions = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DOCUMENT_INDEX_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DOCUMENT_INDEX_POLL_INTERVAL_MS;
  const sleep = options.sleepFn ?? defaultSleep;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const doc = await client.getDocumentStatus(documentId);
    const normalizedStatus = doc.status?.toLowerCase();

    if (normalizedStatus === 'indexed') {
      return;
    }

    if (normalizedStatus === 'failed') {
      const reason = doc.statusMessage || 'Backboard document indexing failed';
      throw new RepositoryAssistantIndexingError(
        `Document ${documentId} failed indexing: ${reason}`
      );
    }

    // Wait before next polling iteration
    await sleep(pollIntervalMs);
  }

  throw new RepositoryAssistantTimeoutError(
    `Document ${documentId} did not reach indexed state within ${timeoutMs}ms.`
  );
}
