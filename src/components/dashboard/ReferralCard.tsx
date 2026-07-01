/**
 * ReferralCard – Dashboard widget for the Referral Program
 *
 * Placed in the middle of the dashboard left column.
 * Shows:
 *  • User's unique referral link with copy button
 *  • Number of friends referred
 *  • Credits earned breakdown (voice, elite, video)
 *  • Animated referral count
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, Gift, Users, Zap, Mic, Play, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReferral } from "@/hooks/useReferral";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";

export const ReferralCard = () => {
  const [copied, setCopied] = useState(false);
  const { referralCode, referralLink, totalReferred, totalCredited, loading } = useReferral();
  const { creditsElite, creditsVoice, creditsVideo, isPremium } = useInterviewCredits();

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const features = [
    { label: "AI Voice Agent", icon: Mic, credits: creditsVoice, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "Text Interview", icon: Zap, credits: creditsElite, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Video Practice", icon: Play, credits: creditsVideo, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-card to-fuchsia-500/5 shadow-lg">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent font-bold">
              Refer & Earn Credits
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* Tagline */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share your link. When a friend signs up, you <span className="text-violet-500 font-semibold">both win</span> —
            you earn <span className="font-semibold text-foreground">+1 credit</span> for each of the 3 features below.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="w-4 h-4 text-violet-500" />
                <span className="text-xl font-bold">{loading ? "—" : totalReferred}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Referred</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Gift className="w-4 h-4 text-emerald-500" />
                <span className="text-xl font-bold">{loading ? "—" : totalCredited * 3}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Credits Earned</p>
            </div>
          </div>

          {/* Feature credit breakdown */}
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${f.bg} flex items-center justify-center`}>
                    <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{f.label}</span>
                </div>
                <span className={`text-xs font-bold ${f.color}`}>
                  {isPremium ? "∞" : `${f.credits} credit${f.credits !== 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Your Referral Link</p>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground font-mono truncate select-all">
                {loading ? "Generating..." : (referralLink || "Loading...")}
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                disabled={loading || !referralLink}
                className={`shrink-0 rounded-xl px-3 h-9 transition-all duration-300 ${
                  copied
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                }`}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 mr-1" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>
                )}
              </Button>
            </div>
          </div>

          {/* Share CTA */}
          <div className="pt-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Share2 className="w-3 h-3 text-violet-500" />
              <span>Share on WhatsApp, LinkedIn, or with classmates!</span>
            </div>
          </div>

          {/* How it works mini-note */}
          <details className="group">
            <summary className="flex items-center gap-1 text-[11px] text-violet-500 cursor-pointer select-none hover:text-violet-400 transition-colors list-none">
              <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              How does it work?
            </summary>
            <div className="mt-2 text-[11px] text-muted-foreground space-y-1 pl-4 border-l-2 border-violet-500/30">
              <p>1️⃣ Share your unique link above</p>
              <p>2️⃣ Friend clicks it and creates an account</p>
              <p>3️⃣ You automatically get <strong className="text-foreground">+1 credit</strong> for Voice, Text &amp; Video</p>
              <p>4️⃣ No limits — every referral earns you more!</p>
            </div>
          </details>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralCard;
