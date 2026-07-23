import { handleOptions, json } from '../_shared/cors.ts';
import { adminClient } from '../_shared/context.ts';
import { verifyTicket } from '../_shared/ticket.ts';
import { levelForXp, xpForScore } from '../_shared/scoring.ts';

/**
 * complete-run (Epic 02, decision 3): finalizes an authed run — sums the
 * server-recorded round_results (never a client-reported total), stamps
 * completed_at, and grants XP/levels on the profile. Idempotent: a second
 * call returns the stored totals without granting XP twice.
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { ticket: rawTicket } = (await req.json()) as { ticket?: string };
    if (!rawTicket) return json({ error: 'Bad request' }, 400);

    const ticket = await verifyTicket(rawTicket);
    if (!ticket) return json({ error: 'Invalid ticket' }, 401);
    if (!ticket.runId || !ticket.userId) {
      return json({ error: 'Guest runs are not persisted' }, 400);
    }

    const admin = adminClient();

    const { data: run, error: runErr } = await admin
      .from('runs')
      .select('id, user_id, total_score, completed_at')
      .eq('id', ticket.runId)
      .single();
    if (runErr || !run) return json({ error: 'Run not found' }, 404);
    if (run.user_id !== ticket.userId) return json({ error: 'Not your run' }, 403);

    const { data: profileNow, error: profErr } = await admin
      .from('profiles')
      .select('xp, level')
      .eq('id', ticket.userId)
      .single();
    if (profErr || !profileNow) return json({ error: 'Profile not found' }, 404);

    // Idempotency (plan E6): already finalized -> report stored state.
    if (run.completed_at) {
      return json({
        totalScore: run.total_score,
        xpGained: 0,
        newXp: profileNow.xp,
        newLevel: profileNow.level,
        leveledUp: false,
      });
    }

    const { data: results, error: resErr } = await admin
      .from('round_results')
      .select('score')
      .eq('run_id', ticket.runId);
    if (resErr) throw resErr;

    const totalScore = (results ?? []).reduce((sum, r) => sum + r.score, 0);
    const xpGained = xpForScore(totalScore);
    const newXp = profileNow.xp + xpGained;
    const newLevel = levelForXp(newXp);
    const leveledUp = newLevel > profileNow.level;

    const { error: updRunErr } = await admin
      .from('runs')
      .update({ total_score: totalScore, completed_at: new Date().toISOString() })
      .eq('id', ticket.runId)
      .is('completed_at', null);
    if (updRunErr) throw updRunErr;

    const { error: updProfErr } = await admin
      .from('profiles')
      .update({ xp: newXp, level: newLevel })
      .eq('id', ticket.userId);
    if (updProfErr) throw updProfErr;

    return json({ totalScore, xpGained, newXp, newLevel, leveledUp });
  } catch (err) {
    console.error('[complete-run]', err);
    return json({ error: 'Internal error' }, 500);
  }
});
