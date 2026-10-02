import {
  ANALYSIS_SESSION_MAX_AGE_MS,
  ANALYSIS_SESSION_STORAGE_KEY,
} from './constants';
import { AnalysisSessionSchema } from './schema';
import { AnalysisSession } from './types';

/**
 * Saves a validated AnalysisSession into browser sessionStorage.
 * Wrapped in try/catch to gracefully handle restricted browser environments (incognito/quota).
 */
export function saveAnalysisSession(session: AnalysisSession): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false;
  }

  const parseResult = AnalysisSessionSchema.safeParse(session);
  if (!parseResult.success) {
    return false;
  }

  try {
    const serialized = JSON.stringify(parseResult.data);
    window.sessionStorage.setItem(ANALYSIS_SESSION_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads and validates an AnalysisSession from browser sessionStorage.
 * Discards malformed, corrupted, or expired session data automatically.
 */
export function loadAnalysisSession(): AnalysisSession | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      clearAnalysisSession();
      return null;
    }

    const parseResult = AnalysisSessionSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      clearAnalysisSession();
      return null;
    }

    const session = parseResult.data as AnalysisSession;
    const createdAtMs = new Date(session.createdAt).getTime();

    // Check session age limit (e.g. 24 hours)
    if (isNaN(createdAtMs) || Date.now() - createdAtMs > ANALYSIS_SESSION_MAX_AGE_MS) {
      clearAnalysisSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Clears the current analysis session from browser sessionStorage.
 */
export function clearAnalysisSession(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.removeItem(ANALYSIS_SESSION_STORAGE_KEY);
  } catch {
    // Graceful no-op
  }
}
