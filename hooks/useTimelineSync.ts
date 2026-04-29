import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface TimelineState {
  presentX: number;
  lastActivityId: string | null;
  timestamp: number;
}

export const useTimelineSync = (channelId: string = 'global-timeline') => {
  const [remoteState, setRemoteState] = useState<TimelineState | null>(null);

  useEffect(() => {
    // Sottoscrizione al canale Realtime
    const channel = supabase.channel(channelId, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        console.log('Ricevuto aggiornamento remoto:', payload);
        setRemoteState(payload);
      })
      .subscribe((status) => {
        console.log(`Stato canale Realtime (${channelId}):`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const broadcastUpdate = (state: TimelineState) => {
    supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'sync',
      payload: state,
    });
  };

  return { remoteState, broadcastUpdate };
};
