import { getSupabase } from '@/lib/supabase';
import { exponentialFalloff, tierForScore } from '@/lib/scoring';
import type {
  ClientRound,
  CompleteRunResponse,
  Referee,
  StartRunResponse,
  SubmitAnswerResponse,
} from '@/lib/refereeTypes';
import { getOrCreateGuestId } from '@/lib/guestStorage';

/**
 * Referee factory (Epic 02, decision 3). With Supabase configured, all
 * scoring is server-authoritative via Edge Functions. Without it (dev
 * only, plan edge case E11), an offline referee keeps the dummy game
 * playable; it is clearly non-competitive and logs its presence.
 */
export function createReferee(): Referee {
  const supabase = getSupabase();
  if (supabase) return edgeReferee();
  // Singleton: the offline referee holds truth in a closure, and React
  // StrictMode double-mounts would otherwise split startRun and
  // submitAnswer across two instances (empty truth map -> 0 scores).
  if (!offlineSingleton) {
    console.warn('[referee] Supabase not configured — using OFFLINE referee (dev only).');
    offlineSingleton = offlineReferee();
  }
  return offlineSingleton;
}

let offlineSingleton: Referee | null = null;

function edgeReferee(): Referee {
  const supabase = getSupabase();
  if (!supabase) throw new Error('edgeReferee requires a configured client');
  const guestHeaders = (): Record<string, string> => {
    // Lazily create the guest identity here, not just in the auth modal's
    // "Play as guest" button — a player who clicks "Play 5 rounds" straight
    // from Home never opens that modal, and start-run correctly 401s an
    // unauthenticated request with neither a user JWT nor a guest id.
    return { 'x-guest-id': getOrCreateGuestId() };
  };

  const invoke = async <T>(name: string, body: unknown): Promise<T> => {
    const { data, error } = await supabase.functions.invoke<T>(name, {
      body: body as Record<string, unknown>,
      headers: guestHeaders(),
    });
    if (error) throw new Error(`${name} failed: ${error.message}`);
    if (data === null) throw new Error(`${name} returned no data`);
    return data;
  };

  return {
    kind: 'edge',
    startRun: (gameSlug) => invoke<StartRunResponse>('start-run', { gameSlug }),
    submitAnswer: (args) => invoke<SubmitAnswerResponse>('submit-answer', args),
    completeRun: async (ticket) => {
      try {
        return await invoke<CompleteRunResponse>('complete-run', { ticket });
      } catch {
        // Guests have nothing to finalize server-side; treat as optional.
        return null;
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Offline referee (dev fallback). Truth lives in this closure — never  */
/* in the payload — so the payload-purity invariant holds even offline. */
/* ------------------------------------------------------------------ */

const DUMMY_TIMER_S = 15;
const DUMMY_TOLERANCE_PX = 2;
const DUMMY_FALLOFF_PX = 40;

function offlineReferee(): Referee {
  const truthByRound = new Map<string, { width: number }>();

  return {
    kind: 'offline',
    startRun: (gameSlug) => {
      if (gameSlug !== 'dummy') {
        return Promise.reject(
          new Error('Offline referee only supports the dummy game.'),
        );
      }
      const rounds: ClientRound[] = Array.from({ length: 5 }, (_, i) => {
        const width = 60 + Math.floor(Math.random() * 240);
        const roundId = crypto.randomUUID();
        truthByRound.set(roundId, { width });
        return {
          roundId,
          roundNo: i + 1,
          gameSlug: 'dummy',
          timerSeconds: DUMMY_TIMER_S,
          payload: { barWidth: width },
        };
      });
      return Promise.resolve({ runId: null, ticket: 'offline', rounds });
    },
    submitAnswer: ({ roundId, answer }) => {
      const truth = truthByRound.get(roundId) ?? null;
      const a = answer as { width?: unknown } | null;
      if (!truth || typeof a?.width !== 'number' || !Number.isFinite(a.width)) {
        return Promise.resolve({ score: 0, tier: 'ROUGH' as const, truth });
      }
      const score = exponentialFalloff(
        Math.abs(a.width - truth.width),
        DUMMY_TOLERANCE_PX,
        DUMMY_FALLOFF_PX,
      );
      return Promise.resolve({ score, tier: tierForScore(score), truth });
    },
    completeRun: () => Promise.resolve(null),
  };
}
