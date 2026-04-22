import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeSubscription = (channelName: string, event: string, callback: (payload: any) => void) => {
  useEffect(() => {
    if (!supabase) return;

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes' as any, { event, schema: 'public' }, callback)
      .subscribe();
  
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channelName, event, callback]);
};
