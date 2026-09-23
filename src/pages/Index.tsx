import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ArrowUpRight, Sparkles, Users, Award, Zap, Shield,
  Globe, Play, Star, Menu, X, Terminal, Code,
  Layers, MessageSquare, BarChart3, Check, CheckCircle2, Camera,
  Mic, Github, Smile, Building, MapPin, DollarSign, GraduationCap,
  ShieldCheck, Target, Activity, Cpu, Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { WAITLIST_CONFIG } from "@/config/waitlist";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { ScrollStack, ScrollStackItem } from "@/components/ScrollStack";
import { MacBookHero3D } from "@/components/landing/MacBookHero3D";
import { CompanyMarquee } from "@/components/landing/CompanyMarquee";
import { CreativeFeaturesShowcase } from "@/components/landing/CreativeFeaturesShowcase";
import { PricingScrollSection } from "@/components/landing/PricingScrollSection";
import { HiringTeamsBanner } from "@/components/landing/HiringTeamsBanner";
import { Footer } from "@/components/Footer";

interface MatchingJob {
  role: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  level: string;
  logoBg: string;
  brandColor: string;
  glowColor: string;
  tagline: string;
  about: string;
  stage: string;
  headquarters: string;
  engineeringCulture: string;
  interviewFocus: string[];
  rounds: string;
  acceptanceRate: string;
  difficulty: string;
  tags: string[];
  description: string;
}

const MATCHING_JOBS: MatchingJob[] = [
  {
    role: "Software Engineer III",
    company: "Linear",
    location: "Remote, US",
    salary: "$140k - $170k",
    score: 88,
    level: "L5 Senior",
    logoBg: "bg-zinc-800 text-white",
    brandColor: "#5E6AD2",
    glowColor: "rgba(94, 106, 210, 0.28)",
    tagline: "Purpose-built issue tracking & project intelligence tool",
    about: "Linear streamlines software projects, sprints, tasks, and bug tracking with high-performance real-time synchronization.",
    stage: "Series B • High Growth",
    headquarters: "San Francisco, CA / Remote",
    engineeringCulture: "Craftsmanship-first engineering, sub-50ms optimistic UI updates, local-first SQLite replication, and keyboard-driven workflows.",
    interviewFocus: ["Optimistic UI Architecture", "Conflict-Free Replicated Data (CRDTs)", "High-Concurrency Indexing"],
    rounds: "4 Rounds • Screen -> Architecture & Data Sync -> Code Pairing -> Founders & Product Fit",
    acceptanceRate: "~1.8%",
    difficulty: "8.8 / 10 • Rigorous",
    tags: ["System Design", "Distributed Systems", "TypeScript", "PostgreSQL"],
    description: "Build ultra-fast project intelligence tools. Requires deep mastery of optimistic UI updates and high-concurrency database indexing."
  },
  {
    role: "Frontend Specialist",
    company: "Vercel",
    location: "Remote, Global",
    salary: "$130k - $160k",
    score: 90,
    level: "Staff Specialist",
    logoBg: "bg-white text-black",
    brandColor: "#ffffff",
    glowColor: "rgba(255, 255, 255, 0.22)",
    tagline: "Frontend cloud platform for developer velocity and edge rendering",
    about: "Vercel powers the modern web with Next.js, Turbopack, and edge serverless infrastructure trusted by the world's leading brands.",
    stage: "Series D • $3.25B Valuation",
    headquarters: "San Francisco, CA / Remote",
    engineeringCulture: "Radical performance budgets, zero-layout-shift strictness, edge worker isolation, and first-principles developer ergonomics.",
    interviewFocus: ["React Server Components Internals", "Sub-millisecond Edge Streaming", "V8 Isolation & Sandbox Security"],
    rounds: "5 Rounds • Technical Screen -> System Design -> Frontend Live Coding -> Culture & Staff Bar",
    acceptanceRate: "~1.4%",
    difficulty: "9.2 / 10 • Elite",
    tags: ["Next.js", "Web Performance", "React Server Components", "Edge Runtimes"],
    description: "Architect cutting-edge developer tooling, Next.js server components, and sub-millisecond edge rendering pipelines."
  },
  {
    role: "AI / ML Infrastructure Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    salary: "$170k - $215k",
    score: 93,
    level: "Research Infra",
    logoBg: "bg-[#0F6B38] text-white",
    brandColor: "#10a37f",
    glowColor: "rgba(16, 163, 127, 0.32)",
    tagline: "Building safe, beneficial Artificial General Intelligence",
    about: "OpenAI conducts research and deploys transformative AI systems like GPT-4, o1, and ChatGPT to empower human capability worldwide.",
    stage: "Frontier AI Lab",
    headquarters: "San Francisco, CA",
    engineeringCulture: "Exascale compute orchestration, tensor-parallel training clusters, bare-metal GPU optimization, and fail-safe safety checkpoints.",
    interviewFocus: ["GPU Cluster Sharding & NCCL", "KV-Cache Memory Partitioning", "Low-Latency Transformer Serving"],
    rounds: "5 Rounds • Coding Screen -> Parallel ML Systems Design -> CUDA / Kernel Deep Dive -> Research Team Fit",
    acceptanceRate: "~0.9%",
    difficulty: "9.8 / 10 • Frontier",
    tags: ["PyTorch", "GPU Clusters", "Distributed Training", "CUDA"],
    description: "Scale large-scale model inference, GPU memory partitioning, and low-latency transformer pipeline orchestration."
  },
  {
    role: "Technical Product Manager",
    company: "Stripe",
    location: "San Francisco, CA",
    salary: "$150k - $185k",
    score: 86,
    level: "Senior TPM",
    logoBg: "bg-[#635BFF] text-white",
    brandColor: "#635BFF",
    glowColor: "rgba(99, 91, 255, 0.28)",
    tagline: "Financial infrastructure and money movement for the internet",
    about: "Stripe powers economic infrastructure for millions of businesses worldwide, handling hundreds of billions in global money movement.",
    stage: "Global FinTech Leader",
    headquarters: "San Francisco, CA / Dublin",
    engineeringCulture: "Five-nines (99.999%) availability, backward-compatible API immutability, meticulous developer documentation, and deterministic ledger consistency.",
    interviewFocus: ["API Versioning & Backward Compatibility", "Idempotency Keys & Double-charge Guards", "Global Merchant Risk Topology"],
    rounds: "4 Rounds • Product Architecture -> System Design & Pairing -> Merchant Integration -> Executive Leadership",
    acceptanceRate: "~2.4%",
    difficulty: "8.9 / 10 • High",
    tags: ["API Architecture", "Payments Infra", "Developer Experience", "Risk Systems"],
    description: "Lead API standardization and real-time payment reliability across global merchant infrastructure."
  },
  {
    role: "Backend Systems Engineer",
    company: "Supabase",
    location: "Remote, SG",
    salary: "$120k - $150k",
    score: 87,
    level: "L4 Engineer",
    logoBg: "bg-[#3ECF8E] text-black",
    brandColor: "#3ECF8E",
    glowColor: "rgba(62, 207, 142, 0.28)",
    tagline: "The open source Firebase alternative built on PostgreSQL",
    about: "Supabase provides developers with an enterprise-grade backend in minutes: Postgres database, Authentication, instant APIs, Edge Functions, and Realtime.",
    stage: "Series B • Open-Source Leader",
    headquarters: "Remote Global / Singapore",
    engineeringCulture: "Building in public, deep PostgreSQL internals, WAL replication plugins, distributed Elixir clustering, and multi-tenant Docker sandbox isolation.",
    interviewFocus: ["Postgres WAL Replication & CDC", "Multi-tenant DB Sharding", "High-throughput Realtime WebSockets"],
    rounds: "4 Rounds • Async Coding Assignment -> Postgres Deep Dive -> Realtime Architecture -> Founder Conversation",
    acceptanceRate: "~2.1%",
    difficulty: "9.0 / 10 • Very High",
    tags: ["PostgreSQL", "Go", "Realtime Elixir", "Database Replication"],
    description: "Optimize open-source database backends, write WAL replication plugins, and scale multi-tenant database clusters."
  },
  {
    role: "Distributed Cloud Architect",
    company: "Datadog",
    location: "Remote, US",
    salary: "$160k - $195k",
    score: 91,
    level: "Principal",
    logoBg: "bg-[#632CA6] text-white",
    brandColor: "#9055FF",
    glowColor: "rgba(144, 85, 255, 0.28)",
    tagline: "Cloud monitoring and security platform for modern scale",
    about: "Datadog automates infrastructure monitoring, APM, and log management to provide unified, real-time observability across cloud architectures.",
    stage: "Public (NASDAQ: DDOG)",
    headquarters: "New York, NY / Remote",
    engineeringCulture: "Petabyte-scale distributed streaming pipelines, kernel-level eBPF probes, massive high-throughput Kafka topologies, and multi-cloud resilience.",
    interviewFocus: ["Petabyte Event Stream Ingestion", "eBPF Low-overhead Telemetry", "Partitioning & Distributed Consensus"],
    rounds: "5 Rounds • Systems Coding -> Distributed Streaming Architecture -> Incident Retrospective -> Director of Engineering",
    acceptanceRate: "~1.6%",
    difficulty: "9.5 / 10 • Elite",
    tags: ["Kubernetes", "eBPF", "High Throughput", "Observability"],
    description: "Design massive-scale event ingestion systems handling billions of logs and telemetry spans per second."
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [isHeroHeaderVisible, setIsHeroHeaderVisible] = useState(false);
  const [isScrolledBeyondHero, setIsScrolledBeyondHero] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Bar theme: "black" for MacBook hero & light sections, "white" for dark sections like Job Matching
  const [barTheme, setBarTheme] = useState<"white" | "black">("black");
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const currentJob = MATCHING_JOBS[activeJobIndex] || MATCHING_JOBS[0];

  const scrollToFeatures = useCallback(() => {
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleAuthNavigation = useCallback(() => {
    const isBypassed = localStorage.getItem("voke_waitlist_bypass") === "true";
    if (WAITLIST_CONFIG.enabled && !isBypassed) {
      navigate("/waitlist");
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const handleSelectPlan = useCallback((planName: string) => {
    if (planName.toLowerCase().includes("enterprise")) {
      window.location.href = "mailto:teamtryvoke@gmail.com";
    } else {
      handleAuthNavigation();
    }
  }, [handleAuthNavigation]);

  useEffect(() => {
    // Ensure the landing page is always strictly rendered in dark theme
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    let ticking = false;

    // Cache static section boundaries to prevent expensive layout calculations on every scroll frame
    let cachedThemeSections: Array<{ top: number; bottom: number; theme: "white" | "black" }> = [];

    const measureThemeSections = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const sections = document.querySelectorAll<HTMLElement>("[data-navbar-theme]");
      cachedThemeSections = Array.from(sections).map((sec) => {
        const rect = sec.getBoundingClientRect();
        return {
          top: rect.top + scrollY,
          bottom: rect.bottom + scrollY,
          theme: (sec.getAttribute("data-navbar-theme") as "white" | "black") || "black"
        };
      });
    };

    const checkBarTheme = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const sampleY = scrollY + 50;
      let detectedBarTheme: "white" | "black" = "black";

      // Fast in-memory arithmetic check against pre-measured section boundaries
      for (let i = cachedThemeSections.length - 1; i >= 0; i--) {
        const sec = cachedThemeSections[i];
        if (sec.top <= sampleY && sec.bottom > sampleY) {
          detectedBarTheme = sec.theme;
          break;
        }
      }

      setBarTheme((prev) => (prev !== detectedBarTheme ? detectedBarTheme : prev));
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const nextBeyond = window.scrollY > window.innerHeight * 1.85;
          setIsScrolledBeyondHero((prev) => (prev !== nextBeyond ? nextBeyond : prev));
          checkBarTheme();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleResize = () => {
      measureThemeSections();
      handleScroll();
    };

    measureThemeSections();
    checkBarTheme();

    // Re-measure after initial async layout settles
    const timer = setTimeout(measureThemeSections, 600);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isHeaderVisible = isScrolledBeyondHero || isHeroHeaderVisible;

  return (
    <ReactLenis root options={{ anchors: true, lerp: 0.12, duration: 0.9, syncTouch: false }}>
      <div className="min-h-screen bg-[#06070a] text-white selection:bg-sky-500/30 font-sans antialiased overflow-x-clip relative dark isolate">
        {/* Base Solid Background beneath all negative layers */}
        <div className="absolute inset-0 bg-[#06070a] -z-30 pointer-events-none" />

        {/* Hero Ambient Glow & Precision Geometric Grid System (Subtle, Deep Charcoal-Navy Atmosphere) */}
        <div className="absolute top-0 inset-x-0 h-[100vh] min-h-[780px] max-h-[1100px] -z-10 overflow-hidden pointer-events-none">
          {/* Layer 1: Deep Dark Slate/Navy Vignette Base */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_52%_44%,rgba(15,23,42,0.55)_0%,rgba(30,41,59,0.2)_35%,rgba(6,7,10,0)_72%)]" />

          {/* Layer 2: Very Soft, Subdued Cool Steel/Azure Glow (Muted, non-overpowering) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_36%_at_52%_44%,rgba(14,116,144,0.07)_0%,rgba(3,105,161,0.03)_40%,transparent_75%)]" />

          {/* Layer 3: Ultra-Faint Center Specular Shimmer */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(56,189,248,0.04)_0%,transparent_35%)]" />

          {/* Layer 4: Precision Orthogonal Cartesian Grid (50px squares, neutral white lines) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.032)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_44%,#000_25%,transparent_90%)]" />

          {/* Layer 5: Horizon Fade into Subsequent Sections */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-[#08080c]" />
        </div>

        {/* Floating Frosted Glass Pill Navbar */}
        <nav
          className={`fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl transition-all duration-500 ease-out ${isHeaderVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-8 pointer-events-none"
            }`}
        >
          <div
            className={`relative w-full rounded-full px-6 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between overflow-hidden transition-all duration-300 ease-out backdrop-blur-2xl ${barTheme === "white"
              ? "bg-[#e0e3e8]/70 border border-zinc-400/40 text-zinc-900 shadow-[0_14px_40px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.6)] ring-1 ring-white/20"
              : "bg-[#0a0c14]/90 border border-white/18 text-zinc-300 shadow-[0_12px_36px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.14)] ring-1 ring-white/10"
              }`}
          >
            {/* Subtle top edge frosted light reflection */}
            <div
              className={`absolute inset-x-10 top-0 h-[1px] pointer-events-none transition-opacity duration-300 ${barTheme === "white"
                ? "bg-gradient-to-r from-transparent via-white/80 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                }`}
            />

            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              onClick={() => navigate("/")}
            >
              <img
                src="/images/voke_logo_nav.png"
                alt="Voke AI Tech Interview Preparation Logo"
                width={34}
                height={34}
                loading="eager"
                decoding="async"
                className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span
                className={`font-extrabold text-lg sm:text-xl tracking-tight transition-colors duration-300 ${barTheme === "white"
                  ? "text-zinc-950 group-hover:text-[#0F6B38]"
                  : "text-white group-hover:text-emerald-300"
                  }`}
              >
                Voke
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div
              className={`hidden md:flex items-center gap-7 lg:gap-8 text-[13.5px] font-medium transition-colors duration-300 ${barTheme === "white" ? "text-zinc-600" : "text-zinc-300"
                }`}
            >
              <a
                href="#features"
                className={`transition-colors py-0.5 ${barTheme === "white" ? "hover:text-black font-semibold" : "hover:text-white"
                  }`}
              >
                Features
              </a>
              <a
                href="#job-matching"
                className={`transition-colors py-0.5 ${barTheme === "white" ? "hover:text-black font-semibold" : "hover:text-white"
                  }`}
              >
                Job Matching
              </a>
              <a
                href="#how-it-works"
                className={`transition-colors py-0.5 ${barTheme === "white" ? "hover:text-black font-semibold" : "hover:text-white"
                  }`}
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className={`transition-colors py-0.5 ${barTheme === "white" ? "hover:text-black font-semibold" : "hover:text-white"
                  }`}
              >
                Pricing
              </a>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Button
                onClick={() => navigate("/college/auth")}
                className={`text-xs font-medium px-3.5 sm:px-4 h-8.5 rounded-full flex items-center gap-1.5 transition-all duration-300 shadow-xs hover:scale-105 shrink-0 ${barTheme === "white"
                  ? "bg-white hover:bg-zinc-50 border border-zinc-300/90 text-zinc-800 hover:text-black"
                  : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-emerald-500/40 text-zinc-200 hover:text-white"
                  }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${barTheme === "white" ? "text-emerald-700" : "text-emerald-400"
                  }`} />
                <span className="whitespace-nowrap">Sign in as College</span>
              </Button>
              <Button
                onClick={handleAuthNavigation}
                className={`bg-[#0F6B38] hover:bg-[#0B572D] text-white font-semibold text-xs px-3.5 sm:px-4 h-8.5 rounded-full border border-emerald-500/30 flex items-center gap-1 transition-all duration-300 hover:scale-105 shrink-0 ${barTheme === "white" ? "shadow-md shadow-emerald-900/25" : "shadow-md shadow-emerald-950/40"
                  }`}
              >
                <span className="whitespace-nowrap">Sign In</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              </Button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                onClick={handleAuthNavigation}
                className="bg-[#0F6B38] text-white text-[11px] font-bold px-3.5 h-7.5 rounded-full border border-emerald-500/30"
              >
                Sign In
              </Button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-1.5 transition-colors duration-300 ${barTheme === "white" ? "text-zinc-800 hover:text-black" : "text-zinc-300 hover:text-white"
                  }`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`fixed inset-0 z-40 backdrop-blur-2xl pt-24 px-6 md:hidden transition-colors duration-300 ${barTheme === "white" ? "bg-white/98 text-zinc-900" : "bg-[#050508]/98 text-white"
                }`}
            >
              <div className="flex flex-col gap-8 text-center">
                {["Features", "Job Matching", "How it Works", "Pricing"].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`text-2xl font-semibold transition-colors ${barTheme === "white" ? "text-zinc-700 hover:text-black" : "text-gray-300 hover:text-white"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="flex flex-col gap-3 mt-8">
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/college/auth");
                    }}
                    variant="ghost"
                    className={`w-full border rounded-full h-12 flex items-center justify-center gap-2 font-medium transition-colors ${barTheme === "white"
                      ? "border-zinc-300 text-zinc-800 hover:text-black hover:bg-zinc-100"
                      : "border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <GraduationCap className={`w-5 h-5 ${barTheme === "white" ? "text-emerald-700" : "text-zinc-400"}`} />
                    Sign in as College
                  </Button>
                  <Button
                    onClick={handleAuthNavigation}
                    className="w-full bg-[#0F6B38] hover:bg-[#0B572D] text-white rounded-full h-12 flex items-center justify-center font-semibold border border-emerald-500/30 shadow-lg shadow-emerald-950/40"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main id="main-content">
          {/* 3D MacBook Model Scroll Opening & Live Elite Prep AI Interview Hero */}
          <div data-navbar-theme="black">
            <MacBookHero3D
              onScrollToFeatures={scrollToFeatures}
              onHeaderVisibilityChange={setIsHeroHeaderVisible}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* LIGHT THEME ZONE — Elevated Card Sheet with Subtle Grid       */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            data-navbar-theme="black"
            className="relative z-20 -mt-10 sm:-mt-14 md:-mt-20 rounded-t-[36px] sm:rounded-t-[48px] md:rounded-t-[64px] bg-[#f8faf9] text-[#1a1a1a] border-t border-emerald-500/20 shadow-[0_-25px_60px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            {/* Subtle luminous emerald top horizon line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0F6B38] via-emerald-400 to-transparent opacity-80" />

            {/* Ambient subtle green engineering grid matching reference */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F6B3808_1px,transparent_1px),linear-gradient(to_bottom,#0F6B3808_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Scrolling Company Logos Marquee */}
            <CompanyMarquee />

            {/* Creative Interactive Features Showcase */}
            <CreativeFeaturesShowcase />
          </div>{/* End Light Theme Zone */}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DARK THEME ZONE — Starting at Job Alignment Section             */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            data-navbar-theme="white"
            className="relative z-30 -mt-10 sm:-mt-14 md:-mt-20 rounded-t-[36px] sm:rounded-t-[48px] md:rounded-t-[64px] bg-[#05070c] text-white border-t border-emerald-500/30 overflow-hidden"
          >
            {/* Luminous emerald horizon line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 via-[#0F6B38] to-transparent opacity-90" />

            {/* Ambient Top Aurora Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14)_0%,rgba(56,189,248,0.06)_40%,transparent_70%)] blur-2xl pointer-events-none" />

            {/* Precision Engineering Cartesian Grid (MacBook section grid lines) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

            {/* Job Match & Verified Score Placement */}
            <section id="job-matching" style={{ contentVisibility: "auto", containIntrinsicSize: "850px" }} className="py-24 md:py-32 bg-transparent relative overflow-hidden transition-colors duration-700">
              {/* Sticky Background Horizon: Stays pinned in viewport behind cards as user scrolls */}
              <div className="sticky top-0 h-screen w-full pointer-events-none flex items-center justify-center -mb-[100vh] z-0 overflow-hidden">
                {/* Dynamic Company Ambient Glow Aura */}
                <div
                  className="absolute inset-0 transition-all duration-700 opacity-60"
                  style={{
                    background: `radial-gradient(circle 800px at 50% 50%, ${currentJob.glowColor}, transparent 70%)`
                  }}
                />

                {/* Giant Ambient Company Watermark - Stays fixed behind active cards throughout the section */}
                <div className="font-black text-[18vw] md:text-[22vw] leading-none tracking-tighter uppercase select-none transition-all duration-700 opacity-[0.065] text-white whitespace-nowrap">
                  {currentJob.company}
                </div>
              </div>

              <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-5xl">
                {/* Centered Heading */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" /> Job Alignment
                  </div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-serif text-3xl md:text-5xl font-normal tracking-tight leading-tight text-white"
                  >
                    Discover Jobs Based on <br />
                    <span className="italic text-emerald-400">
                      Your Interview Scores
                    </span>
                  </motion.h2>
                  <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                    Compare your mock interview scores against active industry role benchmarks and track your hiring readiness in real time.
                  </p>
                </div>

                {/* Center Full-width Stacking Cards */}
                <div className="w-full max-w-3xl mx-auto relative">
                  <ScrollStack
                    useWindowScroll={true}
                    itemDistance={80}
                    itemScale={0.03}
                    itemStackDistance={22}
                    stackPosition="18%"
                    baseScale={0.88}
                    rotationAmount={0.5}
                    onActiveIndexChange={setActiveJobIndex}
                  >
                    {MATCHING_JOBS.map((job, idx) => (
                      <ScrollStackItem key={idx}>
                        <div
                          onMouseEnter={() => setActiveJobIndex(idx)}
                          className="space-y-4"
                        >
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl ${job.logoBg} flex items-center justify-center font-bold text-base shadow-md shrink-0 border border-white/10`}>
                                {job.company[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-base md:text-lg text-white truncate">{job.role}</h4>
                                  <span className="text-[10px] font-semibold text-zinc-300 bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-full">
                                    {job.level}
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-400 font-medium">{job.company}</p>
                              </div>
                            </div>

                            <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-full whitespace-nowrap shrink-0">
                              Score &ge; {job.score}+
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                            {job.description}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {job.tags.map((tag) => (
                              <span key={tag} className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-300 font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Footer with metadata & CTA */}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-wrap gap-3">
                            <div className="flex items-center gap-5 text-xs text-zinc-400">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-zinc-500" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-zinc-500" />
                                <span className="font-semibold text-white">{job.salary}</span>
                              </div>
                            </div>

                            <Button
                              onClick={handleAuthNavigation}
                              className="bg-[#0F6B38] text-white border border-emerald-500/30 hover:bg-[#0B572D] rounded-xl text-xs px-5 h-9 flex items-center gap-2 transition-all duration-300 font-bold shadow-md group cursor-pointer"
                            >
                              <span>Check Match</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </div>
                        </div>
                      </ScrollStackItem>
                    ))}
                  </ScrollStack>
                </div>
              </div>
            </section>

          </div>{/* End Dark Theme Zone (ends right after Job Matching) */}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* LIGHT THEME ZONE — Starting from How Voke Works                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            data-navbar-theme="black"
            className="relative z-30 -mt-10 sm:-mt-14 md:-mt-20 rounded-t-[36px] sm:rounded-t-[48px] md:rounded-t-[64px] bg-[#f8faf9] text-[#1a1a1a] border-t border-emerald-500/20 shadow-[0_-25px_60px_rgba(0,0,0,0.55)]"
          >
            {/* Subtle luminous emerald top horizon line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0F6B38] via-emerald-400 to-transparent opacity-80" />

            {/* Ambient subtle green engineering grid matching features section */}
            <div
              className="absolute inset-0 pointer-events-none select-none opacity-60"
              style={{
                backgroundImage: "linear-gradient(rgba(0,59,45,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,59,45,0.06) 1px, transparent 1px)",
                backgroundSize: "60px 60px"
              }}
            />

            {/* How It Works Section */}
            <section id="how-it-works" style={{ contentVisibility: "auto", containIntrinsicSize: "750px" }} className="py-20 md:py-28 relative overflow-hidden bg-transparent">
              <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
                <div className="text-center mb-16 sm:mb-20 max-w-2xl mx-auto space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3ED] border border-[#CFDDD2] text-[#0F6B38] text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Three-Step Flow
                  </div>
                  <h2 className="font-serif text-3xl md:text-5xl font-normal tracking-tight text-[#003B2D]">
                    How Voke <span className="italic text-[#0F6B38]">Works</span>
                  </h2>
                  <p className="text-base text-[#557564] leading-relaxed">
                    Three simple steps to test your skills, master interview rounds, and get placed.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative max-w-6xl mx-auto">
                  {/* Connecting Line */}
                  <div className="hidden md:block absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#0F6B38]/20 to-transparent -translate-y-1/2 z-0" />

                  {[
                    {
                      step: "01",
                      title: "AI Mock Interviews",
                      desc: "Conduct live video or voice AI mock interviews. Respond to resume-tailored prompts, DSA problems, and real-time coding challenges."
                    },
                    {
                      step: "02",
                      title: "Verify Scorecard",
                      desc: "AI coach generates detailed reports mapping behavioral alignment, speech pace, posture, and technical logic structures."
                    },
                    {
                      step: "03",
                      title: "Get Hired",
                      desc: "Your scorecard triggers direct job matching filters, placing your profile instantly before matching tech employers."
                    }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="relative z-10 bg-white border border-[#DCE7DF] p-8 rounded-[28px] text-center group hover:border-[#0F6B38]/40 hover:shadow-[0_16px_36px_rgba(0,59,45,0.08)] shadow-[0_4px_20px_rgba(0,59,45,0.04)] transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-[#EAF3ED] border border-[#CFDDD2] flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-[#0F6B38] group-hover:scale-105 group-hover:bg-[#0F6B38] group-hover:text-white transition-all duration-300 shadow-xs">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold text-[#003B2D] mb-3 group-hover:text-[#0F6B38] transition-colors">{item.title}</h3>
                      <p className="text-sm text-[#557564] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing Section with ScrollSplitCard Component */}
            <PricingScrollSection onSelectPlan={handleSelectPlan} />

            {/* Voke for Universities & Colleges B2B Section */}
            <section id="for-colleges" style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }} className="pt-20 pb-28 md:pb-32 relative bg-transparent border-t border-[#DCE7DF] overflow-hidden">
              <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
                {/* Simplified & Cleaned College Enterprise Banner in Royal Oxford Navy */}
                <div className="rounded-[32px] sm:rounded-[36px] bg-gradient-to-br from-[#071126] via-[#0d1e40] to-[#050b18] border border-sky-500/25 p-7 sm:p-10 md:p-12 lg:p-14 shadow-[0_25px_65px_rgba(5,15,40,0.30)] relative overflow-hidden text-white">
                  {/* Precision Engineering Cartesian Grid */}
                  <div
                    className="absolute inset-0 pointer-events-none select-none opacity-40 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_50%,#000_40%,transparent_95%)]"
                    style={{
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                      backgroundSize: "48px 48px"
                    }}
                  />

                  {/* Atmospheric Ambient Lighting Glows */}
                  <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/12 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
                    {/* Left Column: Copy & Simple Chips */}
                    <div className="max-w-2xl space-y-5">
                      {/* Top Badge */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-sky-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm shadow-2xs">
                        <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                        <span>For Universities &amp; Technical Colleges</span>
                      </div>

                      {/* Main Headline */}
                      <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal tracking-tight text-white leading-[1.12]">
                        Power Your Campus Placements With <br className="hidden sm:inline" />
                        <span className="italic text-sky-300">
                          Enterprise AI Drives
                        </span>
                      </h2>

                      {/* Subtitle Description */}
                      <p className="text-slate-200/85 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                        Give your students an unfair placement advantage with university-wide AI mock interviews, automated domain mapping, and live batch readiness dashboards.
                      </p>

                      {/* 3 Clean Feature Chips in Same Line with contextual symbols */}
                      <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 pt-1 overflow-x-auto no-scrollbar">
                        {[
                          { label: "Instant @*.edu.in sync", icon: ShieldCheck },
                          { label: "Role-based campus drives", icon: Target },
                          { label: "Live T&P readiness intel", icon: Activity },
                        ].map((chip) => {
                          const Icon = chip.icon;
                          return (
                            <span
                              key={chip.label}
                              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/95 text-xs font-medium backdrop-blur-md flex items-center gap-1.5 transition-all duration-200 shadow-2xs whitespace-nowrap shrink-0"
                            >
                              <Icon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span>{chip.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: High-Impact CTAs & Subtext */}
                    <div className="flex flex-col items-start lg:items-end justify-center gap-3 pt-2 lg:pt-0 shrink-0">
                      <Button
                        onClick={() => navigate("/college/auth?mode=register")}
                        className="bg-white hover:bg-zinc-100 text-[#091533] hover:text-[#0c204d] font-bold px-8 py-6 rounded-full text-base shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] hover:scale-105 transition-all duration-300 flex items-center gap-2 group cursor-pointer border border-white/20"
                      >
                        <span>Onboard Your College</span>
                        <ArrowUpRight className="w-5 h-5 text-[#091533] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Button>

                      <p className="text-xs text-sky-200/70 text-left lg:text-right font-normal">
                        Trusted by top engineering institutions &amp; technical colleges
                      </p>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* FOR HIRING TEAMS & COMPANIES SELLING BANNER                   */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <HiringTeamsBanner />
              </div>
            </section>

          </div>{/* End Second Light Theme Zone */}

        </main>


        {/* Footer */}
        <Footer />
      </div>
    </ReactLenis>
  );
};

export default Index;