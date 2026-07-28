import { exponentialFalloff, tierForScore, type Tier } from '@/lib/scoring';

/**
 * Client mirror of supabase/functions/_shared/kernScoring.ts (Epic 03,
 * plan §2.2). Display-only — the server is authoritative. Pinned to the
 * server copy by the shared test vectors in scoring.test.ts.
 */
export const KERN_TOLERANCE_PX = 1;
export const KERN_FALLOFF_PX = 8;

export interface KernDuelTruth {
  offsets: number[];
  lockedIndices: number[];
}

export interface KernDuelAnswer {
  offsets: number[];
}

export function kernDeviation(truth: KernDuelTruth, answer: KernDuelAnswer | null): number {
  const movable = truth.offsets
    .map((_, i) => i)
    .filter((i) => !truth.lockedIndices.includes(i));
  if (movable.length === 0) return 0;
  const answerOffsets = answer?.offsets ?? [];
  const sum = movable.reduce((total, i) => {
    const a =
      typeof answerOffsets[i] === 'number' && Number.isFinite(answerOffsets[i])
        ? answerOffsets[i]
        : 0;
    const t = truth.offsets[i] ?? 0;
    return total + Math.abs(a - t);
  }, 0);
  return sum / movable.length;
}

export function scoreKernDuel(
  truth: KernDuelTruth,
  answer: KernDuelAnswer | null,
): { score: number; tier: Tier } {
  const deviation = kernDeviation(truth, answer);
  const score = exponentialFalloff(deviation, KERN_TOLERANCE_PX, KERN_FALLOFF_PX);
  return { score, tier: tierForScore(score) };
}
