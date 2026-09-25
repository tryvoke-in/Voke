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
import { motion } from "framer-motion";
import { Copy, Check, Gift, Users, Zap, Mic, Play, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReferral } from "@/hooks/useReferral";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";

export const ReferralCard = () => {
  const [copied, setCopied] = useState(false);
  const { referralCode, referralLink, totalReferred, totalCredited, loading } = useReferral();
  const { creditsElite: _e, creditsVoice: _v, creditsVideo: _vi, isPremium } = useInterviewCredits();

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
    { label: "AI Voice Agent", icon: Mic, credits: totalCredited, color: "text-[#0F6B38] dark:text-emerald-400", bg: "bg-[#EAF3ED] dark:bg-emerald-500/15" },
    { label: "Text Interview", icon: Zap, credits: totalCredited, color: "text-[#0F6B38] dark:text-emerald-400", bg: "bg-[#EAF3ED] dark:bg-emerald-500/15" },
    { label: "Video Practice", icon: Play, credits: totalCredited, color: "text-[#0F6B38] dark:text-emerald-400", bg: "bg-[#EAF3ED] dark:bg-emerald-500/15" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="w-full"
    >
      <Card className="relative overflow-hidden border border-[#CFDDD2] dark:border-emerald-500/20 bg-white dark:bg-card shadow-xl">
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F6B38] flex items-center justify-center shadow-md shadow-[#0F6B38]/20 text-white">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-[#003B2D] dark:text-white font-bold">
              Refer & Earn Credits
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* Tagline */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share your link. When a friend signs up, you <span className="text-[#0F6B38] dark:text-emerald-400 font-semibold">both win</span> —
            you earn <span className="font-semibold text-foreground">+1 credit</span> for each of the 3 features below.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="w-4 h-4 text-[#0F6B38] dark:text-emerald-400" />
                <span className="text-xl font-bold">{loading ? "—" : totalReferred}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Referred</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                className={`shrink-0 rounded-xl px-3 h-9 transition-all duration-300 cursor-pointer ${
                  copied
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25"
                    : "bg-[#0F6B38] hover:bg-[#0B572D] text-white shadow-md shadow-[#0F6B38]/25"
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
              <Share2 className="w-3 h-3 text-[#0F6B38] dark:text-emerald-400" />
              <span>Share on WhatsApp, LinkedIn, or with classmates!</span>
            </div>
          </div>

          {/* How it works mini-note */}
          <details className="group">
            <summary className="flex items-center gap-1 text-[11px] text-[#0F6B38] dark:text-emerald-400 cursor-pointer select-none hover:text-[#0B572D] transition-colors list-none font-medium">
              <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              How does it work?
            </summary>
            <div className="mt-2 text-[11px] text-muted-foreground space-y-1 pl-4 border-l-2 border-[#0F6B38]/40">
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
