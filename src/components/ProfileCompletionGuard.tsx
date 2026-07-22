import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        let active = true;

        // Force disable loading after 1500ms max to guarantee the site never hangs
        const timeoutId = setTimeout(() => {
            if (active) {
                // If it takes this long, the Supabase Auth client is deadlocked.
                // We MUST clear the corrupted local session to unfreeze the app.
                console.warn("[ProfileCompletionGuard] Auth resolution deadlocked. Clearing corrupt session...");
                let cleared = false;
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') && key.includes('-auth-token')) {
                        localStorage.removeItem(key);
                        cleared = true;
                    }
                });
                if (cleared) {
                    window.location.reload();
                } else {
                    setLoading(false);
                }
            }
        }, 1500);

        const checkProfile = async () => {
            try {
                // getSession reads from local storage instantly
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (active) {
                    clearTimeout(timeoutId); // FIX: Prevent the timeout from firing if session resolved!
                    setLoading(false);
                }
            } catch (error) {
                console.error("[ProfileCompletionGuard] Error checking session:", error);
                if (active) {
                    clearTimeout(timeoutId); // FIX: Prevent the timeout from firing on error too!
                    setLoading(false);
                }
            }
        };

        checkProfile();

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Brain className="h-12 w-12 text-primary" />
                    <span className="text-sm text-muted-foreground font-medium">Loading Voke...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
