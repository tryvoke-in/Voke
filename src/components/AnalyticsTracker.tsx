import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";

export const AnalyticsTracker = () => {
  const location = useLocation();

  // 1. Track page views on location change
  useEffect(() => {
    trackEvent("page_view", location.pathname, {
      search: location.search,
      hash: location.hash,
    });
  }, [location.pathname, location.search, location.hash]);

  // 2. Track auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        trackEvent("auth_login", location.pathname, {
          email: session?.user?.email,
          user_id: session?.user?.id,
        });
      } else if (event === "SIGNED_OUT") {
        trackEvent("auth_logout", location.pathname);
      } else if (event === "USER_UPDATED") {
        trackEvent("auth_user_update", location.pathname, {
          email: session?.user?.email,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  return null; // This component doesn't render any UI
};

export default AnalyticsTracker;
