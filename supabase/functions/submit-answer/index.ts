import { handleOptions, json } from '../_shared/cors.ts';
import { adminClient } from '../_shared/context.ts';
import { verifyTicket } from '../_shared/ticket.ts';
import { exponentialFalloff, tierForScore } from '../_shared/scoring.ts';

/**
 * submit-answer (Epic 02, decision 3): the referee. Verifies the signed
 * ticket, enforces the submission window with the SERVER clock (client
 * timing is display-only, plan E8), re-validates the answer shape (E7),
 * scores against truth, persists idempotently (E6), and only then
 * reveals truth to the client.
 */
const GRACE_MS = 2000;

type Scorer = (truth: unknown, answer: unknown) => number;

const SCORERS: Record<string, Scorer> = {
  dummy: (truth, answer) => {
    const t = truth as { width?: unknown };
    const a = answer as { width?: unknown } | null;
    if (typeof t?.width !== 'number') return 0;
    if (typeof a?.width !== 'number' || !Number.isFinite(a.width)) return 0;
    return exponentialFalloff(Math.abs(a.width - t.width), 2, 40);
  },
};

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const body = (await req.json()) as {
      ticket?: string;
      roundNo?: number;
      roundId?: string;
      answer?: unknown;
      clientTimeMs?: number;
    };
    if (!body.ticket || typeof body.roundNo !== 'number' || !body.roundId) {
      return json({ error: 'Bad request' }, 400);
    }

    const ticket = await verifyTicket(body.ticket);
    if (!ticket) return json({ error: 'Invalid ticket' }, 401);

    const idx = body.roundNo - 1;
    if (idx < 0 || idx >= ticket.roundIds.length || ticket.roundIds[idx] !== body.roundId) {
      return json({ error: 'Round mismatch' }, 400);
    }

    const admin = adminClient();
    const { data: round, error: roundErr } = await admin
      .from('rounds')
      .select('id, truth, game_id, games!inner(slug)')
      .eq('id', body.roundId)
      .single();
    if (roundErr || !round) return json({ error: 'Round not found' }, 404);

    const slug = (round as unknown as { games: { slug: string } }).games.slug;
    const scorer = SCORERS[slug];
    if (!scorer) return json({ error: 'No scorer for game' }, 500);

    // Window check on the server clock only.
    const deadline = ticket.deadlines[idx] ?? 0;
    const late = Date.now() > deadline + GRACE_MS;
    const score = late ? 0 : scorer(round.truth, body.answer ?? null);
    const tier = tierForScore(score);

    // Persist for authed runs; PK (run_id, round_no) makes retries
    // idempotent — a duplicate submit returns the ORIGINAL score.
    if (ticket.runId && ticket.userId) {
      const timeMs = Math.max(0, Math.min(600_000, body.clientTimeMs ?? 0));
      const { error: insertErr } = await admin.from('round_results').insert({
        run_id: ticket.runId,
        round_no: body.roundNo,
        round_id: body.roundId,
        answer: body.answer ?? null,
        score,
        time_ms: timeMs,
      });
      if (insertErr) {
        if (insertErr.code === '23505') {
          const { data: existing } = await admin
            .from('round_results')
            .select('score')
            .eq('run_id', ticket.runId)
            .eq('round_no', body.roundNo)
            .single();
          const original = existing?.score ?? 0;
          return json({
            score: original,
            tier: tierForScore(original),
            truth: round.truth,
            duplicate: true,
          });
        }
        throw insertErr;
      }
    }

    return json({ score, tier, truth: round.truth, ...(late ? { late: true } : {}) });
  } catch (err) {
    console.error('[submit-answer]', err);
    return json({ error: 'Internal error' }, 500);
  }
});
