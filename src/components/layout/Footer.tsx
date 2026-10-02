import React from 'react';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-muted)] bg-[var(--surface)] py-8 mt-auto text-xs text-[var(--muted)]">
      <Container size="lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[var(--foreground)]">OpenMate</span>
            <span className="text-[var(--border)]" aria-hidden="true">/</span>
            <span>Open-source developer onboarding tool</span>
          </div>

          <div className="flex items-center gap-4 text-[var(--muted-foreground)]">
            <span>Built for Hacktoberfest DEV Launch Weekend</span>
            <a
              href="https://github.com/Ismailco/OpenMate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors underline underline-offset-2"
            >
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
