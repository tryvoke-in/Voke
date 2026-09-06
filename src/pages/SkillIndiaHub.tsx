import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface Competency {
  name: string;
  status: "deficit" | "aligned" | "in_progress";
  nsqfLevel: number;
}

interface DreamRole {
  id: string;
  tabLabel: string;
  title: string;
  nsqfStandard: string;
  targetCtc: string;
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
    readinessScore: 56,
    criticalGaps: [
      { name: "Microservices & Distributed Architecture", status: "deficit", nsqfLevel: 7 },
      { name: "CI/CD Pipeline Automation (GitHub Actions / Docker)", status: "deficit", nsqfLevel: 6 },
      { name: "Redis Caching & High-Concurrency Systems", status: "deficit", nsqfLevel: 7 },
      { name: "STAR Method Technical Articulation", status: "in_progress", nsqfLevel: 6 }
    ],
    alignedSkills: [
      { name: "Relational DBMS & SQL Optimization", status: "aligned", nsqfLevel: 5 },
      { name: "Core Data Structures & Algorithms", status: "aligned", nsqfLevel: 5 },
      { name: "Object-Oriented Programming (OOP)", status: "aligned", nsqfLevel: 5 }
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
    readinessScore: 42,
    criticalGaps: [
      { name: "RAG Pipelines & Vector Database Indexing", status: "deficit", nsqfLevel: 7 },
      { name: "LangChain & Autonomous Agent Workflows", status: "deficit", nsqfLevel: 7 },
      { name: "Model Quantization & vLLM Deployment", status: "deficit", nsqfLevel: 6 },
      { name: "LLM Evaluation & Prompt Regression Testing", status: "deficit", nsqfLevel: 6 }
    ],
    alignedSkills: [
      { name: "Python Scripting & Asynchronous Code", status: "aligned", nsqfLevel: 5 },
      { name: "Classical ML Mathematics & Statistics", status: "aligned", nsqfLevel: 5 },
      { name: "REST API Integration", status: "aligned", nsqfLevel: 5 }
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
    readinessScore: 49,
    criticalGaps: [
      { name: "Kubernetes Pod Orchestration & Helm Charts", status: "deficit", nsqfLevel: 7 },
      { name: "Infrastructure as Code (Terraform / AWS)", status: "deficit", nsqfLevel: 6 },
      { name: "Automated CI/CD Deployment Gates", status: "deficit", nsqfLevel: 6 },
      { name: "Incident Triage & Production Monitoring", status: "in_progress", nsqfLevel: 6 }
    ],
    alignedSkills: [
      { name: "Linux Administration & Bash Scripting", status: "aligned", nsqfLevel: 5 },
      { name: "Computer Networking Foundations (TCP/IP)", status: "aligned", nsqfLevel: 5 },
      { name: "Git Version Control", status: "aligned", nsqfLevel: 5 }
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
    readinessScore: 61,
    criticalGaps: [
      { name: "Threat Hunting & SIEM Log Analysis", status: "deficit", nsqfLevel: 6 },
      { name: "Zero-Trust Architecture & Identity Management", status: "deficit", nsqfLevel: 7 },
      { name: "Automated SAST / DAST Vulnerability Scanning", status: "deficit", nsqfLevel: 6 }
    ],
    alignedSkills: [
      { name: "OWASP Top 10 Web Security", status: "aligned", nsqfLevel: 6 },
      { name: "Network Packet Analysis (Wireshark)", status: "aligned", nsqfLevel: 5 },
      { name: "Cryptography Fundamentals", status: "aligned", nsqfLevel: 5 }
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

  const role = ROLES_DATA.find((r) => r.id === activeRoleId) || ROLES_DATA[0];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sleek Minimalist Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              <img
                src="/images/voke_logo.png"
                alt="Voke"
                className="w-6 h-6 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-semibold text-sm tracking-tight">Voke</span>
            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Skill India & iGOT Karmayogi</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-xs h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Simple Page Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Industry Demand Alignment
            </span>
            <span className="text-xs text-slate-400">Smart India Hackathon</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Align Your Skills with 2026 Industry Standards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Compare your curriculum against live hiring demands. Bridge the gaps with certified government courses and Voke practice.
          </p>
        </div>

        {/* Minimal Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
          {ROLES_DATA.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveRoleId(r.id);
                setShowAlignedSkills(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeRoleId === r.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {r.tabLabel}
            </button>
          ))}
        </div>

        {/* Clean Hero Readiness Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {role.title}
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                ({role.nsqfStandard})
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
              <span>Target CTC: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{role.targetCtc}</strong></span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {role.criticalGaps.length} Critical Skill Deficits
              </span>
            </p>

            <div className="pt-2 max-w-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">Industry Readiness</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {role.readinessScore}%
                </span>
              </div>
              <Progress value={role.readinessScore} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setDiagnosticModalOpen(true)}
              className="text-xs h-9 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium px-4 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Verify Competency</span>
            </Button>
            <span className="text-[10px] text-slate-400 text-right">
              45-min adaptive diagnostic • Digilocker badge
            </span>
          </div>
        </div>

        {/* 2 Clean Columns: Missing Skills vs Bridge Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): What Industry Demands (Missing Gaps) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Critical Skills Missing In Standard Syllabus
              </h3>
              <span className="text-[11px] text-rose-500 font-medium">
                {role.criticalGaps.length} Deficits
              </span>
            </div>

            <div className="space-y-2">
              {role.criticalGaps.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {skill.name}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shrink-0">
                    L{skill.nsqfLevel} Gap
                  </span>
                </div>
              ))}
            </div>

            {/* Toggle Aligned Skills (Hidden by default to avoid clutter) */}
            <div className="pt-2">
              <button
                onClick={() => setShowAlignedSkills(!showAlignedSkills)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors font-medium"
              >
                {showAlignedSkills ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>
                  {showAlignedSkills ? "Hide" : "View"} {role.alignedSkills.length} already aligned college skills
                </span>
              </button>

              {showAlignedSkills && (
                <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                  {role.alignedSkills.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (6 cols): Direct Bridge Actions */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Bridge The Gap & Get Hired
              </h3>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Turnkey Solutions
              </span>
            </div>

            {/* 1. Official Government Course */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 space-y-2 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {role.topGovtCourse.portal}
                </span>
                <span className="text-slate-400">{role.topGovtCourse.duration}</span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                {role.topGovtCourse.title}
              </h4>

              <div className="pt-1 flex justify-end">
                <a
                  href={role.topGovtCourse.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  <span>Enroll Free</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. Hands-on Voke Practice */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 space-y-2 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Hands-on Practice
                </span>
                <span className="text-slate-400">Voke Engine</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {role.vokePractice.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {role.vokePractice.description}
                </p>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(role.vokePractice.toolPath)}
                  className="text-xs h-7 border-slate-200 dark:border-slate-800 gap-1"
                >
                  <span>Launch Practice</span>
                  <Zap className="w-3 h-3 text-amber-500" />
                </Button>
              </div>
            </div>

            {/* 3. Top Apprenticeship Partner Match */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500">
                  Hiring Partner Match
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {role.topJobMatch.stipend}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {role.topJobMatch.role}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {role.topJobMatch.company} • {role.topJobMatch.location}
                </p>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => toast.success(`Application submitted to ${role.topJobMatch.company}`)}
                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Quick Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Diagnostic Assessment Modal */}
      <Dialog open={diagnosticModalOpen} onOpenChange={setDiagnosticModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Competency Assessment</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              45-minute adaptive evaluation to benchmark your skills against {role.nsqfStandard}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold">{role.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Readiness:</span>
                <span className="font-semibold text-emerald-600">{role.readinessScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Badge:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Verifiable Digilocker ID</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDiagnosticModalOpen(false)}
              className="text-xs h-8"
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
