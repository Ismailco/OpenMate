import { describe, it, expect } from 'vitest';
import { RawProfileInputSchema, DeveloperProfileSchema } from '../schemas';
import { normalizeProfile, ProfileValidationError } from '../normalize-profile';
import { RawProfileInput } from '../types';

const validRawInput: RawProfileInput = {
  repositoryUrl: 'https://github.com/vercel/next.js',
  skills: [
    { name: 'TypeScript', level: 'advanced' },
    { name: 'React', level: 'intermediate' },
  ],
  interests: ['frontend', 'testing'],
  availableHours: 4,
  contributionExperience: 'first-time',
};

describe('RawProfileInputSchema and normalizeProfile', () => {
  it('validates a complete, valid profile input', () => {
    const result = RawProfileInputSchema.safeParse(validRawInput);
    expect(result.success).toBe(true);
  });

  it('normalizes valid raw input into DeveloperProfile', () => {
    const profile = normalizeProfile(validRawInput);

    expect(profile.repository).toEqual({
      owner: 'vercel',
      name: 'next.js',
      url: 'https://github.com/vercel/next.js',
    });
    expect(profile.skills).toEqual([
      { name: 'TypeScript', level: 'advanced' },
      { name: 'React', level: 'intermediate' },
    ]);
    expect(profile.interests).toEqual(['frontend', 'testing']);
    expect(profile.availableHours).toBe(4);
    expect(profile.contributionExperience).toBe('first-time');

    // Asserts canonical schema conformance
    expect(() => DeveloperProfileSchema.parse(profile)).not.toThrow();
  });

  it('rejects profiles with zero skills', () => {
    const input = { ...validRawInput, skills: [] };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(() => normalizeProfile(input)).toThrow(ProfileValidationError);
  });

  it('rejects profiles exceeding the maximum skill limit (12)', () => {
    const skills = Array.from({ length: 13 }, (_, i) => ({
      name: `Skill${i}`,
      level: 'intermediate' as const,
    }));
    const input = { ...validRawInput, skills };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate skills ignoring case and whitespace', () => {
    const input: RawProfileInput = {
      ...validRawInput,
      skills: [
        { name: 'React', level: 'advanced' },
        { name: ' react ', level: 'intermediate' },
      ],
    };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/duplicate skill/i);
    }
  });

  it('rejects overlong skill names (>40 characters)', () => {
    const input: RawProfileInput = {
      ...validRawInput,
      skills: [
        {
          name: 'A'.repeat(41),
          level: 'intermediate',
        },
      ],
    };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/40 characters/i);
    }
  });

  it('rejects empty or whitespace-only skill names', () => {
    const input: RawProfileInput = {
      ...validRawInput,
      skills: [{ name: '   ', level: 'intermediate' }],
    };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects profiles with zero interests', () => {
    const input = { ...validRawInput, interests: [] };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects available hours outside allowable range (1-40)', () => {
    expect(
      RawProfileInputSchema.safeParse({ ...validRawInput, availableHours: 0 })
        .success
    ).toBe(false);
    expect(
      RawProfileInputSchema.safeParse({ ...validRawInput, availableHours: 41 })
        .success
    ).toBe(false);
    expect(
      RawProfileInputSchema.safeParse({
        ...validRawInput,
        availableHours: 2.5,
      }).success
    ).toBe(false);
  });

  it('rejects unknown contribution experience values', () => {
    const input = { ...validRawInput, contributionExperience: 'expert-hacker' };
    const result = RawProfileInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('trims whitespace and canonicalizes skills during normalization', () => {
    const input: RawProfileInput = {
      ...validRawInput,
      repositoryUrl: 'https://github.com/facebook/react/   ',
      skills: [{ name: '  TypeScript  ', level: 'advanced' }],
    };
    const profile = normalizeProfile(input);
    expect(profile.repository.url).toBe('https://github.com/facebook/react');
    expect(profile.skills[0]?.name).toBe('TypeScript');
  });
});
