import { Button } from "@/components/ui/button";
import { Zap, Crown } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const UpgradeButton = () => {
    const navigate = useNavigate();
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        const updatePremiumStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsPremium(!!user?.user_metadata?.is_premium);
        };

        updatePremiumStatus();

        // Listen for auth state changes to dynamically update status
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Fetch fresh user data to avoid stale session cache overrides
            const { data: { user } } = await supabase.auth.getUser();
            setIsPremium(!!user?.user_metadata?.is_premium);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (isPremium) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400/30"
            >
                <Crown className="w-3.5 h-3.5 fill-white animate-pulse" />
                <span>Voke Elite</span>
            </motion.div>
        );
    }

    return (
        <Button 
            size="sm" 
            onClick={() => navigate('/pricing')}
            className="hidden sm:flex relative overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 group"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
                <Zap className="w-3.5 h-3.5 mr-2 fill-white" />
            </motion.div>
            <span className="relative font-semibold tracking-wide">Voke Elite</span>
        </Button>
    );
};
