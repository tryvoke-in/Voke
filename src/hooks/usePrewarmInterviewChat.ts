import { useEffect } from 'react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

export function usePrewarmInterviewChat() {
  useEffect(() => {
    const ping = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${SUPABASE_URL}/functions/v1/interview-chat`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token || anonKey}` 
          },
          body: JSON.stringify({ type: 'ping' })
        });
        console.log('[usePrewarm] Pre-warmed interview-chat edge function.');
      } catch (e) {}
    };
    ping();
  }, []);
}
