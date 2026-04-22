import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MatchSession {
  id: string;
  game_id: string;
  player1: string;
  player2: string | null;
  player1_score: number;
  player2_score: number;
  player1_ready: boolean;
  player2_ready: boolean;
  status: string;
  questions: any;
  current_round: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export const useMatchSession = (matchId: string) => {
  const [match, setMatch] = useState<MatchSession | null>(null);

  useEffect(() => {
    if (!matchId) return;

    // Fetch initial state
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('match_sessions')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (data && !error) {
        setMatch(data as MatchSession);
      }
    };

    fetchMatch();

    // Subscribe to updates
    const channel = supabase.channel(`match:${matchId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'match_sessions',
        filter: `id=eq.${matchId}` 
      }, (payload) => {
        setMatch(payload.new as MatchSession);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return match;
};
