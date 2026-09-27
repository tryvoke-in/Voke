import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VokeLoader } from "@/components/ui/VokeLoader";

export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const isSSR = typeof window === "undefined";
    const isPublicPage = [
        "/", "/auth", "/pricing", "/companies", "/dsa-sheet", "/question-practice",
        "/daily-challenge", "/elite-prep", "/curriculum-gap", "/skill-india", "/community", "/leaderboard",
        "/help", "/privacy", "/about", "/terms", "/contact", "/waitlist"
    ].includes(location.pathname) || location.pathname.startsWith("/companies/") || location.pathname.startsWith("/blog");

    const [loading, setLoading] = useState(!isSSR && !isPublicPage);

    useEffect(() => {
        let active = true;

        // Force disable loading after 1.2 seconds max to guarantee the site never hangs
        const timeoutId = setTimeout(() => {
            if (active) {
                console.warn("[ProfileCompletionGuard] Auth resolution timed out, bypassing loading screen.");
                setLoading(false);
            }
        }, 1200);

        const checkProfile = async () => {
            try {
                // getSession reads from local storage instantly
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (active) {
                    setLoading(false);
                }
            } catch (error) {
                console.error("[ProfileCompletionGuard] Error checking session:", error);
                if (active) {
                    setLoading(false);
                }
            }
        };

        checkProfile();

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, [location.pathname]);

    if (loading) {
        return <VokeLoader message="Loading Voke..." submessage="Initializing your experience" />;
    }

    return <>{children}</>;
};
