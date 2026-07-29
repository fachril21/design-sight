/**
 * Shared per-game round timing (Epic 02 decision 3 / Epic 03 follow-up).
 * Single source for start-run (initial ticket) and submit-answer (per-round
 * deadline refresh) so the two can never define a different budget for the
 * same game.
 */
export interface GameSpec {
  timerSeconds: number;
  procedural: boolean;
}

export const GAME_SPECS: Record<string, GameSpec> = {
  dummy: { timerSeconds: 15, procedural: true },
  'kern-duel': { timerSeconds: 30, procedural: false },
  'contrast-call': { timerSeconds: 15, procedural: false },
  'color-match': { timerSeconds: 20, procedural: true },
  'type-snob': { timerSeconds: 15, procedural: false },
};

/** Per-round wall-clock allowance: play timer + reveal/interstitial buffer. */
export const INTERSTITIAL_BUFFER_S = 45;

export function perRoundBudgetMs(gameSlug: string): number {
  const timerSeconds = GAME_SPECS[gameSlug]?.timerSeconds ?? 15;
  return (timerSeconds + INTERSTITIAL_BUFFER_S) * 1000;
}
