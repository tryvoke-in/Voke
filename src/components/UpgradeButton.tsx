import { Crown } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const UpgradeButton = () => {
    const navigate = useNavigate();
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        const updatePremiumStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsPremium(!!session?.user?.user_metadata?.is_premium);
        };

        updatePremiumStatus();

        // Listen for auth state changes to dynamically update status
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsPremium(!!session?.user?.user_metadata?.is_premium);
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
                onClick={() => navigate('/pricing')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300/60 cursor-pointer hover:opacity-90 transition-all"
            >
                <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                <span>Voke Elite</span>
            </motion.div>
        );
    }

    return (
        <div className="relative group hidden sm:inline-flex items-center">
            {/* Ambient Single-Color Glow Behind Button (Light Amber to Dark Amber) */}
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 opacity-70 blur-xs group-hover:opacity-100 group-hover:blur-sm transition-all duration-500 animate-pulse" />

            <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/pricing')}
                className="relative flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 text-amber-950 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.55)] border border-amber-300/80 cursor-pointer overflow-hidden transition-all duration-300"
            >
                {/* Continuous Shimmer Light Sweep */}
                <motion.div
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] pointer-events-none"
                    animate={{ x: ['-200%', '300%'] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", repeatDelay: 1 }}
                />

                <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2 }}
                >
                    <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                </motion.div>

                <span className="tracking-wide font-extrabold text-amber-950">
                    Upgrade Elite
                </span>
                
            </motion.button>
        </div>
    );
};
