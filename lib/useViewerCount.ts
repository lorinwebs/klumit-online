'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const CHANNEL_NAME = 'presence:klumit-ecom';
const PRESENCE_TIMEOUT = 15000; // 15 seconds - אם מישהו לא עדכן במשך 15 שניות, הוא לא נספר

// קבלת או יצירת session ID ייחודי לכל טאב
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const storageKey = 'klumit-viewer-session';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

export function useViewerCount() {
  const [viewerCount, setViewerCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let cleanupInterval: NodeJS.Timeout | null = null;

    const setupPresence = async () => {
      try {
        const sessionId = getSessionId();
        
        channel = supabase.channel(CHANNEL_NAME, {
          config: { 
            presence: { 
              key: sessionId,
            } 
          },
        });

        const updatePresence = async () => {
          if (channel) {
            await channel.track({ 
              online_at: new Date().toISOString(),
              session_id: sessionId,
            });
          }
        };

        const calculateActiveUsers = () => {
          if (!channel) return 0;
          
          const state = channel.presenceState();
          const now = Date.now();
          
          // סופרים רק משתמשים שפעילים (עדכנו את ה-presence ב-15 שניות האחרונות)
          const activeUsers = Object.entries(state).filter(([key, presences]) => {
            if (!Array.isArray(presences) || presences.length === 0) return false;
            
            // לוקחים את ה-presence האחרון (הכי עדכני)
            const lastPresence = presences[presences.length - 1] as { online_at?: string; session_id?: string };
            if (!lastPresence.online_at) return false;
            
            const lastSeen = new Date(lastPresence.online_at).getTime();
            const timeSinceLastSeen = now - lastSeen;
            
            // רק משתמשים שעדכנו ב-15 שניות האחרונות
            return timeSinceLastSeen < PRESENCE_TIMEOUT;
          });
          
          return activeUsers.length;
        };

        channel
          .on('presence', { event: 'sync' }, () => {
            const count = calculateActiveUsers();
            setViewerCount(count);
            setIsInitialized(true);
          })
          .on('presence', { event: 'join' }, () => {
            const count = calculateActiveUsers();
            setViewerCount(count);
            setIsInitialized(true);
          })
          .on('presence', { event: 'leave' }, () => {
            const count = calculateActiveUsers();
            setViewerCount(count);
            setIsInitialized(true);
          })
          .subscribe(async (status, err) => {
            if (err) {
              // Silently fail - don't spam console
              return;
            }
            if (status === 'SUBSCRIBED') {
              await updatePresence();
              
              // מחשב את הספירה מיד אחרי ההתחברות (אחרי 2 שניות כדי לתת זמן לחיבורים ישנים להתנקות)
              setTimeout(() => {
                const count = calculateActiveUsers();
                setViewerCount(count);
                setIsInitialized(true);
              }, 2000);
              
              // Heartbeat - מעדכן כל 5 שניות שהמשתמש עדיין פעיל
              heartbeatInterval = setInterval(async () => {
                await updatePresence();
                // גם מחשב מחדש את הספירה אחרי כל עדכון
                const count = calculateActiveUsers();
                setViewerCount(count);
                setIsInitialized(true);
              }, 5000);
              
              // ניקוי תקופתי של חיבורים ישנים - כל 2 שניות
              cleanupInterval = setInterval(() => {
                const count = calculateActiveUsers();
                setViewerCount(count);
                setIsInitialized(true);
              }, 2000);
            }
          });
      } catch {
        // Supabase connection failed - silently ignore
      }
    };

    setupPresence();

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // מציג 0 עד שהמערכת מאותחלת וסופרת רק משתמשים פעילים
  return isInitialized ? viewerCount : 0;
}


