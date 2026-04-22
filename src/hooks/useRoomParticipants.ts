import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface RoomParticipant {
  room_id: string;
  username: string;
  score: number;
  answers: any;
  joined_at: string;
}

export const useRoomParticipants = (roomId: string) => {
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);

  const fetchParticipants = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false });
      
    if (!error && data) {
      setParticipants(data as RoomParticipant[]);
    }
  }, [roomId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useRealtimeSubscription(`room:${roomId}`, '*', () => {
    fetchParticipants();
  });

  return participants;
};
