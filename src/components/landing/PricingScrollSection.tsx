import React from "react";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollSplitCard, ScrollSplitCardItem } from "@/components/ui/scroll-split-card";

interface PricingScrollSectionProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingScrollSection: React.FC<PricingScrollSectionProps> = React.memo(({ onSelectPlan }) => {
  const PLANS = [
    {
      name: "Voke Pro",
      badge: "Targeted Practice",
      price: "₹399",
      period: "Monthly",
      billingNote: "Billed monthly • Cancel anytime",
      desc: "Targeted practice for active job applicants.",
      cta: "Get Started with Pro",
      popular: false,
      bgColor: "#ffffff",
      textColor: "#003B2D",
      features: [
        "4 Pro Video Credits (Voice + Video Merged)",
        "3 Text AI Mock Interview Credits",
        "Multi-Modal Vision & Body Language Analysis",
        "Detailed Audio / Video Performance Reports",
        "Core Technical Question Bank & Scorecard",
        "Real-Time Pacing & Speech Cadence Tracking"
      ]
    },
    {
      name: "Voke Elite",
      badge: "Most Popular",
      price: "₹599",
      period: "Monthly",
      billingNote: "Billed monthly • Cancel anytime",
      desc: "Comprehensive power for serious tech job hunters.",
      cta: "Upgrade to Elite",
      popular: true,
      bgColor: "#ffffff",
      textColor: "#003B2D",
      features: [
        "4 Elite Company Credits (Up to 16 rounds)",
        "2 Pro Video Interview Credits Included",
        "Interactive Code IDE & Algorithm Compilers",
        "AI Resume Optimization & Keyword Scoring",
        "Advanced Speech Cadence & Posture Analysis",
        "Verified Voke Scorecard for Recruiter Match"
      ]
    },
    {
      name: "Enterprise AI",
      badge: "Campus & T&P",
      price: "Custom",
      period: "Campus",
      billingNote: "Institutional license • SLA guaranteed",
      desc: "For universities, colleges, and placement cells.",
      cta: "Contact Enterprise Sales",
      popular: false,
      bgColor: "#ffffff",
      textColor: "#003B2D",
      features: [
        "Campus-wide Voke Elite access for all students",
        "Bulk Student Seat & Batch Management",
        "Custom Department & Role-based Drives",
        "Placement Readiness Analytics Dashboard",
        "Official College Domain Email Auto-Mapping",
        "Dedicated Success Manager & 99.9% Uptime SLA"
      ]
    }
  ];

  // Render revealed card content on the back after 3D flip
  const renderCardContent = (plan: typeof PLANS[0]) => {
    const isPopular = plan.popular;

    return (
      <div
        className={`relative flex flex-col justify-between h-full p-6 sm:p-8 select-text text-[#111e17] antialiased rounded-[inherit] ${
          isPopular ? "bg-[#FAFCFA]" : "bg-white"
        }`}
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        }}
      >
        <div>
          {/* Header Row: Plan Name & Highlight Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#002B20] tracking-tight">
              {plan.name}
            </h3>
            {isPopular && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-white bg-[#0F6B38] px-3 py-1 rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                Recommended
              </span>
            )}
          </div>

          <p className="text-xs text-[#557564] font-normal leading-relaxed mb-5 min-h-[32px]">
            {plan.desc}
          </p>

          {/* Clean Price Presentation */}
          <div className="mb-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#002B20] tracking-tight">
                {plan.price}
              </span>
              {plan.price !== "Custom" && (
                <span className="text-xs text-[#557564] font-medium">
                  / month
                </span>
              )}
            </div>
            <p className="text-xs text-[#557564] mt-1">
              {plan.billingNote}
            </p>
          </div>

          {/* Simple Divider Line */}
          <div className="h-px bg-[#E2EBE5] mb-5 sm:mb-6" />

          {/* Features Header */}
          <p className={`text-[11px] uppercase tracking-wider mb-4 sm:mb-4.5 ${
            isPopular ? "font-bold text-[#0F6B38]" : "font-semibold text-[#557564]"
          }`}>
            {isPopular ? "Everything in Pro, plus:" : "What's included:"}
          </p>

          {/* Feature List with generous, proper spacing */}
          <div className="space-y-4 sm:space-y-4.5">
            {plan.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3.5 py-0.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isPopular
                      ? "bg-[#0F6B38] text-white shadow-xs"
                      : "bg-[#EAF3ED] text-[#0F6B38]"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-[13px] sm:text-[13.5px] lg:text-[14px] text-[#22382C] leading-snug font-normal">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-6 sm:pt-7 mt-auto">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlan(plan.name);
            }}
            className={`w-full py-3.5 h-11 rounded-full font-bold text-xs transition-all duration-300 shadow-xs hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer ${
              isPopular
                ? "bg-[#0F6B38] hover:bg-[#0B572D] text-white shadow-md shadow-emerald-950/20"
                : "bg-[#EAF3ED] hover:bg-[#0F6B38] text-[#0F6B38] hover:text-white border border-[#CFDDD2] hover:border-emerald-600"
            }`}
          >
            <span>{plan.cta}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </div>
      </div>
    );
  };

  const splitCards: ScrollSplitCardItem[] = PLANS.map((plan) => ({
    title: plan.name,
    description: plan.desc,
    bgColor: plan.bgColor,
    textColor: plan.textColor,
    content: renderCardContent(plan),
  }));

  return (
    <section id="pricing" className="relative py-4 md:py-8 bg-transparent">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DESKTOP: Interactive Scroll Split 3D Flip Card                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <ScrollSplitCard
          cards={splitCards}
          frontContent={
            <div className="w-full h-full bg-[#05070c] relative flex flex-col items-center justify-center overflow-hidden border border-emerald-500/30">
              {/* 1. Deep Midnight Studio Foundation (Exact MacBook Hero) */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,#0d1527_0%,#080d1a_45%,#05070c_100%)] pointer-events-none" />

              {/* 2. Top Celestial Horizon Aurora */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.16)_0%,rgba(16,185,129,0.12)_35%,rgba(15,23,42,0.4)_65%,transparent_80%)] blur-3xl pointer-events-none" />

              {/* 3. Studio Center Spotlight & Emerald Aura */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.15)_0%,rgba(15,23,42,0.3)_50%,transparent_75%)] blur-3xl pointer-events-none" />

              {/* 4. Precision Engineering Cartesian Grid with Radial Mask */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_25%,transparent_85%)] pointer-events-none" />

              {/* 5. Subtle Star Dust / Micro Sparkles */}
              <div className="absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_30%,transparent_85%)] pointer-events-none">
                <div className="absolute top-[22%] left-[18%] w-1 h-1 rounded-full bg-cyan-300 animate-ping opacity-60" />
                <div className="absolute top-[28%] right-[22%] w-1 h-1 rounded-full bg-emerald-300 animate-pulse opacity-70" />
                <div className="absolute bottom-[30%] left-[24%] w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                <div className="absolute bottom-[24%] right-[28%] w-1 h-1 rounded-full bg-cyan-200 opacity-50" />
                <div className="absolute top-[48%] left-[50%] w-1 h-1 rounded-full bg-white/40" />
                <div className="absolute top-[65%] right-[15%] w-1 h-1 rounded-full bg-emerald-400 opacity-60" />
              </div>

              {/* 6. Subtle Glowing Horizon Edge at very top */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 via-emerald-400/25 to-transparent pointer-events-none" />

              {/* Center Giant Written Text "Pricing?" Spanning Across All 3 Split Cards */}
              <div className="relative z-10 flex items-center justify-center w-full h-full px-6 select-none">
                <h2 className="font-serif text-[20vw] md:text-[18vw] lg:text-[15.5rem] xl:text-[18.5rem] font-normal text-white tracking-tighter leading-none drop-shadow-[0_16px_50px_rgba(0,0,0,0.95)] select-none whitespace-nowrap">
                  Pricing<span className="italic text-emerald-400 ml-1">?</span>
                </h2>
              </div>
            </div>
          }
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOBILE: Clean 3-Card Stack for Small Screens                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden container mx-auto px-4 py-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#EAF3ED] border border-[#CFDDD2] text-[#0F6B38] text-[11px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" /> Transparent Plans
          </div>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-[#003B2D]">
            Simple, Transparent <span className="italic text-[#0F6B38]">Pricing</span>
          </h2>
          <p className="text-xs text-[#557564]">
            Realistic AI mock interviews and placement preparation suites.
          </p>
        </div>

        <div className="space-y-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[28px] overflow-hidden ${plan.popular
                ? "border-2 border-[#0F6B38] shadow-lg shadow-emerald-950/10 bg-white"
                : "border border-[#DCE7DF] shadow-sm bg-white"
                }`}
            >
              {renderCardContent(plan)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default PricingScrollSection;
