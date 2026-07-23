/**
 * AUTHORITATIVE scoring vocabulary (Epic 02, decision 2). Mirrored for
 * display-only use in src/lib/scoring.ts; both copies are pinned by the
 * test vectors in src/lib/scoring.test.ts. Keep the math identical.
 *
 * Curve (PRD 5.x): score = 5000 * exp(-max(0, deviation - tolerance) / falloff)
 */
export const MAX_SCORE = 5000;

export type Tier = 'PERFECT' | 'GREAT' | 'GOOD' | 'ROUGH';

export function exponentialFalloff(
  deviation: number,
  tolerance: number,
  falloff: number,
): number {
  if (!Number.isFinite(deviation) || deviation < 0) return 0;
  if (falloff <= 0) throw new Error('falloff must be > 0');
  const effective = Math.max(0, deviation - tolerance);
  return Math.round(MAX_SCORE * Math.exp(-effective / falloff));
}

export function tierForScore(score: number): Tier {
  if (score >= 4750) return 'PERFECT';
  if (score >= 3500) return 'GREAT';
  if (score >= 2000) return 'GOOD';
  return 'ROUGH';
}

export function xpForScore(score: number): number {
  return Math.floor(Math.max(0, score) / 100);
}

export const LEVEL_THRESHOLDS = [0, 500, 1500, 3500, 7000];

export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}
