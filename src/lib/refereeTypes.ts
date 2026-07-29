/**
 * Wire types between client and the referee (Edge Functions or the
 * dev-only offline fallback). NOTE the deliberate absence of any `truth`
 * field on ClientRound — the type system cannot even represent truth
 * pre-submission (Epic 02, decision 1). payloadPurity.test.ts pins this.
 */
export interface ClientRound {
  roundId: string;
  roundNo: number;
  gameSlug: string;
  timerSeconds: number;
  payload: unknown;
}

export interface StartRunResponse {
  /** Null for guests (guest runs are not persisted server-side). */
  runId: string | null;
  /** Signed opaque token carrying round ids + deadlines for validation. */
  ticket: string;
  rounds: ClientRound[];
}

export interface SubmitAnswerArgs {
  ticket: string;
  roundNo: number;
  roundId: string;
  /** Null when the timer expired with no answer (server scores 0). */
  answer: unknown | null;
  clientTimeMs: number;
}

export interface SubmitAnswerResponse {
  score: number;
  tier: 'PERFECT' | 'GREAT' | 'GOOD' | 'ROUGH';
  /** Reference solution, revealed only after submission. */
  truth: unknown;
  /** True when the submission arrived outside the allowed window. */
  late?: boolean;
  /**
   * Refreshed ticket carrying a fresh deadline for the NEXT round, computed
   * from this submission's server time rather than the run's fixed opening
   * schedule — replaces the stored ticket so untimed dwell time on
   * intro/reveal screens can't cascade into false lateness later in the run.
   */
  ticket?: string;
}

export interface CompleteRunResponse {
  totalScore: number;
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface Referee {
  readonly kind: 'edge' | 'offline';
  startRun(gameSlug: string): Promise<StartRunResponse>;
  submitAnswer(args: SubmitAnswerArgs): Promise<SubmitAnswerResponse>;
  completeRun(ticket: string): Promise<CompleteRunResponse | null>;
}
