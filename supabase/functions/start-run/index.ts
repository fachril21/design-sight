import { handleOptions, json } from '../_shared/cors.ts';
import { adminClient, resolveGuestId, resolveUserId } from '../_shared/context.ts';
import { signTicket, type RunTicket } from '../_shared/ticket.ts';

/**
 * start-run (Epic 02, decision 3): picks/generates rounds, creates the runs
 * row for authed users, and returns ONLY client-safe payloads plus a signed
 * ticket with server-computed deadlines. Truth stays in the rounds table.
 */
const ROUNDS_PER_RUN = 5;
/** Per-round wall-clock allowance: play timer + reveal/interstitial buffer. */
const INTERSTITIAL_BUFFER_S = 45;

interface GameSpec {
  timerSeconds: number;
  procedural: boolean;
}

const GAME_SPECS: Record<string, GameSpec> = {
  dummy: { timerSeconds: 15, procedural: true },
  'kern-duel': { timerSeconds: 30, procedural: false },
  'contrast-call': { timerSeconds: 15, procedural: false },
  'color-match': { timerSeconds: 20, procedural: true },
  'type-snob': { timerSeconds: 15, procedural: false },
};

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { gameSlug } = (await req.json()) as { gameSlug?: string };
    const spec = gameSlug ? GAME_SPECS[gameSlug] : undefined;
    if (!gameSlug || !spec) return json({ error: 'Unknown game' }, 400);

    const admin = adminClient();
    const userId = await resolveUserId(req, admin);
    const guestId = resolveGuestId(req);
    if (!userId && !guestId) return json({ error: 'No identity' }, 401);

    // Resolve (or lazily create, for the dummy game) the games row.
    let { data: game } = await admin
      .from('games')
      .select('id, slug, config')
      .eq('slug', gameSlug)
      .maybeSingle();
    if (!game && gameSlug === 'dummy') {
      const inserted = await admin
        .from('games')
        .insert({ slug: 'dummy', name: 'Pixel Guess', is_active: false })
        .select('id, slug, config')
        .single();
      game = inserted.data;
    }
    if (!game) return json({ error: 'Game not found' }, 404);

    // Collect rounds: procedural games generate + insert; authored games
    // sample existing active rounds (reusing if content is short, E9).
    let roundRows: Array<{ id: string; payload: unknown }> = [];
    if (gameSlug === 'dummy') {
      const generated = Array.from({ length: ROUNDS_PER_RUN }, () => {
        const width = 60 + Math.floor(Math.random() * 240);
        return { game_id: game.id, payload: { barWidth: width }, truth: { width } };
      });
      const { data, error } = await admin
        .from('rounds')
        .insert(generated)
        .select('id, payload');
      if (error) throw error;
      roundRows = data ?? [];
    } else {
      const { data, error } = await admin
        .from('rounds')
        .select('id, payload')
        .eq('game_id', game.id)
        .eq('is_active', true)
        .limit(50);
      if (error) throw error;
      const pool = data ?? [];
      if (pool.length === 0) return json({ error: 'No rounds available' }, 409);
      const shuffled = pool.sort(() => Math.random() - 0.5);
      for (let i = 0; i < ROUNDS_PER_RUN; i++) {
        roundRows.push(shuffled[i % shuffled.length]);
      }
    }

    const roundIds = roundRows.map((r) => r.id);

    // Authed users get a persisted run; guest runs stay client-side.
    let runId: string | null = null;
    if (userId) {
      const { data: run, error } = await admin
        .from('runs')
        .insert({ user_id: userId, mode: 'quick', round_ids: roundIds })
        .select('id')
        .single();
      if (error) throw error;
      runId = run.id;
    }

    // Server-clock deadlines: cumulative schedule bounds the whole run
    // (submissions past a deadline score 0 — PRD 8.4).
    const iat = Date.now();
    const perRoundMs = (spec.timerSeconds + INTERSTITIAL_BUFFER_S) * 1000;
    const deadlines = roundIds.map((_, i) => iat + (i + 1) * perRoundMs);

    const ticket: RunTicket = {
      v: 1, runId, userId, guestId, gameSlug, roundIds, deadlines, iat,
    };

    return json({
      runId,
      ticket: await signTicket(ticket),
      rounds: roundRows.map((r, i) => ({
        roundId: r.id,
        roundNo: i + 1,
        gameSlug,
        timerSeconds: spec.timerSeconds,
        payload: r.payload,
      })),
    });
  } catch (err) {
    console.error('[start-run]', err);
    return json({ error: 'Internal error' }, 500);
  }
});
