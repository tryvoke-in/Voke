import { supabase } from "@/integrations/supabase/client";

// In-memory session ID.
// This is cleared whenever the tab/page is closed or fully reloaded,
// starting a fresh "Visit" session. It persists across client-side router navigation.
let memorySessionId: string | null = null;

const getSessionId = (): string => {
  if (!memorySessionId) {
    const randPart = () => Math.random().toString(36).substring(2, 15);
    memorySessionId = `${randPart()}-${randPart()}-${Date.now()}`;
  }
  return memorySessionId;
};

const getUserLocation = async () => {
  try {
    const cached = localStorage.getItem('voke_user_location');
    if (cached) return JSON.parse(cached);
    
    // Using ipapi.co for free IP geolocation (city, country_name)
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data && data.city && data.country_name) {
      const loc = { city: data.city, country: data.country_name };
      localStorage.setItem('voke_user_location', JSON.stringify(loc));
      return loc;
    }
    return null;
  } catch (e) {
    console.warn('Could not fetch user location:', e);
    return null;
  }
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
    
    const location = await getUserLocation();
    const finalActionDetails = {
      ...actionDetails,
      ...(location ? { ip_city: location.city, ip_country: location.country } : {})
    };

    const { error } = await supabase.functions.invoke("track-analytics", {
      body: {
        user_id: userId,
        user_email: userEmail,
        session_id: sessionId,
        event_type: eventType,
        page_path: pagePath,
        action_details: finalActionDetails,
        user_agent: userAgent,
      }
    });

    if (error) {
      console.warn("Failed to insert user activity log:", error.message);
    }
  } catch (err) {
    console.error("Error tracking event:", err);
  }
};
