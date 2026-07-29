import { create } from 'zustand';
import type { ClientRound, SubmitAnswerResponse } from '@/lib/refereeTypes';

/**
 * Round-flow state machine (Epic 02, US2.2 / decision 4).
 * One rhythm for every game: intro -> countdown -> playing -> scoring ->
 * reveal -> (next round | complete). Transitions are table-driven; an
 * illegal event throws in dev and no-ops in prod (edge case E16).
 * The timer is store-owned so component unmount/remount cannot double-tick,
 * and an in-progress run snapshot persists to sessionStorage for mid-round
 * refresh recovery (edge case E3/E4).
 */
export type RoundState =
  | 'idle'
  | 'intro'
  | 'countdown'
  | 'playing'
  | 'scoring'
  | 'reveal'
  | 'complete'
  | 'error';

export type RoundEvent =
  | 'START_RUN'
  | 'BEGIN'
  | 'COUNTDOWN_DONE'
  | 'SUBMIT'
  | 'TIMER_EXPIRED'
  | 'SCORED'
  | 'NEXT_ROUND'
  | 'RUN_DONE'
  | 'FAIL'
  | 'RESET';

const TRANSITIONS: Record<RoundState, Partial<Record<RoundEvent, RoundState>>> = {
  idle: { START_RUN: 'intro', FAIL: 'error' },
  intro: { BEGIN: 'countdown', RESET: 'idle', FAIL: 'error' },
  countdown: { COUNTDOWN_DONE: 'playing', RESET: 'idle', FAIL: 'error' },
  playing: { SUBMIT: 'scoring', TIMER_EXPIRED: 'scoring', RESET: 'idle', FAIL: 'error' },
  scoring: { SCORED: 'reveal', RESET: 'idle', FAIL: 'error' },
  reveal: { NEXT_ROUND: 'intro', RUN_DONE: 'complete', RESET: 'idle', FAIL: 'error' },
  complete: { RESET: 'idle' },
  error: { RESET: 'idle', START_RUN: 'intro' },
};

export interface RoundResultEntry {
  roundNo: number;
  answer: unknown;
  score: number;
  tier: SubmitAnswerResponse['tier'];
  truth: unknown;
}

export const SNAPSHOT_KEY = 'ds_run_snapshot';

interface RunSnapshot {
  version: 1;
  gameSlug: string;
  runId: string | null;
  ticket: string;
  rounds: ClientRound[];
  currentIndex: number;
  results: RoundResultEntry[];
  /** Epoch ms deadline of the in-flight round; null outside playing. */
  playingDeadline: number | null;
}

interface RoundStoreState {
  state: RoundState;
  gameSlug: string | null;
  runId: string | null;
  ticket: string | null;
  rounds: ClientRound[];
  currentIndex: number;
  results: RoundResultEntry[];
  deadline: number | null;
  timeRemainingMs: number;
  lastError: string | null;

  dispatch: (event: RoundEvent, apply?: (s: RoundStoreState) => Partial<RoundStoreState>) => boolean;
  startRun: (args: { gameSlug: string; runId: string | null; ticket: string; rounds: ClientRound[] }) => void;
  beginRound: () => void;
  countdownDone: (timerSeconds: number) => void;
  /** rAF/test tick; fires TIMER_EXPIRED exactly once at deadline. */
  tick: (now: number) => void;
  submit: () => boolean;
  timerExpired: () => boolean;
  /** `nextTicket`, when present, replaces the stored ticket (fresh next-round deadline). */
  scored: (result: RoundResultEntry, nextTicket?: string) => void;
  advance: () => void;
  fail: (message: string) => void;
  reset: () => void;
  /** Restore a mid-run snapshot; returns none | resumed | expired. */
  tryResume: (gameSlug: string) => 'none' | 'resumed' | 'expired';
}

function saveSnapshot(s: RoundStoreState): void {
  if (!s.ticket || !s.gameSlug) return;
  const snapshot: RunSnapshot = {
    version: 1,
    gameSlug: s.gameSlug,
    runId: s.runId,
    ticket: s.ticket,
    rounds: s.rounds,
    currentIndex: s.currentIndex,
    results: s.results,
    playingDeadline: s.state === 'playing' ? s.deadline : null,
  };
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode: refresh recovery unavailable */
  }
}

export function clearSnapshot(): void {
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

function loadSnapshot(): RunSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as RunSnapshot).version === 1 &&
      Array.isArray((parsed as RunSnapshot).rounds)
    ) {
      return parsed as RunSnapshot;
    }
  } catch {
    /* corrupted snapshot is discarded */
  }
  return null;
}

export const useRoundStore = create<RoundStoreState>((set, get) => ({
  state: 'idle',
  gameSlug: null,
  runId: null,
  ticket: null,
  rounds: [],
  currentIndex: 0,
  results: [],
  deadline: null,
  timeRemainingMs: 0,
  lastError: null,

  dispatch: (event, apply) => {
    const current = get();
    const next = TRANSITIONS[current.state][event];
    if (!next) {
      const msg = `[roundStore] illegal transition: ${event} while ${current.state}`;
      if (import.meta.env.DEV) throw new Error(msg);
      console.warn(msg);
      return false;
    }
    set({ state: next, ...(apply ? apply(current) : {}) });
    saveSnapshot(get());
    return true;
  },

  startRun: ({ gameSlug, runId, ticket, rounds }) => {
    get().dispatch('START_RUN', () => ({
      gameSlug,
      runId,
      ticket,
      rounds,
      currentIndex: 0,
      results: [],
      deadline: null,
      lastError: null,
    }));
  },

  beginRound: () => {
    get().dispatch('BEGIN');
  },

  countdownDone: (timerSeconds) => {
    get().dispatch('COUNTDOWN_DONE', () => ({
      deadline: Date.now() + timerSeconds * 1000,
      timeRemainingMs: timerSeconds * 1000,
    }));
  },

  tick: (now) => {
    const s = get();
    if (s.state !== 'playing' || s.deadline === null) return;
    const remaining = Math.max(0, s.deadline - now);
    set({ timeRemainingMs: remaining });
    if (remaining <= 0) s.timerExpired();
  },

  submit: () => get().dispatch('SUBMIT'),
  timerExpired: () => get().dispatch('TIMER_EXPIRED'),

  scored: (result, nextTicket) => {
    get().dispatch('SCORED', (s) => ({
      results: [...s.results, result],
      deadline: null,
      ...(nextTicket ? { ticket: nextTicket } : {}),
    }));
  },

  advance: () => {
    const s = get();
    if (s.currentIndex + 1 >= s.rounds.length) {
      s.dispatch('RUN_DONE');
      clearSnapshot();
    } else {
      s.dispatch('NEXT_ROUND', () => ({ currentIndex: s.currentIndex + 1 }));
    }
  },

  fail: (message) => {
    get().dispatch('FAIL', () => ({ lastError: message }));
  },

  reset: () => {
    clearSnapshot();
    set({
      state: 'idle',
      gameSlug: null,
      runId: null,
      ticket: null,
      rounds: [],
      currentIndex: 0,
      results: [],
      deadline: null,
      timeRemainingMs: 0,
      lastError: null,
    });
  },

  tryResume: (gameSlug) => {
    const snap = loadSnapshot();
    if (!snap || snap.gameSlug !== gameSlug) return 'none';
    const expired =
      snap.playingDeadline !== null && Date.now() >= snap.playingDeadline;
    set({
      // an expired in-flight round is resolved by the caller (submits a
      // null answer so the server scores it 0), then flow continues (E3).
      state: expired || snap.playingDeadline === null ? 'intro' : 'playing',
      gameSlug: snap.gameSlug,
      runId: snap.runId,
      ticket: snap.ticket,
      rounds: snap.rounds,
      currentIndex: snap.currentIndex,
      results: snap.results,
      deadline: expired ? null : snap.playingDeadline,
      timeRemainingMs:
        !expired && snap.playingDeadline !== null
          ? Math.max(0, snap.playingDeadline - Date.now())
          : 0,
    });
    return expired ? 'expired' : 'resumed';
  },
}));
