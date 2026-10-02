import { describe, it, expect } from 'vitest';
import { parseRawRecommendationResponse } from '../parsing/parse-recommendation-response';
import { InvalidRecommendationResponseError } from '../errors';

describe('parseRawRecommendationResponse', () => {
  const validPayload = {
    recommendations: [
      {
        issueNumber: 10,
        fit: {
          summary: 'Fits React and TypeScript background very well.',
          relevantSkills: ['React', 'TypeScript'],
          matchedInterests: ['frontend'],
          experienceFit: 'good',
        },
        scope: {
          level: 'small',
          reasoning: 'Scoped to single button component styling bug.',
        },
        likelyFiles: [
          {
            path: 'src/components/Button.tsx',
            reason: 'Where button styles are defined.',
          },
        ],
        conceptsToUnderstand: ['Tailwind classes'],
        startingPoint: {
          summary: 'Reproduce with test suite.',
          steps: ['Run pnpm test Button.test.tsx', 'Check style mapping.'],
        },
        cautions: ['Verify hover state on mobile.'],
      },
    ],
  };

  it('parses valid raw JSON directly', () => {
    const raw = JSON.stringify(validPayload);
    const result = parseRawRecommendationResponse(raw);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]?.issueNumber).toBe(10);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify(validPayload, null, 2) + '\n```';
    const result = parseRawRecommendationResponse(raw);
    expect(result.recommendations[0]?.issueNumber).toBe(10);
  });

  it('throws InvalidRecommendationResponseError for empty response', () => {
    expect(() => parseRawRecommendationResponse('')).toThrow(
      InvalidRecommendationResponseError
    );
    expect(() => parseRawRecommendationResponse('   \n  ')).toThrow(
      InvalidRecommendationResponseError
    );
  });

  it('throws InvalidRecommendationResponseError for malformed JSON', () => {
    expect(() => parseRawRecommendationResponse('{ "recommendations": [ { broken')).toThrow(
      InvalidRecommendationResponseError
    );
  });

  it('throws InvalidRecommendationResponseError when schema bounds are violated (e.g. > 3 recommendations)', () => {
    const oversized = {
      recommendations: [
        validPayload.recommendations[0],
        validPayload.recommendations[0],
        validPayload.recommendations[0],
        validPayload.recommendations[0], // 4 items (limit is 3)
      ],
    };

    expect(() => parseRawRecommendationResponse(JSON.stringify(oversized))).toThrow(
      InvalidRecommendationResponseError
    );
  });
});
