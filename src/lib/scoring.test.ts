import { describe, expect, it } from 'vitest';
import {
  exponentialFalloff,
  levelForXp,
  tierForScore,
  xpForScore,
  MAX_SCORE,
} from './scoring';

/**
 * Shared test vectors (Epic 02, decision 2): these exact vectors also pin
 * the server copy in supabase/functions/_shared/scoring.ts. If either
 * implementation changes, both must keep passing this table.
 */
export const SCORING_VECTORS: Array<{
  deviation: number;
  tolerance: number;
  falloff: number;
  expected: number;
}> = [
  { deviation: 0, tolerance: 2, falloff: 40, expected: 5000 },
  { deviation: 2, tolerance: 2, falloff: 40, expected: 5000 }, // within tolerance
  { deviation: 42, tolerance: 2, falloff: 40, expected: 1839 }, // e^-1
  { deviation: 82, tolerance: 2, falloff: 40, expected: 677 }, // e^-2
  { deviation: 1000, tolerance: 2, falloff: 40, expected: 0 },
];

describe('exponentialFalloff', () => {
  it.each(SCORING_VECTORS)(
    'deviation $deviation -> $expected',
    ({ deviation, tolerance, falloff, expected }) => {
      expect(exponentialFalloff(deviation, tolerance, falloff)).toBe(expected);
    },
  );

  it('never exceeds MAX_SCORE and never goes negative', () => {
    for (let d = 0; d < 500; d += 7) {
      const s = exponentialFalloff(d, 1, 30);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(MAX_SCORE);
    }
  });

  it('scores 0 for garbage deviations (negative, NaN, Infinity)', () => {
    expect(exponentialFalloff(-5, 2, 40)).toBe(0);
    expect(exponentialFalloff(Number.NaN, 2, 40)).toBe(0);
    expect(exponentialFalloff(Number.POSITIVE_INFINITY, 2, 40)).toBe(0);
  });

  it('rejects a non-positive falloff', () => {
    expect(() => exponentialFalloff(10, 2, 0)).toThrow();
  });
});

describe('tierForScore', () => {
  it('maps thresholds to tiers', () => {
    expect(tierForScore(5000)).toBe('PERFECT');
    expect(tierForScore(4750)).toBe('PERFECT');
    expect(tierForScore(4749)).toBe('GREAT');
    expect(tierForScore(3500)).toBe('GREAT');
    expect(tierForScore(3499)).toBe('GOOD');
    expect(tierForScore(2000)).toBe('GOOD');
    expect(tierForScore(1999)).toBe('ROUGH');
    expect(tierForScore(0)).toBe('ROUGH');
  });
});

describe('xp & levels', () => {
  it('grants xp as floor(score/100)', () => {
    expect(xpForScore(5000)).toBe(50);
    expect(xpForScore(99)).toBe(0);
    expect(xpForScore(-10)).toBe(0);
  });

  it('levels up at cumulative thresholds', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(499)).toBe(1);
    expect(levelForXp(500)).toBe(2);
    expect(levelForXp(1500)).toBe(3);
    expect(levelForXp(3500)).toBe(4);
    expect(levelForXp(7000)).toBe(5);
    expect(levelForXp(999999)).toBe(5);
  });
});
