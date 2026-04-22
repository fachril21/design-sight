import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) {
      setStatus('disconnected');
      return;
    }

    const checkConnection = () => {
      const start = Date.now();
      const channel = supabase.channel(`ping-${start}`);
      
      let isIntentionalClose = false;
      
      channel.subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          const end = Date.now();
          setLatency(end - start);
          setStatus('connected');
          isIntentionalClose = true;
          supabase.removeChannel(channel);
        } else if ((subStatus === 'CLOSED' && !isIntentionalClose) || subStatus === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });
    };

    // Initial check
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
      <span className="flex items-center justify-center w-2 h-2 rounded-full relative">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
          status === 'connected' ? 'bg-green-400 animate-ping' : 
          status === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          status === 'connected' ? 'bg-green-500' : 
          status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></span>
      </span>
      {status === 'connected' && latency !== null ? (
        <span>{latency}ms</span>
      ) : (
        <span className="capitalize">{status}</span>
      )}
    </div>
  );
};
