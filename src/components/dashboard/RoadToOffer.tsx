import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon, Briefcase, Target, ChevronRight, Edit3, ArrowRight, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

  useEffect(() => {
    if (profile?.target_interview_date) {
      setDate(new Date(profile.target_interview_date));
    }
    if (profile?.dream_company) {
      setCompany(profile.dream_company);
    }
  }, [profile]);

  const getCompanyLogoUrl = (companyName: string) => {
    const logo = COMPANY_LOGOS[companyName.toLowerCase().trim()];
    if (logo) return logo;
    const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`;
  };

  const handleSave = async () => {
    if (!date) {
      toast.error("Please pick a target date");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          target_interview_date: date.toISOString(),
          dream_company: company.trim()
        } as any)
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Goal saved successfully!");
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save goal");
    } finally {
      setLoading(false);
    }
  };

  const calculateIntensity = () => {
    if (!date) {
      return {
        text: "Set a target date to calculate your weekly preparation pace",
        intensity: "Standard",
        badgeColor: "bg-muted text-muted-foreground border-border"
      };
    }
    const daysLeft = differenceInDays(date, new Date());

    if (daysLeft < 0) {
      return {
        text: "Goal date reached! Time to set your next milestone.",
        intensity: "Completed",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      };
    }
    if (daysLeft <= 7) {
      return {
        text: "Daily mock interviews & comprehensive review",
        intensity: "Final Sprint",
        badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      };
    }
    if (daysLeft <= 14) {
      return {
        text: "High intensity • 1 Mock interview per day",
        intensity: "High Pace",
        badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
      };
    }
    if (daysLeft <= 30) {
      return {
        text: "Steady practice • 2 Mock interviews per week",
        intensity: "Medium Pace",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      };
    }
    return {
      text: "Marathon pace • 1 Mock interview per week",
      intensity: "Steady Pace",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    };
  };

  const daysRemaining = date ? Math.max(0, differenceInDays(date, new Date())) : 0;
  const intensityData = calculateIntensity();
  const progressPercentage = Math.min(100, Math.max(8, Math.round(((60 - Math.min(daysRemaining, 60)) / 60) * 100)));

  if (isEditing) {
    return (
      <Card className="border border-border/60 bg-card text-card-foreground shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-500" />
              Set Interview Target
            </CardTitle>
            {profile?.target_interview_date && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3 text-muted-foreground" /> Dream Company
            </label>
            <Input
              placeholder="e.g. Amazon, Google"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
              <CalendarIcon className="w-3 h-3 text-muted-foreground" /> Target Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 text-xs",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
              onClick={handleSave}
              disabled={loading || !date}
            >
              {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Save Target
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="relative border border-border/60 bg-gradient-to-b from-card via-card to-card/90 text-card-foreground hover:border-orange-500/40 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between group">
        {/* Subtle glowing accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-background border border-border/80 p-1 flex items-center justify-center shadow-2xs shrink-0 group-hover:border-orange-500/30 transition-colors"
              >
                <img
                  src={getCompanyLogoUrl(company || "google")}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes("ui-avatars.com")) return;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company || "Google")}&background=random&color=fff&size=64`;
                  }}
                  alt={`${company || "Google"} logo`}
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Road to {company || "Google"}
              </h3>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg border-border/60 hover:bg-muted/80 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </Button>
          </div>

          {/* Days Left & Target Date */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {daysRemaining || 7}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                Days Left
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-foreground block">
                {date ? format(date, "MMM do, yyyy") : "Aug 28th, 2026"}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                Target Interview
              </span>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Milestone Progress
              </span>
              <span className="font-bold text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Stage 1 of 3
              </span>
            </div>

            {/* 3 Milestone Stage Chips */}
            <div className="grid grid-cols-3 gap-2">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-muted/30 hover:bg-muted/50 border border-emerald-500/30 rounded-xl p-2 text-center flex flex-col items-center justify-center transition-all cursor-default"
              >
                <span className="text-xs font-bold text-foreground">DSA Prep</span>
                <span className="text-[9px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-muted/30 hover:bg-muted/50 border border-orange-500/30 rounded-xl p-2 text-center flex flex-col items-center justify-center transition-all cursor-default"
              >
                <span className="text-xs font-bold text-foreground">AI Mocks</span>
                <span className="text-[9px] font-semibold text-orange-400 mt-0.5">Target</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-xl p-2 text-center flex flex-col items-center justify-center transition-all cursor-default"
              >
                <span className="text-xs font-bold text-foreground truncate max-w-[70px]">
                  {company || "Google"}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">Upcoming</span>
              </motion.div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => {
                if (company) {
                  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  navigate(`/companies/${slug}`);
                } else {
                  navigate("/companies");
                }
              }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm h-10 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-950/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 group/btn"
            >
              <span>Explore {company || "Google"} Prep Guide</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
