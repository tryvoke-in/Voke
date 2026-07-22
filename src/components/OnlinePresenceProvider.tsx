import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnlineUser {
  user_id: string;
  online_at: string;
}

interface OnlinePresenceContextType {
  onlineUsers: Set<string>;
}

const OnlinePresenceContext = createContext<OnlinePresenceContextType>({
  onlineUsers: new Set(),
});

export const useOnlinePresence = () => useContext(OnlinePresenceContext);

export const OnlinePresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    const channel = supabase.channel('global_presence', {
      config: {
        presence: {
          key: 'user',
        },
      },
    });

    const initPresence = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        const user = session?.user;

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const users = new Set<string>();
            
            Object.values(state).forEach((presences: any) => {
              presences.forEach((presence: any) => {
                if (presence.user_id) {
                  users.add(presence.user_id);
                }
              });
            });
            
            setOnlineUsers(users);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('join', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('leave', key, leftPresences);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && user) {
              await channel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
            }
          });
      } catch (err) {
        console.error("Error setting up global presence:", err);
      }
    };

    initPresence();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <OnlinePresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </OnlinePresenceContext.Provider>
  );
};
