import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import { uploadRepositoryContextToThread } from '../upload-repository-context';
import type { RepositoryContext } from '@/features/repository-context/types';
import type { BackboardAssistantClientLike } from '../client';

describe('Upload Repository Context to Backboard Thread', () => {
  const dummyContext: RepositoryContext = {
    repository: {
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      defaultBranch: 'main',
      primaryLanguage: 'JavaScript',
      description: 'The library for web and native user interfaces.',
      license: 'MIT',
      stars: 220000,
      forks: 45000,
      topics: ['javascript', 'react'],
    },
    documentation: {
      readme: undefined,
      contributing: undefined,
    },
    projectStructure: {
      treeSummary: 'src/\npackage.json',
      topDirectories: ['src'],
      entrypointFiles: ['package.json'],
      totalFilesObserved: 10,
      truncated: false,
    },
    manifests: [],
    sourceFiles: [],
    issues: [],
    contextMetadata: {
      generatedAt: '2026-03-29T12:00:00.000Z',
      sourceFilesIncluded: 0,
      issuesIncluded: 0,
      truncatedDocuments: 0,
      truncatedFiles: 0,
      truncatedIssues: 0,
      approximateCharacters: 500,
    },
    trust: 'untrusted-repository-content',
  };

  it('writes temp file, uploads to thread, and guarantees local temp file deletion', async () => {
    let observedFilePath = '';
    const mockClient = {
      uploadDocumentToThread: vi.fn().mockImplementation(async (_threadId, filePath) => {
        observedFilePath = filePath;
        // Verify temp file exists during upload
        expect(fs.existsSync(filePath)).toBe(true);
        return { documentId: 'doc_123', status: 'pending' };
      }),
    } as unknown as BackboardAssistantClientLike;

    const res = await uploadRepositoryContextToThread(mockClient, 'thrd_abc', dummyContext);

    expect(res.documentId).toBe('doc_123');
    expect(res.status).toBe('pending');
    expect(mockClient.uploadDocumentToThread).toHaveBeenCalledWith('thrd_abc', expect.any(String));

    // Verify temp file was unlinked in finally block
    expect(fs.existsSync(observedFilePath)).toBe(false);
  });

  it('guarantees temp file cleanup even if uploadDocumentToThread throws', async () => {
    let observedFilePath = '';
    const mockClient = {
      uploadDocumentToThread: vi.fn().mockImplementation(async (_threadId, filePath) => {
        observedFilePath = filePath;
        throw new Error('Network error during upload');
      }),
    } as unknown as BackboardAssistantClientLike;

    await expect(
      uploadRepositoryContextToThread(mockClient, 'thrd_abc', dummyContext)
    ).rejects.toThrow('Failed to upload repository context document');

    expect(fs.existsSync(observedFilePath)).toBe(false);
  });
});
