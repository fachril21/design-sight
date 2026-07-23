import { describe, expect, it } from 'vitest';
import { createReferee } from './referee';
import type { ClientRound, StartRunResponse } from './refereeTypes';

/**
 * Payload-purity guard (Epic 02 AC 2): truth data must be verifiably
 * absent from everything the client receives before submission.
 * Runtime check here covers the offline referee; the same JSON contract
 * is what the Edge Functions return (shared ClientRound type), and the
 * type-level assertions below make a `truth` field unrepresentable.
 */

// Type-level: ClientRound must not admit a `truth` key.
type HasTruth<T> = 'truth' extends keyof T ? true : false;
const clientRoundHasNoTruth: HasTruth<ClientRound> extends false ? true : never = true;
const startRunHasNoTruth: HasTruth<StartRunResponse> extends false ? true : never = true;

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((v) => collectKeys(v, keys));
  } else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      keys.add(k);
      collectKeys(v, keys);
    }
  }
  return keys;
}

describe('payload purity (PRD 8.4)', () => {
  it('type-level guards hold', () => {
    expect(clientRoundHasNoTruth).toBe(true);
    expect(startRunHasNoTruth).toBe(true);
  });

  it('startRun responses contain no truth-like keys anywhere', async () => {
    const referee = createReferee(); // offline in test env (no supabase env)
    const res = await referee.startRun('dummy');
    const keys = collectKeys(res);
    expect(keys.has('truth')).toBe(false);
    expect(keys.has('reference')).toBe(false);
    expect(keys.has('solution')).toBe(false);
    expect(res.rounds).toHaveLength(5);
  });

  it('truth is only revealed by submitAnswer, after submission', async () => {
    const referee = createReferee();
    const res = await referee.startRun('dummy');
    const round = res.rounds[0];
    expect(round).toBeDefined();
    if (!round) return;
    const result = await referee.submitAnswer({
      ticket: res.ticket,
      roundNo: round.roundNo,
      roundId: round.roundId,
      answer: { width: 100 },
      clientTimeMs: 1000,
    });
    expect(result.truth).not.toBeNull();
    expect(typeof result.score).toBe('number');
  });

  it('malformed answers score 0 instead of crashing (E7)', async () => {
    const referee = createReferee();
    const res = await referee.startRun('dummy');
    const round = res.rounds[0];
    if (!round) return;
    const result = await referee.submitAnswer({
      ticket: res.ticket,
      roundNo: round.roundNo,
      roundId: round.roundId,
      answer: { width: 'not-a-number' },
      clientTimeMs: 0,
    });
    expect(result.score).toBe(0);
  });
});
