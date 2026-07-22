
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon, Briefcase, Zap, Target, Trophy, Flame, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface RoadToOfferProps {
  profile: any;
  onUpdate?: () => void;
}

const COMPANY_LOGOS: Record<string, string> = {
  "google": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  "meta": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png",
  "facebook": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png",
  "amazon": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
  "apple": "https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg",
  "netflix": "https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg",
  "microsoft": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  "uber": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
  "airbnb": "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg",
  "linkedin": "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
  "twitter": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
  "x": "https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg",
  "tesla": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png",
  "spacex": "https://upload.wikimedia.org/wikipedia/commons/2/2e/SpaceX_logo_black.svg",
  "spotify": "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
  "adobe": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Old_Adobe_logo.svg",
  "salesforce": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
  "oracle": "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
  "ibm": "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
  "intel": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg",
  "nvidia": "https://upload.wikimedia.org/wikipedia/commons/a/a4/NVIDIA_logo.svg",
  "amd": "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg",
  "cisco": "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
  "paypal": "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
  "square": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Square_Inc_logo.svg",
  "stripe": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
  "zoom": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
  "slack": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  "tiktok": "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg",
  "bytedance": "https://upload.wikimedia.org/wikipedia/commons/0/07/ByteDance_Logo.png",
  "snapchat": "https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg",
  "pinterest": "https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png",
  "reddit": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg",
  "dropbox": "https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg",
  "gitlab": "https://upload.wikimedia.org/wikipedia/commons/e/e1/GitLab_logo.svg",
  "github": "https://upload.wikimedia.org/wikipedia/commons/4/4a/GitHub_Mark.png",
  "atlassian": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Atlassian_logo.svg",
  "jira": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg",
  "trello": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Trello-logo-blue.svg",
  "asana": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Asana_logo.svg",
  "notion": "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  "deutsche bank": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Deutsche_Bank_logo_without_wordmark.svg",
  "uber eats": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Uber_Eats_2018_Logo_Suite_stacked.png",
};

export const RoadToOffer = ({ profile, onUpdate }: RoadToOfferProps) => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(
    profile?.target_interview_date ? new Date(profile.target_interview_date) : undefined
  );
  const [company, setCompany] = useState(profile?.dream_company || "");
  const [isEditing, setIsEditing] = useState(!profile?.target_interview_date);
  const [loading, setLoading] = useState(false);
  const [showBuffering, setShowBuffering] = useState(false);

  // Helper to get logo with fallbacks
  const getCompanyLogoUrl = (companyName: string) => {
    // 1. Static map for major companies
    const logo = COMPANY_LOGOS[companyName.toLowerCase()];
    if (logo) {
      return logo;
    }

    // 2. Google Favicon API (highly reliable, no DNS blocks)
    // Clean name: remove special chars, spaces, lowercase
    const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`;
  };

  const handleSave = async () => {
    if (!date) return;
    setLoading(true);
    setShowBuffering(true);

    // Simulate a "calculating" delay for effect with varied steps
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          target_interview_date: date.toISOString(),
          dream_company: company
        } as any)
        .eq('id', profile.id);

      if (error) throw error;
      toast.success("Target Locked 🎯", { description: "Your personalized path is ready." });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save goal");
    } finally {
      setLoading(false);
      setShowBuffering(false);
    }
  };

  const calculateIntensity = () => {
    if (!date) return { text: "Set a date to calculate intensity", color: "text-muted-foreground", intensity: "Low", gradient: "from-gray-500 to-gray-700" };
    const daysLeft = differenceInDays(date, new Date());

    if (daysLeft < 0) return { text: "Date passed! Time to set a new goal.", color: "text-muted-foreground", intensity: "Done", gradient: "from-gray-500 to-gray-700" };
    if (daysLeft <= 7) return { text: "Crunch Time. Daily Mocks + Review.", color: "text-red-500", intensity: "EXTREME", gradient: "from-red-500 via-orange-500 to-red-600" };
    if (daysLeft <= 14) return { text: "High Gear. 1 Mock / Day.", color: "text-orange-500", intensity: "HIGH", gradient: "from-orange-500 via-amber-500 to-orange-600" };
    if (daysLeft <= 30) return { text: "Steady Grind. 2 Mocks / Week.", color: "text-yellow-500", intensity: "MEDIUM", gradient: "from-yellow-400 via-orange-400 to-yellow-500" };
    return { text: "Marathon Pace. 1 Mock / Week.", color: "text-emerald-500", intensity: "STEADY", gradient: "from-emerald-400 via-teal-400 to-emerald-500" };
  };

  const daysRemaining = date ? Math.max(0, differenceInDays(date, new Date())) : 0;
  const intensityData = calculateIntensity();
  const progressPercentage = Math.min(100, Math.max(5, ((30 - daysRemaining) / 30) * 100));

  // Matrix/Glitch Animation Component
  if (showBuffering) {
    return (
      <Card className="border-0 shadow-2xl relative overflow-hidden h-64 bg-black flex flex-col items-center justify-center ring-1 ring-violet-500/50">
        <div className="absolute inset-0 z-0 bg-transparent">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-violet-500/20 w-[1px] h-full"
              style={{ left: `${i * 5}%` }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1, 0, 1], opacity: [0, 0.5, 0] }}
              transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>

        <div className="z-10 text-center space-y-6 relative">
          <div className="relative w-20 h-20 mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-2 border-r-2 border-violet-500 border-b-transparent border-l-transparent"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[4px] rounded-full border-b-2 border-l-2 border-fuchsia-500 border-t-transparent border-r-transparent"
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Zap className="w-8 h-8 text-white fill-white animate-pulse" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white"
            >
              CALCULATING TRAJECTORY
            </motion.h3>
            <div className="flex justify-center gap-1">
              {["Analyzing profile...", "Optimizing path...", "Locking target..."].map((text, i) => (
                <motion.span
                  key={i}
                  className="text-[10px] text-violet-300 font-mono block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
                >
                  {text}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (isEditing) {
    return (
      <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            Define Your Goal
          </CardTitle>
          <CardDescription>Where do you want to be?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-500" /> Dream Company
            </label>
            <div className="relative">
              <Input
                placeholder="e.g. Google, Amazon, OpenAI"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="pl-4 h-11 border-violet-500/20 focus-visible:ring-violet-500/50 bg-background/50 backdrop-blur-sm transition-all"
              />
            </div>
          </div>
          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-violet-500" /> Target Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-11 border-violet-500/20 bg-background/50 hover:bg-violet-500/5", !date && "text-muted-foreground")}>
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] text-white font-semibold"
            onClick={handleSave}
            disabled={loading || !date}
          >
            {loading ? "Locking in..." : "Start My Journey 🚀"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden group border-0 shadow-xl bg-white dark:bg-gradient-to-br dark:from-[#0f0f13] dark:to-[#1a1a23] ring-1 ring-black/5 dark:ring-white/10">
        {/* Ambient Glows - Light Mode */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[50px] group-hover:bg-violet-600/20 dark:group-hover:bg-violet-600/30 transition-all duration-700" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-fuchsia-600/10 dark:bg-fuchsia-600/20 rounded-full blur-[50px] group-hover:bg-fuchsia-600/20 dark:group-hover:bg-fuchsia-600/30 transition-all duration-700" />

        <CardHeader className="pb-2 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent font-bold">
                  Road to {company || "Offer"}
                </span>
                <Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                Goal set for {date ? format(date, 'MMMM do, yyyy') : '...'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs px-3 py-1 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </motion.button>
              {company && (
                <motion.div
                  className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-lg overflow-hidden flex items-center justify-center ring-1 ring-gray-100 dark:ring-white/10 border border-gray-100 dark:border-transparent"
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                >
                  <img
                    src={getCompanyLogoUrl(company)}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.currentTarget;
                      // Prevent infinite loop if fallback also fails
                      if (target.src.includes('ui-avatars.com')) return;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random&color=fff&size=64`;
                    }}
                    alt={`${company} logo`}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 relative z-10 pt-4">

          {/* Main Stats Row */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter"
                  key={daysRemaining}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {daysRemaining}
                </motion.span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">DAYS LEFT</span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 shadow-sm text-white", intensityData.gradient)}>
                {intensityData.intensity} INTENSITY
              </div>
              <div className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-300 font-medium">
                <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                Recommended Pace
              </div>
            </div>
          </div>

          {/* Motivational Quote & Plan */}
          <motion.div
            className="relative bg-gray-50/50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10 backdrop-blur-sm overflow-hidden cursor-pointer group/mission"
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.07)" }}
            onClick={() => {
              if (company) {
                const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                navigate(`/companies/${slug}`);
              } else {
                navigate('/companies');
              }
            }}
          >

            <div className={cn("absolute left-0 top-0 w-1 h-full bg-gradient-to-b", intensityData.gradient)} />
            <div className="flex gap-3">
              <div className="min-w-[40px] h-[40px] rounded-full bg-violet-100 dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-fuchsia-500/20 flex items-center justify-center border border-violet-200 dark:border-white/5">
                <Trophy className="w-5 h-5 text-violet-600 dark:text-violet-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
                  Current Mission
                  <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  {intensityData.text}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">
              <span>Start</span>
              <span>Interview Day</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                className={cn("h-full bg-gradient-to-r relative", intensityData.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
              >
                {/* Shimmer Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </motion.div>

              {/* Milestones / Ticks */}
              <div className="absolute top-0 left-1/3 w-[1px] h-full bg-white/50 dark:bg-black/40 mix-blend-overlay" />
              <div className="absolute top-0 left-2/3 w-[1px] h-full bg-white/50 dark:bg-black/40 mix-blend-overlay" />
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};
