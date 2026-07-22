import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";

export const AnalyticsTracker = () => {
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  const enterTimeRef = useRef(Date.now());

  // 1. Track page views on location change and log previous page duration
  useEffect(() => {
    // Track new page view
    trackEvent("page_view", location.pathname, {
      search: location.search,
      hash: location.hash,
    });

    const prevPath = currentPathRef.current;
    const prevEnterTime = enterTimeRef.current;

    // Update refs for the current page
    currentPathRef.current = location.pathname;
    enterTimeRef.current = Date.now();

    // Log the page leave and duration for the previous page
    if (prevPath !== location.pathname) {
      const durationMs = Date.now() - prevEnterTime;
      trackEvent("page_leave", prevPath, {
        duration_ms: durationMs,
        duration_seconds: Math.round(durationMs / 1000),
      });
    }
  }, [location.pathname, location.search, location.hash]);

  // Handle page leave on window unload or visibility change (minimized/background)
  useEffect(() => {
    const handleLeave = () => {
      const durationMs = Date.now() - enterTimeRef.current;
      // Only track significant visits (e.g. > 1 second)
      if (durationMs > 1000) {
        trackEvent("page_leave", currentPathRef.current, {
          duration_ms: durationMs,
          duration_seconds: Math.round(durationMs / 1000),
          closed_or_hidden: true,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleLeave();
      } else {
        // Reset enter time when user returns/focuses back
        enterTimeRef.current = Date.now();
      }
    };

    window.addEventListener("beforeunload", handleLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
