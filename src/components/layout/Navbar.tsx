import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xs">
      <Container size="lg">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-mono text-base font-bold tracking-tight text-[var(--foreground)] hover:opacity-80 transition-opacity"
            >
              <span className="text-[var(--accent)] font-mono select-none" aria-hidden="true">&gt;_</span>
              <span>OpenMate</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-4 text-xs font-medium text-[var(--muted)]" aria-label="Main navigation">
              <Link
                href="/start"
                className="hover:text-[var(--foreground)] transition-colors py-1"
              >
                Onboarding
              </Link>
              <Link
                href="/repo"
                className="hover:text-[var(--foreground)] transition-colors py-1"
              >
                Preview Results
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Ismailco/OpenMate"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-2 py-1"
              aria-label="GitHub Repository"
            >
              <span aria-hidden="true">gh:</span>
              <span>Ismailco/OpenMate</span>
            </a>

            <Button href="/start" size="sm" variant="primary">
              Find my first contribution
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
