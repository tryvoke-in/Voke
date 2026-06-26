import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const location = useLocation();

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
