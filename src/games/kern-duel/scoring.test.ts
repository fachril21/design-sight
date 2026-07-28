import { describe, expect, it } from 'vitest';
import { kernDeviation, scoreKernDuel, KERN_TOLERANCE_PX, KERN_FALLOFF_PX } from './scoring';

/**
 * Shared vectors for the client scoring mirror. The identical set (values
 * only, no imports) lives in supabase/functions/_shared kernScoring — if
 * you change one, change both or these numbers will silently diverge
 * (plan §6 manual test 13 calls this out explicitly).
 */
describe('kernDeviation', () => {
  it('is 0 when the answer exactly matches truth', () => {
    const truth = { offsets: [0, 5, -3, 0], lockedIndices: [0, 3] };
    expect(kernDeviation(truth, { offsets: [0, 5, -3, 0] })).toBe(0);
  });

  it('is the mean absolute deviation across movable letters only', () => {
    // movable indices 1,2 (0 and 3 locked); |5-1| + |-3-1| = 4+4=8 / 2 = 4
    const truth = { offsets: [0, 5, -3, 0], lockedIndices: [0, 3] };
    expect(kernDeviation(truth, { offsets: [0, 1, 1, 0] })).toBe(4);
  });

  it('treats a missing/null answer as all-zero offsets (K7: untouched submission)', () => {
    const truth = { offsets: [0, 5, -3, 0], lockedIndices: [0, 3] };
    // |0-5| + |0-(-3)| = 5+3=8 / 2 = 4
    expect(kernDeviation(truth, null)).toBe(4);
  });

  it('coerces non-finite/missing per-letter answer entries to 0 rather than NaN (K7-adjacent robustness)', () => {
    const truth = { offsets: [0, 5, -3, 0], lockedIndices: [0, 3] };
    const answer = { offsets: [0, Number.NaN, -3] }; // index 2 present, index 3 out of bounds n/a (locked anyway)
    // index1 -> treated as 0: |0-5|=5; index2: |-3 - -3|=0; total 5/2=2.5
    expect(kernDeviation(truth, answer)).toBe(2.5);
  });

  it('is 0 for a word with zero movable letters (defensive; content pipeline should reject these — K3)', () => {
    const truth = { offsets: [0, 0], lockedIndices: [0, 1] };
    expect(kernDeviation(truth, { offsets: [0, 0] })).toBe(0);
  });

  it('never divides by the full letter count, only movable count', () => {
    // 6-letter word, only 1 movable (indices 0 and everything but index 3 locked to isolate the divisor)
    const truth = { offsets: [0, 0, 0, 9, 0, 0], lockedIndices: [0, 1, 2, 4, 5] };
    expect(kernDeviation(truth, { offsets: [0, 0, 0, 0, 0, 0] })).toBe(9);
  });
});

describe('scoreKernDuel', () => {
  it('scores 5000 (PERFECT) within tolerance', () => {
    const truth = { offsets: [0, 4, 0], lockedIndices: [0, 2] };
    const { score, tier } = scoreKernDuel(truth, { offsets: [0, 4.5, 0] }); // 0.5px off, within 1px tolerance
    expect(score).toBe(5000);
    expect(tier).toBe('PERFECT');
  });

  it('falls off exponentially beyond tolerance using the shared falloff constant', () => {
    const truth = { offsets: [0, 10, 0], lockedIndices: [0, 2] };
    // deviation = |answer-10| ; put it exactly at tolerance+falloff for a known ratio (~e^-1 => ~1839)
    const answer = { offsets: [0, 10 - (KERN_TOLERANCE_PX + KERN_FALLOFF_PX), 0] };
    const { score } = scoreKernDuel(truth, answer);
    expect(score).toBe(1839);
  });

  it('a completely untouched (all-zero) submission scores low but does not crash (K7)', () => {
    const truth = { offsets: [0, 30, 25, 0], lockedIndices: [0, 3] };
    const { score, tier } = scoreKernDuel(truth, { offsets: [0, 0, 0, 0] });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(500);
    expect(tier).toBe('ROUGH');
  });
});
