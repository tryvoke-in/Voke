import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const SessionRequestNotifier = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndSubscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const channel = supabase
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
            
            // Check if status changed to 'scheduled' (Request Approved) - for Guest?
            // This listener is filtered by host_user_id, so it only notifies the host.
            // We could add another listener for the guest if needed, but the host is the one who needs to act.
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    checkUserAndSubscribe();
  }, [navigate]);

  return null;
};
