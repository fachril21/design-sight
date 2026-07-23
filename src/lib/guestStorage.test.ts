import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendGuestRun,
  getOrCreateGuestId,
  loadAccountRuns,
  loadGuestRuns,
  peekGuestId,
  upgradeGuestToAccount,
  type LocalRun,
} from './guestStorage';

const run = (id: string): LocalRun => ({
  id,
  gameSlug: 'dummy',
  mode: 'quick',
  totalScore: 12345,
  roundScores: [1000, 2000, 3000, 3345, 3000],
  completedAt: new Date().toISOString(),
});

describe('guestStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a guest id lazily and keeps it stable', () => {
    expect(peekGuestId()).toBeNull();
    const id = getOrCreateGuestId();
    expect(id).toMatch(/[0-9a-f-]{36}/);
    expect(getOrCreateGuestId()).toBe(id);
  });

  it('round-trips guest runs', () => {
    appendGuestRun(run('a'));
    appendGuestRun(run('b'));
    expect(loadGuestRuns().runs.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('discards corrupted stored JSON instead of crashing (edge case E7)', () => {
    localStorage.setItem('ds_guest_runs', '{not json![');
    expect(loadGuestRuns()).toEqual({ version: 1, runs: [], pendingSync: false });
  });

  it('discards well-formed JSON with the wrong shape', () => {
    localStorage.setItem('ds_guest_runs', JSON.stringify({ version: 99, runs: 'nope' }));
    expect(loadGuestRuns().runs).toEqual([]);
  });

  it('upgrades guest history to an account namespace (Epic 01 AC)', () => {
    getOrCreateGuestId();
    appendGuestRun(run('a'));
    const { migratedRuns } = upgradeGuestToAccount('user-1');
    expect(migratedRuns).toBe(1);
    const account = loadAccountRuns('user-1');
    expect(account.runs.map((r) => r.id)).toEqual(['a']);
    expect(account.pendingSync).toBe(true);
    // guest identity retired
    expect(peekGuestId()).toBeNull();
    expect(loadGuestRuns().runs).toEqual([]);
  });

  it('upgrade is idempotent and a no-op without guest history (edge case E8)', () => {
    const first = upgradeGuestToAccount('user-1');
    expect(first.migratedRuns).toBe(0);
    appendGuestRun(run('a'));
    upgradeGuestToAccount('user-1');
    const again = upgradeGuestToAccount('user-1');
    expect(again.migratedRuns).toBe(0);
    expect(loadAccountRuns('user-1').runs).toHaveLength(1);
  });
});
