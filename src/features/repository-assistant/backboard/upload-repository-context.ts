import 'server-only';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { RepositoryContext } from '@/features/repository-context/types';
import { serializeRepositoryContext } from '@/features/repository-context/serialize-context';
import { RepositoryAssistantInitializationError } from '../errors';
import type { BackboardAssistantClientLike } from './client';

export interface UploadedThreadDocument {
  documentId: string;
  status: string;
}

/**
 * Serializes the bounded RepositoryContext, writes a temporary file in the OS temp directory,
 * uploads it to the Backboard thread for RAG indexing, and guarantees temporary file deletion.
 */
export async function uploadRepositoryContextToThread(
  client: BackboardAssistantClientLike,
  threadId: string,
  context: RepositoryContext
): Promise<UploadedThreadDocument> {
  const serializedContext = serializeRepositoryContext(context);
  const randomSuffix = crypto.randomUUID();
  const tmpFilePath = path.join(os.tmpdir(), `openmate-rag-${randomSuffix}.txt`);

  try {
    fs.writeFileSync(tmpFilePath, serializedContext, 'utf-8');

    const uploaded = await client.uploadDocumentToThread(threadId, tmpFilePath);
    return {
      documentId: uploaded.documentId,
      status: uploaded.status,
    };
  } catch (error) {
    throw new RepositoryAssistantInitializationError(
      `Failed to upload repository context document to thread ${threadId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    );
  } finally {
    try {
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
    } catch {
      // Ignore temporary file cleanup failure
    }
  }
}
