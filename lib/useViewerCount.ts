'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const CHANNEL_NAME = 'presence:klumit-ecom';

export function useViewerCount() {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupPresence = async () => {
      try {
        channel = supabase.channel(CHANNEL_NAME, {
          config: { presence: { key: crypto.randomUUID() } },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel!.presenceState();
            const count = Object.keys(state).length;
            setViewerCount(count);
          })
          .subscribe(async (status, err) => {
            if (err) {
              // Silently fail - don't spam console
              return;
            }
            if (status === 'SUBSCRIBED') {
              await channel!.track({ online_at: new Date().toISOString() });
            }
          });
      } catch {
        // Supabase connection failed - silently ignore
      }
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  return viewerCount;
}


