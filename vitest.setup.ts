import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock 'server-only' in test environment so server-only modules can be unit tested in jsdom
vi.mock('server-only', () => ({}));
