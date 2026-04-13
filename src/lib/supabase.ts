import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[DesignSight] Supabase credentials missing. ' +
    'Leaderboard features will be unavailable. ' +
    'Copy .env.example to .env and fill in your Supabase project keys.'
  );
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ── Types ──────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  username: string;
  user_tag: string;
  full_username: string;
  score: number;
  streak_best: number;
  accuracy: number;
  questions_answered: number;
  game_id: string;
  created_at: string;
}

export interface LeaderboardInsert {
  username: string;
  user_tag: string;
  score: number;
  streak_best: number;
  accuracy: number;
  questions_answered: number;
  game_id?: string;
}

// ── API Helpers ────────────────────────────────────────

/**
 * Submit a score to the global leaderboard.
 * Returns the inserted row or null on failure.
 */
export async function submitScore(entry: LeaderboardInsert): Promise<LeaderboardEntry | null> {
  if (!supabase) {
    console.warn('[DesignSight] Supabase not configured – score not submitted.');
    return null;
  }

  const gameId = entry.game_id ?? 'contrast-checker';

  // 1. Check for existing score for this user
  const { data: existingData, error: fetchError } = await supabase
    .from('leaderboard')
    .select('id, score')
    .eq('game_id', gameId)
    .eq('username', entry.username)
    .eq('user_tag', entry.user_tag)
    .order('score', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('[DesignSight] Failed to check existing score:', fetchError.message);
    return null;
  }

  const existingEntry = existingData?.[0];

  // 2. If user already has a score on the leaderboard
  if (existingEntry) {
    if (entry.score > existingEntry.score) {
      // New high score -> update it
      const { data, error } = await supabase
        .from('leaderboard')
        .update({
          score: entry.score,
          streak_best: entry.streak_best,
          accuracy: entry.accuracy,
          questions_answered: entry.questions_answered,
          created_at: new Date().toISOString(), // Update timestamp
        })
        .eq('id', existingEntry.id)
        .select()
        .single();
        
      if (error) {
        console.error('[DesignSight] Failed to update high score:', error.message);
        return null;
      }
      
      // Attempt cleanup of any duplicated rows in the background
      supabase
        .from('leaderboard')
        .delete()
        .eq('game_id', gameId)
        .eq('username', entry.username)
        .eq('user_tag', entry.user_tag)
        .neq('id', existingEntry.id)
        .then();
        
      return data as LeaderboardEntry;
    } else {
      // Score is lower or equal, don't update
      return null;
    }
  }

  // 3. No existing score -> insert new row
  const { data, error } = await supabase
    .from('leaderboard')
    .insert({
      ...entry,
      game_id: gameId,
    })
    .select()
    .single();

  if (error) {
    console.error('[DesignSight] Failed to submit score:', error.message);
    return null;
  }

  return data as LeaderboardEntry;
}

/**
 * Fetch top scores from the leaderboard.
 */
export async function fetchLeaderboard(
  options: {
    gameId?: string;
    limit?: number;
    offset?: number;
    since?: Date;
  } = {}
): Promise<{ data: LeaderboardEntry[]; count: number | null }> {
  if (!supabase) {
    return { data: [], count: 0 };
  }

  const {
    gameId = 'contrast-checker',
    limit = 20,
    offset = 0,
    since,
  } = options;

  let query = supabase
    .from('leaderboard')
    .select('*', { count: 'exact' })
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[DesignSight] Failed to fetch leaderboard:', error.message);
    return { data: [], count: 0 };
  }

  return { data: (data ?? []) as LeaderboardEntry[], count };
}
