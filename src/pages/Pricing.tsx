import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Tag,
  CheckCircle2,
  X,
  Building,
  GraduationCap,
  HelpCircle,
  Zap,
  Star,
  Crown,
  Lock,
  Play,
  Briefcase,
  Video,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Award,
  Terminal
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";
import { toast } from "sonner";
import ReactConfetti from "react-confetti";

export const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toLowerCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    if (code === "vickybyte30") {
      setAppliedCoupon(code);
      setCouponError("");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success("🎉 Coupon applied! 30% discount unlocked.");
      trackEvent("pricing_coupon_applied", "/pricing", { code });
    } else {
      setCouponError("Invalid coupon code");
      toast.error("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    toast.info("Coupon removed");
  };

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsPremium(!!user.user_metadata?.is_premium);
      }
    };
    checkPremiumStatus();
  }, []);

  const ensureRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if ((window as any).Razorpay) {
          clearInterval(timer);
          resolve(true);
        } else if (attempts >= 25) {
          clearInterval(timer);
          resolve(!!(window as any).Razorpay);
        }
      }, 100);

      const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existing) {
        existing.addEventListener("load", () => {
          clearInterval(timer);
          resolve(true);
        });
        existing.addEventListener("error", () => {
          clearInterval(timer);
          resolve(false);
        });
      } else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          clearInterval(timer);
          resolve(true);
        };
        script.onerror = () => {
          clearInterval(timer);
          resolve(false);
        };
        document.head.appendChild(script);
      }
    });
  };

  const handleUpgrade = async (planKey: "pro" | "elite") => {
    setIsPaying(true);
    setPayingPlan(planKey);
    const planDisplayName = planKey === "elite" ? "Voke Elite" : "Voke Pro";
    trackEvent("pricing_upgrade_click", "/pricing", { plan: planKey });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to upgrade your plan.");
        navigate("/auth");
        setIsPaying(false);
        setPayingPlan(null);
        return;
      }

      const loaded = await ensureRazorpay();
      if (!loaded || !(window as any).Razorpay) {
        toast.error("Payment gateway could not be loaded. Please disable adblockers and try again.");
        setIsPaying(false);
        setPayingPlan(null);
        return;
      }

      // Create Razorpay order based on selected plan and annual billing state
      const targetPlan = planKey === "elite" ? "voke_elite" : "voke_pro";
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            plan: targetPlan,
            isAnnual: isAnnual,
            couponCode: appliedCoupon || undefined,
          },
        }
      );

      if (orderError || !orderData?.id) {
        let errMsg = "Unknown error";
        if (orderError) {
          const ctx = (orderError as any).context;
          if (ctx && typeof ctx.text === "function") {
            try {
              errMsg = await ctx.text();
            } catch {
              errMsg = orderError.message;
            }
          } else {
            errMsg = orderError.message;
          }
        } else if (orderData) {
          errMsg = orderData?.error || JSON.stringify(orderData);
        }

        let cleanError = errMsg;
        try {
          const parsed = JSON.parse(errMsg);
          if (parsed?.error) cleanError = parsed.error;
        } catch {}

        console.error("Order creation error:", errMsg, orderError, orderData);
        toast.error(`Payment failed: ${cleanError}`);
        setIsPaying(false);
        setPayingPlan(null);
        return;
      }

      const razorpayKey = orderData?.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY;
      if (!razorpayKey) {
        toast.error("Payment gateway is not configured. Please contact support.");
        setIsPaying(false);
        setPayingPlan(null);
        return;
      }

      const cycleLabel = isAnnual ? "Annual Pack (1 Year)" : "Monthly Plan";
      const options = {
        key: razorpayKey,
        amount: orderData.amount, // comes from create-razorpay-order: exactly ₹5,748/yr (Elite) or ₹3,828/yr (Pro) for annual, ₹599 or ₹399 for monthly
        currency: orderData.currency || "INR",
        order_id: orderData.id,
        name: `${planDisplayName} ${isAnnual ? "Annual" : ""}`.trim(),
        description: appliedCoupon
          ? `Upgrade to ${planDisplayName} ${cycleLabel} (Discount Applied)`
          : `Upgrade to ${planDisplayName} ${cycleLabel}`,
        image: "/images/voke_logo.png",
        handler: async function (response: any) {
          trackEvent("pricing_upgrade_success", "/pricing", {
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            plan: planKey,
            billing: isAnnual ? "annual" : "monthly",
          });
          toast.success("Payment successful! Verifying and upgrading your account...");

          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            }
          );

          if (verifyError || !verifyData?.success) {
            console.error("Payment verification failed:", verifyError || verifyData);
            toast.error("Payment recorded, but profile update failed. Please contact support.");
          } else {
            await supabase.auth.refreshSession();
            setShowConfetti(true);
            setIsPremium(true);
            toast.success(`Welcome to ${planDisplayName}! All features unlocked.`);
            setTimeout(() => {
              setShowConfetti(false);
              navigate("/dashboard");
            }, 3000);
          }
          setIsPaying(false);
          setPayingPlan(null);
        },
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        },
        theme: {
          color: "#003B2D",
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
            setPayingPlan(null);
            toast.info("Payment cancelled.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setIsPaying(false);
        setPayingPlan(null);
      });
      rzp.open();
    } catch (e: any) {
      console.error("Razorpay payment initialization error:", e);
      toast.error("Payment initialization failed: " + e.message);
      setIsPaying(false);
      setPayingPlan(null);
    }
  };

  // Pricing calculations
  // Pro: Monthly ₹399 | Annual ₹319/mo equivalent (charged ₹3,828/yr upfront)
  const proMonthly = 399;
  const proAnnualYearly = 3828; // ₹319/mo × 12
  const proChargeAmount = isAnnual ? proAnnualYearly : proMonthly;
  const proFinalCharge = appliedCoupon ? Math.round(proChargeAmount * 0.70) : proChargeAmount;
  const proDisplayMonthly = isAnnual
    ? (appliedCoupon ? Math.round(proFinalCharge / 12) : 319)
    : (appliedCoupon ? Math.round(proMonthly * 0.70) : proMonthly);

  // Elite: Monthly ₹599 | Annual ₹479/mo equivalent (charged ₹5,748/yr upfront)
  const eliteMonthly = 599;
  const eliteAnnualYearly = 5748; // ₹479/mo × 12
  const eliteChargeAmount = isAnnual ? eliteAnnualYearly : eliteMonthly;
  const eliteFinalCharge = appliedCoupon ? Math.round(eliteChargeAmount * 0.70) : eliteChargeAmount;
  const eliteDisplayMonthly = isAnnual
    ? (appliedCoupon ? Math.round(eliteFinalCharge / 12) : 479)
    : (appliedCoupon ? Math.round(eliteMonthly * 0.70) : eliteMonthly);

  // EXACT plans matching landing page prices
  const PLANS = [
    {
      id: "pro",
      planKey: "pro" as const,
      name: "Voke Pro",
      badge: "Targeted Practice",
      displayPrice: `₹${proDisplayMonthly}`,
      strikethroughPrice: isAnnual ? "₹399" : (appliedCoupon ? "₹399" : "₹799"),
      annualTotalText: isAnnual ? `₹${proFinalCharge.toLocaleString()} billed annually` : null,
      savingsNote: isAnnual ? "Save 20% on Annual Pack" : "50% Off Limited Offer",
      period: "Monthly",
      billingNote: isAnnual ? "Billed annually • 365 days full access" : "Billed monthly • 30 days full access",
      desc: "Targeted practice for active job applicants.",
      cta: "Get Started with Pro",
      buttonCta: isAnnual
        ? `Get Started with Pro - ₹${proFinalCharge.toLocaleString()}/yr`
        : `Get Started with Pro - ₹${proFinalCharge}/mo`,
      popular: false,
      icon: Video,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/15 border-blue-200/60 dark:border-blue-400/30",
      badgeStyle: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
      features: [
        "4 Pro Video Credits (Voice + Video Merged)",
        "3 Text AI Mock Interview Credits",
        "Multi-Modal Vision & Body Language Analysis",
        "Detailed Audio / Video Performance Reports",
        "Core Technical Question Bank & Scorecard",
        "Real-Time Pacing & Speech Cadence Tracking",
      ],
    },
    {
      id: "elite",
      planKey: "elite" as const,
      name: "Voke Elite",
      badge: "All-Inclusive",
      displayPrice: `₹${eliteDisplayMonthly}`,
      strikethroughPrice: isAnnual ? "₹599" : (appliedCoupon ? "₹599" : "₹1,199"),
      annualTotalText: isAnnual ? `₹${eliteFinalCharge.toLocaleString()} billed annually` : null,
      savingsNote: isAnnual ? "Save 20% on Annual Pack" : "50% Off Limited Offer",
      period: "Monthly",
      billingNote: isAnnual ? "Billed annually • 365 days full access" : "Billed monthly • 30 days full access",
      desc: "Comprehensive power for serious tech job hunters.",
      cta: "Upgrade to Elite",
      buttonCta: isAnnual
        ? `Upgrade to Elite - ₹${eliteFinalCharge.toLocaleString()}/yr`
        : `Upgrade to Elite - ₹${eliteFinalCharge}/mo`,
      popular: true,
      icon: Crown,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/15 border-amber-200/60 dark:border-amber-400/30",
      badgeStyle: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
      features: [
        "4 Elite Company Credits (Up to 16 rounds)",
        "2 Pro Video Interview Credits Included",
        "Interactive Code IDE & Algorithm Compilers",
        "AI Resume Optimization & Keyword Scoring",
        "Advanced Speech Cadence & Posture Analysis",
        "Verified Voke Scorecard for Recruiter Match",
      ],
    },
    {
      id: "enterprise",
      planKey: null,
      name: "Enterprise AI",
      badge: "Campus & T&P",
      displayPrice: "Custom",
      strikethroughPrice: null,
      annualTotalText: null,
      savingsNote: "Institutional seat licensing",
      period: "Campus",
      billingNote: "Institutional license • SLA guaranteed",
      desc: "For universities, colleges, and placement cells.",
      cta: "Contact Enterprise Sales",
      buttonCta: "Contact Enterprise Sales",
      popular: false,
      icon: Building,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-500/15 border-purple-200/60 dark:border-purple-400/30",
      badgeStyle: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
      features: [
        "Campus-wide Voke Elite access for all students",
        "Bulk Student Seat & Batch Management",
        "Custom Department & Role-based Drives",
        "Placement Readiness Analytics Dashboard",
        "Official College Domain Email Auto-Mapping",
        "Dedicated Success Manager & 99.9% Uptime SLA",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-emerald-500/30 flex flex-col relative overflow-x-hidden">
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ zIndex: 100, position: "fixed" }}
          recycle={false}
          numberOfPieces={350}
        />
      )}

      {/* Primary App Navigation */}
      <Navbar />

      {/* Subtle Ambient Background Effects (Exact Dashboard Background) */}
      {/* Ambient Atmospheric Top Glow & Grid Texture */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12)_0%,rgba(13,148,136,0.05)_45%,transparent_75%)] pointer-events-none -z-10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.035)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_50%_at_50%_20%,#000_30%,transparent_90%)] pointer-events-none -z-10" />

      {/* Main Content Container */}
      <main className="flex-1 pt-24 sm:pt-28 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-7xl relative">

          {/* Floating Feature Badges on Left and Right (Flanking the Subtitle & Toggle) */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.4 },
              x: { duration: 0.4 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="hidden lg:flex items-center gap-3 absolute left-2 xl:left-6 top-32 lg:top-36 p-3.5 rounded-2xl bg-white/90 dark:bg-card/90 border border-slate-200/80 dark:border-border/80 shadow-md backdrop-blur-md max-w-[220px] select-none pointer-events-none transform -rotate-1 hover:rotate-0 transition-transform duration-300 z-20"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Crown className="w-5 h-5 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Tier-1 Company Packs</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Up to 16 full rounds</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0, y: [0, 6, 0] }}
            transition={{
              opacity: { duration: 0.4 },
              x: { duration: 0.4 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }
            }}
            className="hidden lg:flex items-center gap-3 absolute right-2 xl:right-6 top-32 lg:top-36 p-3.5 rounded-2xl bg-white/90 dark:bg-card/90 border border-slate-200/80 dark:border-border/80 shadow-md backdrop-blur-md max-w-[220px] select-none pointer-events-none transform rotate-1 hover:rotate-0 transition-transform duration-300 z-20"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Verified Scorecard</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Share with recruiters</p>
            </div>
          </motion.div>

          {/* ─── Clean Centered Hero ────────────────── */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12 sm:mb-14">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 shadow-2xs text-xs font-semibold text-foreground backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[#003B2D] dark:text-emerald-400 font-bold">Invest in Your Career</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground">Transparent Plans, Zero Hidden Fees</span>
            </div>

            {/* Main Sans-serif Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
              Plans that scale with your{" "}
              <span className="bg-gradient-to-r from-[#003B2D] via-emerald-600 to-teal-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
                ambition
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Choose the right tier to practice with realistic AI mock interviews, interactive code compilers, and recruiter-verified scorecards.
            </p>

            {/* Minimal Billing Switch */}
            <div className="pt-2 flex items-center justify-center select-none">
              <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-muted/80 backdrop-blur-md border border-slate-200/80 dark:border-border/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    !isAnnual
                      ? "bg-[#003B2D] dark:bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isAnnual
                      ? "bg-[#003B2D] dark:bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Annual Billing</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isAnnual
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50"
                    }`}
                  >
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── 3 Primary Pricing Cards (Dashboard Action Cards Design) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
            {PLANS.map((plan) => {
              const isPopular = plan.popular;
              const isEnterprise = plan.id === "enterprise";
              const Icon = plan.icon;

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl transition-all duration-300 ${
                    isPopular
                      ? "md:-mt-2 md:mb-2 z-10"
                      : "z-0"
                  }`}
                >
                  {/* Physical Card Box */}
                  <div
                    className={`relative flex flex-col justify-between h-full rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
                      isPopular
                        ? "bg-white dark:bg-card border-2 border-[#003B2D] dark:border-emerald-500 shadow-xl shadow-[#003B2D]/10 dark:shadow-emerald-500/10"
                        : "bg-white dark:bg-card border border-slate-200/80 dark:border-border/90 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs hover:shadow-md"
                    }`}
                  >
                    {/* Top Floating Badge for Most Popular / Elite */}
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 text-xs font-extrabold shadow-sm border border-amber-300/80">
                          <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                          <span>MOST POPULAR • RECOMMENDED</span>
                        </div>
                      </div>
                    )}

                    <div>
                      {/* Top Row: Icon + Clean Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                        <div
                          className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${plan.iconBg}`}
                        >
                          <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                        </div>

                        {!isPopular && (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${plan.badgeStyle}`}
                          >
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 min-h-[38px]">
                        {plan.desc}
                      </p>

                      {/* Pricing Row */}
                      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-slate-200/60 dark:border-border/60">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-4xl font-extrabold text-foreground tracking-tight">
                            {plan.displayPrice}
                          </span>

                          {plan.displayPrice !== "Custom" && (
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                              / month
                            </span>
                          )}

                          {plan.strikethroughPrice && (
                            <span className="text-sm text-muted-foreground line-through font-mono ml-1">
                              {plan.strikethroughPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {plan.billingNote}
                          </p>
                          {plan.savingsNote && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                              {plan.savingsNote}
                            </span>
                          )}
                        </div>

                        {isAnnual && plan.annualTotalText && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-border/70 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Billed upfront:</span>
                            <span className="font-bold text-foreground bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                              {plan.annualTotalText}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Feature Divider */}
                      <div className="h-px bg-border/60 mb-5" />

                      {/* Features Header */}
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
                        {isPopular ? "Everything in Pro, plus:" : "What's included:"}
                      </p>

                      {/* Features List */}
                      <div className="space-y-3.5 mb-8">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                isPopular
                                  ? "bg-[#003B2D] text-white dark:bg-emerald-500 dark:text-slate-950"
                                  : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                            <span className="text-xs sm:text-sm text-foreground/90 leading-snug">
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Action Button */}
                    <div className="pt-2 mt-auto">
                      {isPremium && (plan.id === "elite" || plan.id === "pro") ? (
                        <div className="space-y-2">
                          <Button
                            onClick={() => navigate("/dashboard")}
                            className="w-full h-11 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                          >
                            <span>Already Premium — Open Dashboard</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              setIsPaying(true);
                              const { error } = await supabase.auth.updateUser({
                                data: { is_premium: false },
                              });
                              if (error) {
                                toast.error("Failed to downgrade: " + error.message);
                              } else {
                                await supabase.auth.refreshSession();
                                setIsPremium(false);
                                toast.success("Reset to free tier for testing!");
                              }
                              setIsPaying(false);
                            }}
                            disabled={isPaying}
                            className="w-full h-8 rounded-lg text-[11px] font-semibold border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
                          >
                            Revert to Free (Testing Only)
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            if (isEnterprise) {
                              window.location.href =
                                "mailto:teamtryvoke@gmail.com?subject=Enterprise%20Campus%20Inquiry%20-%20Voke%20AI&body=Hi%20Voke%20Team,%0A%0AWe%20are%20interested%20in%20an%20institutional%20or%20campus%20placement%20plan%20for%20our%20institution.%0A%0AOrganization%20Name:%0ANumber%20of%20Students:%0AContact%20Person:%0AContact%20Number:%0A";
                              return;
                            }
                            if (plan.planKey) {
                              handleUpgrade(plan.planKey);
                            }
                          }}
                          disabled={isPaying}
                          className={`w-full h-12 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                            isPopular
                              ? "bg-[#003B2D] hover:bg-[#054533] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md shadow-[#003B2D]/20 active:scale-[0.98]"
                              : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs active:scale-[0.98]"
                          }`}
                        >
                          {isPaying && payingPlan === plan.planKey ? (
                            <span>Opening checkout...</span>
                          ) : (
                            <>
                              <span>{plan.buttonCta || plan.cta}</span>
                              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Promo Coupon Section (Positioned Below Pricing Cards) ─── */}
          <div className="max-w-md mx-auto mb-16 text-center">
            <p className="text-xs text-muted-foreground font-medium mb-2.5">
              Have a promotional or partner coupon code?
            </p>
            <div className="rounded-2xl border border-slate-200/80 dark:border-border/80 bg-white/80 dark:bg-card/80 backdrop-blur-md p-2.5 sm:p-3 shadow-2xs">
              {!appliedCoupon ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="ENTER COUPON CODE"
                    className="flex-1 bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground font-mono uppercase tracking-wider outline-none focus:border-[#003B2D] dark:focus:border-emerald-500 transition-colors"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyCoupon}
                    className="h-8 px-3.5 text-xs font-bold bg-[#003B2D] hover:bg-[#054533] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shrink-0 cursor-pointer shadow-xs transition-all"
                  >
                    Apply
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Coupon Applied (30% Discount Active)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-muted-foreground hover:text-red-500 p-0.5 rounded-md transition-colors cursor-pointer"
                    title="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-red-500 font-medium mt-1.5 text-center">{couponError}</p>
              )}
            </div>
          </div>

          {/* ─── Free Starter Tier Banner (Dashboard Hero Card Vibe) ─────── */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-border/90 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-white dark:from-emerald-950/20 dark:via-card dark:to-card p-6 sm:p-7 shadow-xs mb-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300/50 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 mx-auto sm:mx-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Looking for free practice first?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Every registered student starts with 1 Free Mock Credit across Elite, Voice, and Video rounds, plus unlimited Daily Coding Challenges.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl text-xs h-10 px-5 font-bold shrink-0 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* ─── Detailed Feature Comparison Matrix ───────────────────────── */}
          <div className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Plan Comparison
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Compare All Plan Features
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Full side-by-side feature comparison between Free Starter, Voke Pro, Voke Elite, and Enterprise.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border/80 bg-slate-50 dark:bg-muted/40">
                      <th className="p-4 sm:p-5 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                        Features &amp; Capabilities
                      </th>
                      <th className="p-4 sm:p-5 text-center text-muted-foreground font-semibold">
                        Free Starter
                      </th>
                      <th className="p-4 sm:p-5 text-center text-foreground font-bold">
                        Voke Pro ({isAnnual ? "₹319/mo" : "₹399/mo"})
                      </th>
                      <th className="p-4 sm:p-5 text-center text-[#003B2D] dark:text-emerald-400 font-extrabold bg-emerald-50/60 dark:bg-emerald-500/10 border-x border-emerald-200 dark:border-emerald-500/30">
                        <div className="flex items-center justify-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Voke Elite ({isAnnual ? "₹479/mo" : "₹599/mo"})</span>
                        </div>
                      </th>
                      <th className="p-4 sm:p-5 text-center text-muted-foreground font-semibold">
                        Enterprise AI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {/* Category: Interview Formats */}
                    <tr className="bg-slate-50/50 dark:bg-muted/20">
                      <td colSpan={5} className="p-3 px-5 font-bold text-xs uppercase tracking-wider text-[#003B2D] dark:text-emerald-400">
                        Mock Interview Formats &amp; Credits
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Monthly Elite Company Credits</td>
                      <td className="p-4 text-center text-muted-foreground">1 Credit Total</td>
                      <td className="p-4 text-center text-muted-foreground">Optional Add-on</td>
                      <td className="p-4 text-center text-foreground font-bold bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        4 Credits (Up to 16 Rounds)
                      </td>
                      <td className="p-4 text-center text-muted-foreground">Custom / Unlimited</td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Pro Video AI Mock Interviews</td>
                      <td className="p-4 text-center text-muted-foreground">1 Credit Total</td>
                      <td className="p-4 text-center text-foreground font-semibold">4 Credits / Month</td>
                      <td className="p-4 text-center text-foreground font-bold bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        2 Credits Included
                      </td>
                      <td className="p-4 text-center text-muted-foreground">Campus-wide Unlimited</td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Text &amp; Voice AI Practice</td>
                      <td className="p-4 text-center text-muted-foreground">Basic Access</td>
                      <td className="p-4 text-center text-foreground font-semibold">3 Credits Included</td>
                      <td className="p-4 text-center text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        Unlimited Practice
                      </td>
                      <td className="p-4 text-center text-muted-foreground">Unlimited</td>
                    </tr>

                    {/* Category: AI Intelligence & Scoring */}
                    <tr className="bg-slate-50/50 dark:bg-muted/20">
                      <td colSpan={5} className="p-3 px-5 font-bold text-xs uppercase tracking-wider text-[#003B2D] dark:text-emerald-400">
                        AI Vision, Code IDE &amp; Analytics
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Interactive In-Browser Code IDE &amp; Compilers</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Multimodal Body Language &amp; Eye-Contact Vision</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Speech Cadence, Filler Words &amp; Tone Tracking</td>
                      <td className="p-4 text-center text-muted-foreground">Basic</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">AI Resume Keyword Optimization &amp; ATS Scoring</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                    </tr>

                    {/* Category: Placement & Institutional */}
                    <tr className="bg-slate-50/50 dark:bg-muted/20">
                      <td colSpan={5} className="p-3 px-5 font-bold text-xs uppercase tracking-wider text-[#003B2D] dark:text-emerald-400">
                        Placement &amp; Institutional Governance
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Verified Voke Scorecard for Tech Recruiter Match</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-muted-foreground">Basic Score</td>
                      <td className="p-4 text-center text-[#003B2D] dark:text-emerald-400 font-bold bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        Verified Scorecard
                      </td>
                      <td className="p-4 text-center text-muted-foreground">Campus Directory</td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Bulk Seat Management &amp; T&amp;P Officer Dashboard</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-muted-foreground bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">—</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 mx-auto stroke-[2.5]" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 px-5 text-foreground font-medium">Dedicated Success Manager &amp; 99.9% Uptime SLA</td>
                      <td className="p-4 text-center text-muted-foreground">—</td>
                      <td className="p-4 text-center text-muted-foreground">Community</td>
                      <td className="p-4 text-center text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5 border-x border-emerald-200 dark:border-emerald-500/20">
                        Priority Support
                      </td>
                      <td className="p-4 text-center text-foreground font-bold">24/7 Dedicated SLA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ─── Universities & Colleges Institutional Banner ────────────── */}
          <div className="rounded-3xl bg-gradient-to-r from-[#003B2D] via-[#054533] to-[#04422F] text-white p-7 sm:p-10 shadow-xl shadow-[#003B2D]/15 relative overflow-hidden mb-16">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/25 text-white text-xs font-semibold uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>For Universities &amp; Technical Colleges</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Power Your Campus Placement Drives with AI
                </h2>

                <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
                  Bulk seat onboarding, departmental role analytics, custom mock interview drives, and official college domain email mapping.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {[
                    "Bulk Seat Management",
                    "Custom Role Assessments",
                    "Department Analytics",
                    "Verified Student Profiles",
                    "Dedicated SLA Support",
                    "Domain Auto-Mapping",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/90">
                      <div className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Button
                  onClick={() => {
                    window.location.href =
                      "mailto:teamtryvoke@gmail.com?subject=Campus%20Placement%20Partnership%20-%20Voke%20AI&body=College%20Name:%0ACity/State:%0AT&P%20Officer%20Name:%0AOfficial%20Email:%0APhone:%0AExpected%20Student%20Count:%0A";
                  }}
                  className="bg-white hover:bg-emerald-50 text-[#003B2D] font-bold text-xs sm:text-sm h-12 px-6 rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Request Institutional Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => navigate("/college/auth")}
                  variant="outline"
                  className="border border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white text-xs sm:text-sm font-bold h-12 px-6 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 backdrop-blur-xs"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-300" />
                  <span>College Admin Portal</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Frequently Asked Questions (FAQ) ────────────────────────── */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="text-center mb-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 text-[11px] font-semibold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> FAQs
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Answers to common questions about plans, mock credits, and payments.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: "What is the difference between Voke Pro and Voke Elite?",
                  a: "Voke Pro (₹399/mo) gives you 4 Pro Video mock credits with voice/video analysis, speech cadence scoring, and detailed question breakdowns. Voke Elite (₹599/mo) is our flagship tier with 4 Elite Company interview packs (up to 16 full rounds), our interactive in-browser Code IDE & compilers, AI resume optimization, and the Verified Voke Scorecard.",
                },
                {
                  q: "How do mock credits work each month?",
                  a: "Your mock interview credits are added immediately upon subscribing and replenish automatically at each monthly billing cycle. You can track your remaining credits in real time from your dashboard.",
                },
                {
                  q: "Can I apply a coupon or promo code?",
                  a: "Yes! If you have a valid partner or promotional discount code, simply enter it in the coupon box above before checkout to unlock your savings.",
                },
                {
                  q: "What payment methods are supported?",
                  a: "We support all major Indian and international payment options via Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards (Visa, Mastercard, RuPay), and Net Banking across 50+ banks.",
                },
                {
                  q: "How does the validity of my plan work?",
                  a: "Each plan is a one-time credit pack with full validity for your chosen cycle (30 days for monthly, 365 days for annual). Credits activate immediately upon payment. We do not do surprise recurring auto-debits.",
                },
                {
                  q: "What is the Verified Voke Scorecard?",
                  a: "The Verified Voke Scorecard is an objective evaluation of your coding speed, speech clarity, structural thinking, and technical accuracy that can be linked on LinkedIn or your resume to showcase verified interview competency to tech recruiters.",
                },
              ].map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card px-5 data-[state=open]:border-emerald-500/50 shadow-2xs transition-colors"
                >
                  <AccordionTrigger className="text-left font-bold text-foreground hover:text-[#003B2D] dark:hover:text-emerald-400 py-4 text-xs sm:text-sm">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* ─── Trust Badges ────────────────────────────────────────────── */}
          <div className="text-center py-6 border-t border-border/60">
            <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Instant Activation via Razorpay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>100% Secure Checkout • Zero Hidden Fees</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default Pricing;
