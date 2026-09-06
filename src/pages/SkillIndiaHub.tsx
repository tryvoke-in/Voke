import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings2,
  Database,
  TrendingUp,
  BookOpen,
  Laptop,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Competency {
  name: string;
  status: "deficit" | "aligned" | "in_progress";
  nsqfLevel: number;
  iconType: "layers" | "settings" | "database" | "trending";
}

interface DreamRole {
  id: string;
  tabLabel: string;
  title: string;
  nsqfStandard: string;
  targetCtc: string;
  heroIconText: string;
  readinessScore: number;
  criticalGaps: Competency[];
  alignedSkills: Competency[];
  topGovtCourse: {
    portal: string;
    title: string;
    duration: string;
    level: string;
    url: string;
  };
  vokePractice: {
    title: string;
    toolPath: string;
    description: string;
  };
  topJobMatch: {
    company: string;
    role: string;
    stipend: string;
    location: string;
  };
}

const ROLES_DATA: DreamRole[] = [
  {
    id: "sde-1",
    tabLabel: "Full Stack SDE",
    title: "Full Stack Software Engineer",
    nsqfStandard: "NSQF Level 7 • MSDE / NASSCOM",
    targetCtc: "₹12 – 24 LPA",
    heroIconText: "</>",
    readinessScore: 56,
    criticalGaps: [
      { name: "Microservices & Distributed Architecture", status: "deficit", nsqfLevel: 7, iconType: "layers" },
      { name: "CI/CD Pipeline Automation (GitHub Actions / Docker)", status: "deficit", nsqfLevel: 6, iconType: "settings" },
      { name: "Redis Caching & High-Concurrency Systems", status: "deficit", nsqfLevel: 7, iconType: "database" },
      { name: "STAR Method Technical Articulation", status: "in_progress", nsqfLevel: 6, iconType: "trending" }
    ],
    alignedSkills: [
      { name: "Relational DBMS & SQL Optimization", status: "aligned", nsqfLevel: 5, iconType: "database" },
      { name: "Core Data Structures & Algorithms", status: "aligned", nsqfLevel: 5, iconType: "layers" },
      { name: "Object-Oriented Programming (OOP)", status: "aligned", nsqfLevel: 5, iconType: "settings" }
    ],
    topGovtCourse: {
      portal: "Skill India Digital",
      title: "Cloud-Native Application Development & Microservices",
      duration: "30 Hours • Free Certificate",
      level: "NSQF Level 6",
      url: "https://www.skillindiadigital.gov.in"
    },
    vokePractice: {
      title: "Interactive Code Sandbox & DSA",
      toolPath: "/playground",
      description: "Code and verify scalable backend solutions in real time"
    },
    topJobMatch: {
      company: "Razorpay",
      role: "Backend Engineering Apprentice",
      stipend: "₹50,000 / mo",
      location: "Bangalore"
    }
  },
  {
    id: "ai-llm",
    tabLabel: "GenAI & LLM",
    title: "Generative AI & LLM Engineer",
    nsqfStandard: "NSQF Level 7 • MeitY / MSDE",
    targetCtc: "₹15 – 30 LPA",
    heroIconText: "AI",
    readinessScore: 42,
    criticalGaps: [
      { name: "RAG Pipelines & Vector Database Indexing", status: "deficit", nsqfLevel: 7, iconType: "database" },
      { name: "LangChain & Autonomous Agent Workflows", status: "deficit", nsqfLevel: 7, iconType: "layers" },
      { name: "Model Quantization & vLLM Deployment", status: "deficit", nsqfLevel: 6, iconType: "settings" },
      { name: "LLM Evaluation & Prompt Regression Testing", status: "deficit", nsqfLevel: 6, iconType: "trending" }
    ],
    alignedSkills: [
      { name: "Python Scripting & Asynchronous Code", status: "aligned", nsqfLevel: 5, iconType: "settings" },
      { name: "Classical ML Mathematics & Statistics", status: "aligned", nsqfLevel: 5, iconType: "layers" },
      { name: "REST API Integration", status: "aligned", nsqfLevel: 5, iconType: "database" }
    ],
    topGovtCourse: {
      portal: "Skill India Digital",
      title: "Applied Generative AI & Vector Search",
      duration: "40 Hours • MSDE Certified",
      level: "NSQF Level 7",
      url: "https://www.skillindiadigital.gov.in"
    },
    vokePractice: {
      title: "AI Voice Mock Interview",
      toolPath: "/voice-assistant",
      description: "Practice answering real RAG & system design rounds with AI"
    },
    topJobMatch: {
      company: "Krutrim AI",
      role: "LLM Evaluation Intern",
      stipend: "₹45,000 / mo",
      location: "Bangalore"
    }
  },
  {
    id: "devops",
    tabLabel: "Cloud & DevOps",
    title: "Cloud Infrastructure & DevOps",
    nsqfStandard: "NSQF Level 6 • SSC NASSCOM",
    targetCtc: "₹10 – 22 LPA",
    heroIconText: "OPS",
    readinessScore: 49,
    criticalGaps: [
      { name: "Kubernetes Pod Orchestration & Helm Charts", status: "deficit", nsqfLevel: 7, iconType: "layers" },
      { name: "Infrastructure as Code (Terraform / AWS)", status: "deficit", nsqfLevel: 6, iconType: "settings" },
      { name: "Automated CI/CD Deployment Gates", status: "deficit", nsqfLevel: 6, iconType: "database" },
      { name: "Incident Triage & Production Monitoring", status: "in_progress", nsqfLevel: 6, iconType: "trending" }
    ],
    alignedSkills: [
      { name: "Linux Administration & Bash Scripting", status: "aligned", nsqfLevel: 5, iconType: "settings" },
      { name: "Computer Networking Foundations (TCP/IP)", status: "aligned", nsqfLevel: 5, iconType: "database" },
      { name: "Git Version Control", status: "aligned", nsqfLevel: 5, iconType: "layers" }
    ],
    topGovtCourse: {
      portal: "iGOT Karmayogi",
      title: "Enterprise Cloud Infrastructure & Resilience",
      duration: "24 Hours • Govt Badge",
      level: "Competency Level 4",
      url: "https://igotkarmayogi.gov.in"
    },
    vokePractice: {
      title: "AI Outage Simulation",
      toolPath: "/voice-assistant",
      description: "Simulate live incident triage & root-cause technical rounds"
    },
    topJobMatch: {
      company: "Zoho Corporation",
      role: "Site Reliability Apprentice",
      stipend: "₹40,000 / mo",
      location: "Chennai"
    }
  },
  {
    id: "cyber",
    tabLabel: "Cybersecurity",
    title: "Cyber Defense & Security Analyst",
    nsqfStandard: "NSQF Level 6 • CERT-In / MSDE",
    targetCtc: "₹9 – 18 LPA",
    heroIconText: "SEC",
    readinessScore: 61,
    criticalGaps: [
      { name: "Threat Hunting & SIEM Log Analysis", status: "deficit", nsqfLevel: 6, iconType: "settings" },
      { name: "Zero-Trust Architecture & Identity Management", status: "deficit", nsqfLevel: 7, iconType: "layers" },
      { name: "Automated SAST / DAST Vulnerability Scanning", status: "deficit", nsqfLevel: 6, iconType: "database" }
    ],
    alignedSkills: [
      { name: "OWASP Top 10 Web Security", status: "aligned", nsqfLevel: 6, iconType: "settings" },
      { name: "Network Packet Analysis (Wireshark)", status: "aligned", nsqfLevel: 5, iconType: "layers" },
      { name: "Cryptography Fundamentals", status: "aligned", nsqfLevel: 5, iconType: "database" }
    ],
    topGovtCourse: {
      portal: "Skill India Digital",
      title: "National Cyber Security Framework & SOC Defense",
      duration: "25 Hours • Govt Certificate",
      level: "NSQF Level 6",
      url: "https://www.skillindiadigital.gov.in"
    },
    vokePractice: {
      title: "Security Interview Rounds",
      toolPath: "/voice-assistant",
      description: "Simulate CERT-In compliance and incident defense questions"
    },
    topJobMatch: {
      company: "L&T Technology Services",
      role: "SOC Analyst Apprentice",
      stipend: "₹35,000 / mo",
      location: "Bangalore"
    }
  }
];

export default function SkillIndiaHub() {
  const navigate = useNavigate();
  const [activeRoleId, setActiveRoleId] = useState<string>("sde-1");
  const [showAlignedSkills, setShowAlignedSkills] = useState<boolean>(false);
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("Priyanshu");
  const [userInitials, setUserInitials] = useState<string>("PS");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Priyanshu";
        setUserName(name);
        const parts = name.trim().split(" ");
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2).toUpperCase();
        setUserInitials(initials);
      }
    });
  }, []);

  const role = ROLES_DATA.find((r) => r.id === activeRoleId) || ROLES_DATA[0];

  const renderIcon = (type: string) => {
    switch (type) {
      case "layers":
        return <Layers className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
      case "settings":
        return <Settings2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
      case "database":
        return <Database className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
      case "trending":
        return <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500/20 selection:text-emerald-500 relative overflow-x-hidden pb-16">
      {/* Sleek Header with Light & Dark support, keeping ORIGINAL Voke logo */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0b0f17]/90 backdrop-blur-md transition-colors">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Left: Original Voke Logo + Skill India Badge */}
          <div className="flex items-center gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/dashboard")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
              }}
              className="flex items-center gap-2 cursor-pointer group focus:outline-none"
              title="Return to Dashboard"
            >
              {/* Original Voke Logo image as requested */}
              <img
                src="/images/voke_logo.png"
                alt="Voke Logo"
                className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Voke
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Skill India & iGOT Karmayogi</span>
            </div>
          </div>

          {/* Right: ThemeToggle, Nav Links & Profile Dropdown */}
          <div className="flex items-center gap-6">
            <ThemeToggle />

            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 pb-0.5 transition-colors"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block"
            >
              My Progress
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block"
            >
              Resources
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Profile Avatar Pill */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {userInitials}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white hidden sm:flex items-center gap-1">
                {userName}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Top Header Row with Government Accreditation Card on Right */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left Title & Subtitle */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40">
                Smart India Hackathon
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Industry Demand Alignment</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Align Your Skills with 2026 Industry Standards
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Compare your curriculum against live hiring demands. Bridge the gaps with certified government courses and Voke practice.
            </p>
          </div>

          {/* Right: Skill India & iGOT Karmayogi Logo Card */}
          <div className="shrink-0 p-3.5 px-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm flex items-center gap-6 self-start transition-colors">
            {/* Skill India Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center p-1">
                <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                  <rect x="6" y="8" width="36" height="24" rx="3" className="stroke-slate-800 dark:stroke-slate-100" strokeWidth="2.5" />
                  <line x1="2" y1="36" x2="46" y2="36" className="stroke-slate-800 dark:stroke-slate-100" strokeWidth="3" strokeLinecap="round" />
                  <path d="M16 20L22 26L32 16" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="36" cy="12" r="2.5" fill="#f59e0b" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none">Skill India</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">कौशल भारत - कुशल भारत</div>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />

            {/* iGOT Karmayogi Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center p-1">
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  <path d="M20 4C17 4 15 7 15 10C15 12 16 14 18 15C16 16 14 18 14 21C14 23 15 25 17 26V30H23V26C25 25 26 23 26 21C26 18 24 16 22 15C24 14 25 12 25 10C25 7 23 4 20 4Z" className="fill-slate-700 dark:fill-slate-200" />
                  <circle cx="20" cy="33" r="3.5" stroke="#10b981" strokeWidth="1.5" />
                  <rect x="13" y="37" width="14" height="2" rx="1" className="fill-slate-700 dark:fill-slate-200" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none">iGOT Karmayogi</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Government of India</div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Full-Width Role Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 w-full transition-colors">
          {ROLES_DATA.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveRoleId(r.id);
                setShowAlignedSkills(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${
                activeRoleId === r.id
                  ? "bg-white dark:bg-emerald-950/40 text-emerald-800 dark:text-white border border-slate-200 dark:border-emerald-500/40 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {r.tabLabel}
            </button>
          ))}
        </div>

        {/* Hero Role Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 w-full transition-colors">
          {/* Left: Role Info with </> Green Icon Box */}
          <div className="flex items-center gap-4 min-w-[320px]">
            <div className="w-13 h-13 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-mono text-xl font-bold shrink-0 p-3">
              {role.heroIconText}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {role.title}
                </h2>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  ({role.nsqfStandard})
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
                <span>Target CTC: <strong className="text-slate-900 dark:text-slate-200 font-semibold">{role.targetCtc}</strong></span>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {role.criticalGaps.length} Critical Skill Deficits
                </span>
              </p>
            </div>
          </div>

          {/* Middle: Expanded Progress Bar & Metric */}
          <div className="flex-1 max-w-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Industry Hiring Bar Readiness</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  {role.readinessScore}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Matched</span>
              </div>
            </div>

            {/* Custom rounded progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${role.readinessScore}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Benchmark mapped against MSDE NSQF Level 7 criteria and 2026 tech hiring bars.
            </p>
          </div>

          {/* Right: CTA Button */}
          <div className="flex flex-col md:items-end gap-1.5 shrink-0">
            <Button
              onClick={() => setDiagnosticModalOpen(true)}
              className="text-xs h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 rounded-xl shadow-lg shadow-emerald-600/20"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Verify Competency</span>
            </Button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              45-min adaptive test • Verifiable Digilocker ID
            </span>
          </div>
        </div>

        {/* 2 Balanced Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Left Column: Critical Skills Missing in Standard Syllabus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Critical Skills Missing in Standard Syllabus
                </h3>
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-500 font-medium">
                {role.criticalGaps.length} High-Priority Gaps
              </span>
            </div>

            {/* Skill Rows */}
            <div className="space-y-2.5">
              {role.criticalGaps.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm flex items-center justify-between gap-4 text-xs sm:text-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group cursor-default"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                      {renderIcon(skill.iconType)}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                      {skill.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-medium">
                      L{skill.nsqfLevel} Gap
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* Expandable Aligned College Skills */}
            <div className="pt-2">
              <button
                onClick={() => setShowAlignedSkills(!showAlignedSkills)}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium"
              >
                {showAlignedSkills ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>
                  {showAlignedSkills ? "Hide" : "View"} {role.alignedSkills.length} already aligned college skills
                </span>
              </button>

              {showAlignedSkills && (
                <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                  {role.alignedSkills.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bridge the Gap & Get Hired */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                Bridge the Gap & Get Hired
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Turnkey Solutions
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Card 1: Skill India Digital Course */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {role.topGovtCourse.portal}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {role.topGovtCourse.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {role.topGovtCourse.duration}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-1" />
                </div>

                <div className="pt-1 flex justify-end">
                  <a
                    href={role.topGovtCourse.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                  >
                    <span>Enroll Free on Portal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Card 2: Hands-on Practice */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Hands-on Practice
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">• Voke Engine</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {role.vokePractice.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {role.vokePractice.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(role.vokePractice.toolPath)}
                    className="text-xs h-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 gap-1.5 rounded-lg font-medium"
                  >
                    <span>Launch Practice Tool</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </Button>
                </div>
              </div>

              {/* Card 3: Hiring Partner Match */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Hiring Partner Match (NAPS Certified)
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {role.topJobMatch.role}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {role.topJobMatch.company} • {role.topJobMatch.location}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                    {role.topJobMatch.stipend}
                  </span>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`Application submitted to ${role.topJobMatch.company}`)}
                    className="text-xs h-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 gap-1.5 rounded-lg font-medium"
                  >
                    <span>Quick Apply with Voke ID</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Indian Tricolor Wave & Build for Bharat Badge (Bottom Left) */}
      <div className="fixed bottom-0 left-0 pointer-events-none z-20">
        {/* Tricolor Wave Graphic */}
        <svg
          viewBox="0 0 450 180"
          className="w-72 sm:w-96 h-auto opacity-75"
          fill="none"
        >
          {/* Saffron Ribbon */}
          <path
            d="M-20 180 C 60 140, 120 130, 240 170 C 310 190, 360 175, 420 150 L 420 180 Z"
            fill="url(#saffronGradient)"
          />
          {/* White Ribbon */}
          <path
            d="M-20 180 C 70 148, 130 138, 250 175 C 320 195, 370 182, 430 160 L 430 180 Z"
            fill="url(#whiteGradient)"
            opacity="0.85"
          />
          {/* Green Ribbon */}
          <path
            d="M-20 180 C 80 155, 140 145, 260 180 C 330 200, 380 188, 440 170 L 440 180 Z"
            fill="url(#greenGradient)"
          />
          <defs>
            <linearGradient id="saffronGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF9933" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF7700" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="whiteGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#138808" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0E6B06" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Build for Bharat Badge */}
        <div className="absolute bottom-4 left-6 pointer-events-auto">
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#090d16]/90 backdrop-blur-md shadow-lg dark:shadow-2xl flex items-center gap-2.5 transition-colors">
            <span className="text-base">🏆</span>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Build for Bharat
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Skilled for Tomorrow
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Diagnostic Assessment Modal */}
      <Dialog open={diagnosticModalOpen} onOpenChange={setDiagnosticModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#0d131f] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Competency Assessment</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              45-minute adaptive evaluation to benchmark your skills against {role.nsqfStandard}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Target Role:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{role.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Readiness:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{role.readinessScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Badge:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Verifiable Digilocker ID</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDiagnosticModalOpen(false)}
              className="text-xs h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDiagnosticModalOpen(false);
                toast.success("Diagnostic session initialized!");
                navigate("/voice-assistant");
              }}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Start Diagnostic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
