import { exponentialFalloff, type Tier, tierForScore } from './scoring.ts';

/**
 * Kern Duel scoring (Epic 03, plan §2.2). AUTHORITATIVE — mirrored for
 * display-only use in src/games/kern-duel/scoring.ts, pinned by the same
 * test vectors in scoring.test.ts. Keep the constants and math identical.
 *
 * Deviation is the MEAN absolute per-letter offset error across movable
 * letters (not the raw sum) — this is the only reading of "perfect within
 * ±1px per letter" that holds regardless of word length. See the plan's
 * "Doc ambiguity flagged" note for the full reasoning.
 */
export const KERN_TOLERANCE_PX = 1; // matches games.config.scoring.perfectTolerancePx (Epic 01 seed)
export const KERN_FALLOFF_PX = 8; // first-pass estimate; tune per plan §6 manual test 13

export interface KernDuelTruth {
  /** Reference offset in px per letter index (0 for locked first/last). */
  offsets: number[];
  lockedIndices: number[];
}

export interface KernDuelAnswer {
  /** Player's offset in px per letter index. */
  offsets: number[];
}

export function kernDeviation(truth: KernDuelTruth, answer: KernDuelAnswer | null): number {
  const movable = truth.offsets
    .map((_, i) => i)
    .filter((i) => !truth.lockedIndices.includes(i));
  if (movable.length === 0) return 0;
  const answerOffsets = answer?.offsets ?? [];
  const sum = movable.reduce((total, i) => {
    const a = typeof answerOffsets[i] === 'number' && Number.isFinite(answerOffsets[i]) ? answerOffsets[i] : 0;
    const t = truth.offsets[i] ?? 0;
    return total + Math.abs(a - t);
  }, 0);
  return sum / movable.length;
}

export function scoreKernDuel(truth: KernDuelTruth, answer: KernDuelAnswer | null): { score: number; tier: Tier } {
  const deviation = kernDeviation(truth, answer);
  const score = exponentialFalloff(deviation, KERN_TOLERANCE_PX, KERN_FALLOFF_PX);
  return { score, tier: tierForScore(score) };
}
