import { useState } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';

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

  useRealtimeSubscription(`match:${matchId}`, 'UPDATE', (payload) => {
    if (payload.new && payload.new.id === matchId) {
      setMatch(payload.new as MatchSession);
    }
  });

  return match;
};
