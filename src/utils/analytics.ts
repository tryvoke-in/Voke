import { supabase } from "@/integrations/supabase/client";

// Safe, fallback-friendly session generator
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("voke_analytics_session_id");
  if (!sessionId) {
    // Generate simple random string that looks like a unique identifier
    const randPart = () => Math.random().toString(36).substring(2, 15);
    sessionId = `${randPart()}-${randPart()}-${Date.now()}`;
    sessionStorage.setItem("voke_analytics_session_id", sessionId);
  }
  return sessionId;
};

/**
 * Tracks a user activity event in the database.
 * 
 * @param eventType Type of event (e.g. 'page_view', 'click_cta', 'auth_login')
 * @param pagePath The path where the event happened (e.g. '/pricing')
 * @param actionDetails Additional JSON payload with event-specific info
 */
export const trackEvent = async (
  eventType: string,
  pagePath: string = window.location.pathname,
  actionDetails: Record<string, any> = {}
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;
    const userEmail = session?.user?.email || null;
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;

    const { error } = await supabase.from("user_activities").insert({
      user_id: userId,
      user_email: userEmail,
      session_id: sessionId,
      event_type: eventType,
      page_path: pagePath,
      action_details: actionDetails,
      user_agent: userAgent,
    });

    if (error) {
      console.warn("Failed to insert user activity log:", error.message);
    }
  } catch (err) {
    console.error("Error tracking event:", err);
  }
};
