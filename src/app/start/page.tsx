import React from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InlineAlert } from '@/components/ui/InlineAlert';

export const metadata: Metadata = {
  title: 'Start Contribution Onboarding',
  description: 'Provide a GitHub repository and developer background to generate your tailored contribution roadmap.',
};

export default function StartPage() {
  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container size="sm">
        <PageHeader
          title="Find your first contribution"
          description="Tell OpenMate which repository you want to contribute to and what technologies you are comfortable with."
          badge={<Badge variant="accent" size="sm">Step 1 of 2: Profile & Repository</Badge>}
        />

        <InlineAlert variant="info" className="mb-8" title="Phase 1 Foundation Shell">
          This onboarding form represents the UI layout and primitive input structures. Full client-side input validation, dynamic skill tagging, and GitHub ingestion pipeline will be wired in Phase 2 &amp; 3.
        </InlineAlert>

        <form className="space-y-8">
          {/* Section 1: Target Repository */}
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">01</span>
                <span>Target Repository</span>
              </CardTitle>
              <CardDescription>
                Enter the full URL of any public GitHub repository you would like to contribute to.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                id="repoUrl"
                label="GitHub Repository URL"
                description="Must be a valid public repository format (e.g. https://github.com/facebook/react)"
                required
              >
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/owner/repository"
                  defaultValue="https://github.com/colinhacks/zod"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Section 2: Developer Skills */}
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">02</span>
                <span>Skills & Technologies</span>
              </CardTitle>
              <CardDescription>
                List the languages and frameworks you know so OpenMate can match relevant issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                id="skillsInput"
                label="Core Skills & Technologies"
                description="Comma-separated or tag format (e.g. TypeScript, React, Node.js, Rust)"
              >
                <Input
                  id="skillsInput"
                  placeholder="e.g. TypeScript, React, Go, Python"
                  defaultValue="TypeScript, Testing, JavaScript"
                />
              </FormField>

              <div>
                <label
                  htmlFor="experienceSelect"
                  className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] block mb-1.5"
                >
                  Contribution Experience
                </label>
                <select
                  id="experienceSelect"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                  defaultValue="intermediate"
                >
                  <option value="first_time">First-time open-source contributor</option>
                  <option value="beginner">Beginner (1–2 minor contributions)</option>
                  <option value="intermediate">Intermediate (Comfortable with Git & PRs)</option>
                  <option value="experienced">Experienced open-source contributor</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Time & Availability */}
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--accent)]" aria-hidden="true">03</span>
                <span>Time Availability</span>
              </CardTitle>
              <CardDescription>
                Estimate how many hours you want to dedicate to this initial contribution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                id="hoursInput"
                label="Available Hours (This Session / Weekend)"
                description="Realistic scope budget (e.g. 2 to 5 hours)"
              >
                <Input
                  id="hoursInput"
                  type="number"
                  min={1}
                  max={40}
                  defaultValue={3}
                />
              </FormField>

              <FormField
                id="interestsInput"
                label="Focus Areas / Interests (Optional)"
                description="Specific domains you prefer (e.g. documentation, bug fixes, frontend, performance)"
              >
                <Input
                  id="interestsInput"
                  placeholder="e.g. error messages, types, unit tests"
                  defaultValue="developer experience, error handling"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-muted)]">
            <Button href="/" variant="ghost" size="md">
              ← Back to Overview
            </Button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button href="/repo" variant="primary" size="md" className="w-full sm:w-auto">
                Preview Sample Analysis ↗
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </main>
  );
}
