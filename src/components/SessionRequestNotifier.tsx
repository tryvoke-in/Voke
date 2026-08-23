import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const SessionRequestNotifier = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let channel: any = null;

    const checkUserAndSubscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !active) return;

      channel = supabase
        .channel('global_requests')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'peer_interview_sessions',
            filter: `host_user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const newData = payload.new;
            const oldData = payload.old;

            // Check if status changed to 'pending' (New Request)
            if (newData.status === 'pending' && oldData.status !== 'pending') {
              toast.info("New Session Request!", {
                description: "Someone requested to join your session.",
                action: {
                  label: "View",
                  onClick: () => navigate("/peer-interviews?tab=upcoming"),
                },
              });
            }
          }
        )
        .subscribe();
    };

    checkUserAndSubscribe();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate]);

  return null;
};
