import { supabase } from './supabase';
import type { MatchSession } from '../hooks/useMatchSession';

/**
 * Call the find_match RPC to join or create a matchmaking session.
 */
export async function findMatch(username: string, gameId: string, questions: any[]): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('find_match', {
    p_username: username,
    p_game_id: gameId,
    p_questions: questions
  });

  if (error) {
    console.error('[PvP] Failed to find match:', error.message);
    return null;
  }

  return data as string;
}

/**
 * Update player ready status in the lobby.
 */
export async function updateMatchReady(matchId: string, username: string, isReady: boolean): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('update_match_ready', {
    p_match_id: matchId,
    p_username: username,
    p_is_ready: isReady
  });

  if (error) {
    console.error('[PvP] Failed to update ready status:', error.message);
  }
}

/**
 * Update score during match.
 */
export async function updateMatchScore(matchId: string, username: string, score: number, round: number): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('update_match_score', {
    p_match_id: matchId,
    p_username: username,
    p_score: score,
    p_round: round
  });

  if (error) {
    console.error('[PvP] Failed to update score:', error.message);
  }
}

/**
 * End match and set winner.
 */
export async function endMatch(matchId: string, winner: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('end_match', {
    p_match_id: matchId,
    p_winner: winner
  });

  if (error) {
    console.error('[PvP] Failed to end match:', error.message);
  }
}

/**
 * Leave or cancel match.
 */
export async function leaveMatch(matchId: string, username: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('leave_match', {
    p_match_id: matchId,
    p_username: username
  });

  if (error) {
    console.error('[PvP] Failed to leave match:', error.message);
  }
}

/**
 * Fetch a match session by ID.
 */
export async function fetchMatchSession(matchId: string): Promise<MatchSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('match_sessions')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('[PvP] Failed to fetch match session:', error.message);
    return null;
  }

  return data as MatchSession;
}
