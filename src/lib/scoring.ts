/**
 * Client mirror of the shared scoring vocabulary (Epic 02, decision 2).
 * AUTHORITATIVE scoring happens only in Edge Functions
 * (supabase/functions/_shared/scoring.ts). This mirror exists for display
 * math (tier colors, bar percentages) and for the dev-only offline referee.
 * Both copies are pinned by the same test vectors (scoring.test.ts) so the
 * implementations cannot drift silently.
 *
 * Curve (PRD 5.x): score = 5000 * exp(-max(0, deviation - tolerance) / falloff)
 * A deviation within `tolerance` is a perfect 5000.
 */
export const MAX_SCORE = 5000;

export type Tier = 'PERFECT' | 'GREAT' | 'GOOD' | 'ROUGH';

export const TIER_THRESHOLDS: Array<[Tier, number]> = [
  ['PERFECT', 4750],
  ['GREAT', 3500],
  ['GOOD', 2000],
  ['ROUGH', 0],
];

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
  for (const [tier, min] of TIER_THRESHOLDS) {
    if (score >= min) return tier;
  }
  return 'ROUGH';
}

export const TIER_COLOR_VAR: Record<Tier, string> = {
  PERFECT: 'var(--ds-tier-perfect)',
  GREAT: 'var(--ds-tier-great)',
  GOOD: 'var(--ds-tier-good)',
  ROUGH: 'var(--ds-tier-rough)',
};

/** XP is granted server-side as floor(score / 100); mirrored for display. */
export function xpForScore(score: number): number {
  return Math.floor(Math.max(0, score) / 100);
}

/** Cumulative XP required to reach each level (index 0 = level 1). */
export const LEVEL_THRESHOLDS = [0, 500, 1500, 3500, 7000] as const;

export const LEVEL_TITLES = [
  'Pixel Pusher',
  'Grid Guardian',
  'Kerning Knight',
  'Contrast Connoisseur',
  'Design Deity',
] as const;

export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && xp >= threshold) level = i + 1;
  }
  return level;
}
