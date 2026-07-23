import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SNAPSHOT_KEY, clearSnapshot, useRoundStore } from './roundStore';
import type { ClientRound } from '@/lib/refereeTypes';

const rounds: ClientRound[] = Array.from({ length: 3 }, (_, i) => ({
  roundId: `r${i + 1}`,
  roundNo: i + 1,
  gameSlug: 'dummy',
  timerSeconds: 15,
  payload: { barWidth: 100 + i },
}));

const startArgs = { gameSlug: 'dummy', runId: null, ticket: 't1', rounds };

function store() {
  return useRoundStore.getState();
}

describe('roundStore state machine (Epic 02 AC 3)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    store().reset();
  });

  it('runs the full happy-path rhythm through all rounds', () => {
    store().startRun(startArgs);
    expect(store().state).toBe('intro');
    for (let i = 0; i < rounds.length; i++) {
      store().beginRound();
      expect(store().state).toBe('countdown');
      store().countdownDone(15);
      expect(store().state).toBe('playing');
      expect(store().deadline).not.toBeNull();
      store().submit();
      expect(store().state).toBe('scoring');
      store().scored({ roundNo: i + 1, answer: { width: 1 }, score: 4000, tier: 'GREAT', truth: { width: 2 } });
      expect(store().state).toBe('reveal');
      store().advance();
    }
    expect(store().state).toBe('complete');
    expect(store().results).toHaveLength(3);
  });

  it('fires TIMER_EXPIRED exactly once when the deadline passes (E1)', () => {
    store().startRun(startArgs);
    store().beginRound();
    store().countdownDone(15);
    const deadline = store().deadline;
    expect(deadline).not.toBeNull();
    store().tick((deadline ?? 0) - 1000);
    expect(store().state).toBe('playing');
    expect(store().timeRemainingMs).toBe(1000);
    store().tick(deadline ?? 0);
    expect(store().state).toBe('scoring');
    // a straggler tick after expiry must not throw or double-fire
    store().tick((deadline ?? 0) + 500);
    expect(store().state).toBe('scoring');
  });

  it('throws on illegal transitions in dev (E16)', () => {
    expect(store().state).toBe('idle');
    expect(() => store().scored({ roundNo: 1, answer: null, score: 0, tier: 'ROUGH', truth: null })).toThrow(
      /illegal transition/,
    );
  });

  it('submit after expiry is rejected (playing -> scoring already happened)', () => {
    store().startRun(startArgs);
    store().beginRound();
    store().countdownDone(15);
    store().tick((store().deadline ?? 0) + 1);
    expect(store().state).toBe('scoring');
    expect(() => store().submit()).toThrow(/illegal transition/);
  });

  it('persists a snapshot and resumes mid-round with remaining time (E3)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    store().startRun(startArgs);
    store().beginRound();
    store().countdownDone(15);
    expect(sessionStorage.getItem(SNAPSHOT_KEY)).not.toBeNull();

    // simulate refresh: fresh store state, resume from snapshot
    useRoundStore.setState({ state: 'idle', rounds: [], ticket: null });
    vi.setSystemTime(1_000_000 + 5_000);
    const resume = store().tryResume('dummy');
    expect(resume).toBe('resumed');
    expect(store().state).toBe('playing');
    expect(store().timeRemainingMs).toBeGreaterThan(9_000);
    expect(store().timeRemainingMs).toBeLessThanOrEqual(10_000);
    vi.useRealTimers();
  });

  it('resume after the deadline reports expired and re-enters at intro (E3)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    store().startRun(startArgs);
    store().beginRound();
    store().countdownDone(15);

    useRoundStore.setState({ state: 'idle', rounds: [], ticket: null });
    vi.setSystemTime(1_000_000 + 60_000);
    expect(store().tryResume('dummy')).toBe('expired');
    expect(store().state).toBe('intro');
    vi.useRealTimers();
  });

  it('resume ignores snapshots for a different game', () => {
    store().startRun(startArgs);
    useRoundStore.setState({ state: 'idle' });
    expect(store().tryResume('kern-duel')).toBe('none');
  });

  it('resume ignores corrupted snapshots (E7)', () => {
    sessionStorage.setItem(SNAPSHOT_KEY, '{broken');
    expect(store().tryResume('dummy')).toBe('none');
  });

  it('clears the snapshot when the run completes', () => {
    store().startRun(startArgs);
    store().beginRound();
    store().countdownDone(15);
    store().submit();
    store().scored({ roundNo: 1, answer: null, score: 0, tier: 'ROUGH', truth: null });
    useRoundStore.setState({ currentIndex: rounds.length - 1 });
    store().advance();
    expect(store().state).toBe('complete');
    expect(sessionStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    clearSnapshot();
  });
});
