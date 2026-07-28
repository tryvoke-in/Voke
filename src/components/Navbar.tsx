import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Bell, Check, Users, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

import { UpgradeButton } from "@/components/UpgradeButton";

export const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);

    const isCommunityPage = location.pathname === '/community';
    const brandName = isCommunityPage ? "Voke Pulse" : "Voke";
    const logoSrc = "/images/voke_logo.png";

    useEffect(() => {
        checkUser();
        
        // Subscribe to realtime notifications
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    if (payload.new.user_id === userId) {
                        fetchNotifications();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]); // Re-subscribe if userId changes

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUserId(session.user.id);
            fetchNotifications(session.user.id);
            fetchProfile(session.user.id);
        }
    };

    const fetchProfile = async (uid: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();
        if (data) setProfile(data);
    };

    const fetchNotifications = async (uid = userId) => {
        if (!uid) return;
        const { data } = await supabase
            .from('notifications' as any)
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications' as any)
            .update({ read: true })
            .eq('id', id);
        
        // Update local state
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    return (
        <nav aria-label="Main Navigation" className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Go to Voke Homepage"
                        className="flex items-center gap-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg p-1"
                        onClick={handleLogoClick}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleLogoClick(); }}
                    >
                        <img
                            src={logoSrc}
                            alt={`${brandName} Logo`}
                            width={48}
                            height={48}
                            decoding="async"
                            className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                            {brandName}
                        </span>
                    </div>

                    {/* Center Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/voice-assistant")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 text-sm font-medium"
                        >
                            AI Practice
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/companies")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 text-sm font-medium"
                        >
                            Companies
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/dsa-sheet")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 text-sm font-medium"
                        >
                            DSA Sheet
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/pricing")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 text-sm font-medium"
                        >
                            Pricing
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/community")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 text-sm font-medium"
                        >
                            Community
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/about")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 text-sm font-medium"
                        >
                            About
                        </Button>
                    </div>

                    {/* Right Side - Theme Toggle & CTA */}
                    <div className="flex items-center gap-3.5">

                        <UpgradeButton />
                        {userId && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate("/peer-interviews")}
                                    aria-label="Peer Match"
                                    className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/10 relative h-9 w-9 rounded-full transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-violet-500"
                                    title="Peer Match"
                                >
                                    <Users className="w-5 h-5" aria-hidden="true" />
                                    <span className="sr-only">Peer Match</span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate("/profile")}
                                    aria-label="Settings and Profile"
                                    className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/10 relative h-9 w-9 rounded-full transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-violet-500"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5" aria-hidden="true" />
                                    <span className="sr-only">Settings</span>
                                </Button>

                                {/* Profile Strength - Circular Ring */}
                                {(() => {
                                    // Calculate Score
                                    const score = (() => {
                                        if (!profile) return 0;
                                        let s = 0;
                                        const fields = ['full_name', 'linkedin_url', 'github_url', 'resume_url'];
                                        fields.forEach(k => { if (profile[k]) s += 25; });
                                        return s;
                                    })();
                                    
                                    // Ring Color
                                    const strokeColor = score === 100 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444";
                                    const radius = 18;
                                    const circumference = 2 * Math.PI * radius;
                                    const offset = circumference - (score / 100) * circumference;

                                    return (
                                        <div className="relative flex items-center justify-center w-10 h-10 cursor-pointer group" onClick={() => navigate('/profile')}>
                                            {/* Tooltip */}
                                            <div className="absolute top-12 right-0 w-max px-3 py-1.5 bg-popover border border-border text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                Profile Strength: <span style={{ color: strokeColor }}>{score}%</span>
                                            </div>

                                            {/* Background Circle */}
                                            <svg className="absolute w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="20"
                                                    cy="20"
                                                    r={radius}
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    fill="transparent"
                                                    className="text-muted/30"
                                                />
                                                {/* Progress Circle */}
                                                <circle
                                                    cx="20"
                                                    cy="20"
                                                    r={radius}
                                                    stroke={strokeColor}
                                                    strokeWidth="2.5"
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>

                                            {/* Avatar/Initials */}
                                            <div className="w-7 h-7 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-600 dark:text-violet-300">
                                                {profile?.full_name?.charAt(0) || "U"}
                                            </div>
                                        </div>
                                    )
                                })()}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        navigate("/");
                                    }}
                                    className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-9 w-9 rounded-full ml-1 transition-colors flex items-center justify-center"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </>
                        )}
                        <ThemeToggle />
                        {!userId && (
                            <Button
                                onClick={() => navigate("/auth")}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 dark:from-violet-500 dark:to-purple-500 dark:hover:from-violet-600 dark:hover:to-purple-600 text-white shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20 transition-all duration-300 hover:scale-105"
                            >
                                Get Started
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
