import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock 'server-only' in test environment so server-only modules can be unit tested in jsdom
vi.mock('server-only', () => ({}));

// Mock Next.js navigation hooks for App Router client components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
