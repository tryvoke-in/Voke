import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Settings, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  variant?: "default" | "minimal";
}

export const Navbar = ({ variant }: NavbarProps = {}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isCommunityPage = location.pathname === '/community';
    const isPricingPage = location.pathname === '/pricing' || location.pathname.startsWith('/pricing');
    const isJobRecommendationsPage = location.pathname === '/job-recommendations' || location.pathname.startsWith('/job-recommendations');
    const isMinimalMode = variant === "minimal" || isPricingPage || isJobRecommendationsPage;
    const brandName = isCommunityPage ? "Voke Pulse" : "Voke";
    const logoSrc = "/images/voke_logo.png";

    useEffect(() => {
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                fetchNotifications(session.user.id);
                fetchProfile(session.user.id, session.user);
            } else {
                setUserId(null);
                setProfile(null);
            }
        });

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
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUserId(session.user.id);
            fetchNotifications(session.user.id);
            fetchProfile(session.user.id, session.user);
        }
    };

    const fetchProfile = async (uid: string, userObj?: any) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .maybeSingle();

            const user = userObj || (await supabase.auth.getUser()).data?.user;
            const metaAvatar = user?.user_metadata?.avatar_url;
            const metaName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

            let resolvedProfile: any = data ? { ...data } : { id: uid };
            if (!resolvedProfile.avatar_url && metaAvatar) {
                resolvedProfile.avatar_url = metaAvatar;
            }
            if (!resolvedProfile.full_name) {
                resolvedProfile.full_name = metaName || 'User';
            }

            setProfile(resolvedProfile);
        } catch (err) {
            console.error('[Navbar] Error fetching profile:', err);
        }
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

    // SPECIALIZED MINIMAL COMMUNITY NAVBAR FOR VOKE PULSE
    if (isCommunityPage) {
        return (
            <nav aria-label="Community Navigation" className={`fixed z-40 backdrop-blur-2xl transition-all duration-500 ${isScrolled ? "top-1 left-4 right-4 md:left-8 md:right-8 bg-[#090d16]/90 border border-slate-700/60 rounded-full shadow-lg shadow-black/20" : "top-0 left-0 right-0 bg-[#090d16]/90 border-b border-slate-800/80"}`}>
                <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-14" : "h-16"}`}>
                        {/* Logo/Brand */}
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Go to Voke Pulse"
                            className="flex items-center gap-2.5 cursor-pointer group focus-visible:outline-none rounded-lg"
                            onClick={() => navigate("/community")}
                        >
                            <img
                                src={logoSrc}
                                alt="Voke Pulse Logo"
                                width={44}
                                height={44}
                                decoding="async"
                                className="w-11 h-11 object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-500 dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent">
                                    Voke Pulse
                                </span>
                            </div>
                        </div>

                        {/* Right Side Community Actions */}
                        <div className="flex items-center gap-3">
                            <UpgradeButton />

                            {/* Notifications Bell */}
                            {userId && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
                                            <Bell className="w-4 h-4" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#090d16]" />
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0 bg-[#111726] border-slate-800 text-slate-100 shadow-2xl rounded-2xl">
                                        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-200">Community Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        <ScrollArea className="h-64">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => markAsRead(n.id)}
                                                        className={`p-3 border-b border-slate-800/50 text-xs hover:bg-slate-800/30 cursor-pointer ${
                                                            !n.read ? 'bg-blue-500/10' : ''
                                                        }`}
                                                    >
                                                        <p className="font-semibold text-slate-200">{n.title || 'Community Update'}</p>
                                                        <p className="text-slate-400 text-[11px] mt-0.5">{n.message || n.content}</p>
                                                    </div>
                                                ))
                                            )}
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* Back to Voke App Button */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate("/dashboard")}
                                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800 rounded-xl px-3 h-9"
                            >
                                <span>Voke Interviews</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                            </Button>

                            {/* Theme Toggle */}
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    // SPECIALIZED MINIMAL NAVBAR FOR PRICING / APP WORKSPACE PAGES
    if (isMinimalMode) {
        return (
            <nav aria-label="Navigation" className={`fixed z-40 backdrop-blur-xl transition-all duration-500 ${isScrolled ? "top-1 left-4 right-4 md:left-8 md:right-8 bg-background/80 dark:bg-background/80 border border-border/80 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20" : "top-0 left-0 right-0 bg-background/80 dark:bg-background/80 border-b border-border/80"}`}>
                <div className="container mx-auto px-4">
                    <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-14" : "h-16"}`}>
                        {/* Logo/Brand */}
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Go to Voke Homepage"
                            className="flex items-center gap-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
                            onClick={handleLogoClick}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleLogoClick(); }}
                        >
                            <img
                                src={logoSrc}
                                alt="Voke Logo"
                                width={48}
                                height={48}
                                decoding="async"
                                className="w-11 h-11 object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                Voke
                            </span>
                        </div>

                        {/* Right Side - Upgrade, Theme Toggle & Avatar Only */}
                        <div className="flex items-center gap-3">
                            <UpgradeButton />
                            <ThemeToggle />

                            {userId ? (
                                (() => {
                                    const score = (() => {
                                        if (!profile) return 0;
                                        let s = 0;
                                        const fields = ['full_name', 'linkedin_url', 'github_url', 'resume_url'];
                                        fields.forEach(k => { if (profile[k]) s += 25; });
                                        return s;
                                    })();
                                    
                                    const strokeColor = score === 100 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444";
                                    const radius = 18;
                                    const circumference = 2 * Math.PI * radius;
                                    const offset = circumference - (score / 100) * circumference;

                                    return (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Go to Profile"
                                            className="relative flex items-center justify-center w-10 h-10 cursor-pointer group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            onClick={() => navigate('/profile')}
                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate('/profile'); }}
                                        >
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

                                            {/* Avatar / Profile Picture */}
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage
                                                    src={profile?.avatar_url}
                                                    alt={profile?.full_name || "Profile"}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                                                    {(profile?.full_name || "U")[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    );
                                })()
                            ) : (
                                <Button
                                    onClick={() => navigate("/auth")}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg h-9 px-4 shadow-2xs"
                                >
                                    Get Started
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav aria-label="Main Navigation" className={`fixed z-40 backdrop-blur-xl transition-all duration-500 ${isScrolled ? "top-1 left-4 right-4 md:left-8 md:right-8 bg-white/80 dark:bg-gray-950/80 border border-gray-200/50 dark:border-gray-700/50 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20" : "top-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 border-b border-gray-200/50 dark:border-gray-800/50"}`}>
            <div className="container mx-auto px-4">
                <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-14" : "h-16"}`}>
                    {/* Logo/Brand */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Go to Voke Homepage"
                        className="flex items-center gap-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1"
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
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-500 dark:from-white dark:via-white dark:to-white/40">
                            {brandName}
                        </span>
                    </div>

                    {/* Center Navigation Links */}
                    {/* <div className="hidden md:flex items-center gap-1">
                        {[
                            { name: "AI Practice", path: "/voice-assistant" },
                            { name: "Companies", path: "/companies" },
                            { name: "DSA Sheet", path: "/dsa-sheet" },
                            { name: "Pricing", path: "/pricing" },
                            { name: "Community", path: "/community" },
                            { name: "About", path: "/about" },
                        ].map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    onClick={() => navigate(link.path)}
                                    className={`relative text-sm font-medium transition-all px-3 py-2 ${
                                        isActive
                                            ? "text-sky-600 dark:text-sky-400 font-semibold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-gradient-to-r after:from-sky-500 after:to-blue-500 after:rounded-full"
                                            : "text-gray-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30"
                                    }`}
                                >
                                    {link.name}
                                </Button>
                            );
                        })}
                    </div> */}

                    {/* Right Side - Theme Toggle & CTA */}
                    <div className="flex items-center gap-3.5">

                        <UpgradeButton />
                        {userId && (
                            <>
                                

                                {/* Profile Strength - Circular Ring */}
                                {(() => {
                                    const score = (() => {
                                        if (!profile) return 0;
                                        let s = 0;
                                        const fields = ['full_name', 'linkedin_url', 'github_url', 'resume_url'];
                                        fields.forEach(k => { if (profile[k]) s += 25; });
                                        return s;
                                    })();
                                    
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

                                            {/* Avatar / Profile Picture */}
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage
                                                    src={profile?.avatar_url}
                                                    alt={profile?.full_name || "Profile"}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-sky-100 dark:bg-sky-900/50 text-[10px] font-bold text-sky-600 dark:text-sky-300">
                                                    {(profile?.full_name || "U")[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )
                                })()}

                                
                            </>
                        )}
                        <ThemeToggle />
                        {!userId && (
                            <Button
                                onClick={() => navigate("/auth")}
                                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 dark:from-sky-500 dark:to-blue-500 dark:hover:from-sky-600 dark:hover:to-blue-600 text-white shadow-lg shadow-sky-500/30 dark:shadow-sky-500/20 transition-all duration-300 hover:scale-105"
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
