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
    <Card className="border border-border/60 bg-card text-card-foreground hover:border-border transition-all shadow-md hover:shadow-lg rounded-2xl overflow-hidden h-full flex flex-col justify-between">
      <CardContent className="p-4 sm:p-5 space-y-3.5 flex flex-col justify-between flex-1">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            {/* <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                Milestone
              </span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border", intensityData.badgeColor)}>
                {intensityData.intensity}
              </span>
            </div> */}
            <h3 className="text-base font-bold tracking-tight text-foreground truncate mt-1">
              Road to {company || "Dream Offer"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {date ? format(date, "MMM do, yyyy") : "Target date pending"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground  rounded-lg"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>

            {company && (
              <div className="w-9 h-9 rounded-xl bg-background border border-border/80 p-1.5 flex items-center justify-center shadow-2xs">
                <img
                  src={getCompanyLogoUrl(company)}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes("ui-avatars.com")) return;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random&color=fff&size=64`;
                  }}
                  alt={`${company} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Compact Countdown & Actionable Prep Guide Button in same row */}
        <div className="flex items-center justify-between gap-2 py-1.5 border-y border-border/50">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {daysRemaining}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Days Left
            </span>
          </div>

          <div
            onClick={() => {
              if (company) {
                const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                navigate(`/companies/${slug}`);
              } else {
                navigate("/companies");
              }
            }}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/50 transition-all cursor-pointer text-xs font-medium text-foreground hover:text-blue-500 max-w-[60%] truncate"
          >
            <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Briefcase className="w-3 h-3" />
            </div>
            <span className="truncate">
              {company ? `${company} Prep Guide` : "Prep Guide"}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
            <span>Start</span>
            <span>{date ? format(date, "MMM yyyy") : "Goal"}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
