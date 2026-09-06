import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ArrowLeft,
  Download,
  AlertTriangle,
  Clock,
  Building2,
  Layers,
  Search,
  Target,
  FileSpreadsheet,
  BookOpen,
  Zap,
  Printer,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Compass,
  Briefcase,
  TrendingUp,
  Cpu,
  GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

// iGOT Karmayogi FRAC Competency Model
interface Competency {
  name: string;
  category: "domain" | "functional" | "behavioral";
  status: "aligned" | "deficit" | "in_progress";
  nsqfLevel: number;
  industryWeight: "High" | "Critical" | "Moderate";
}

interface DreamRole {
  id: string;
  title: string;
  nsqfRoleCode: string;
  targetNsqfLevel: number;
  marketDemand: "Surge Demand" | "High Demand";
  avgStartingCtc: string;
  readinessScore: number;
  competencies: Competency[];
  recommendedGovtCourses: {
    portal: "Skill India Digital" | "iGOT Karmayogi" | "SWAYAM / NPTEL";
    courseCode: string;
    title: string;
    duration: string;
    level: string;
    url: string;
  }[];
  vokePracticeTools: {
    title: string;
    toolPath: string;
    outcome: string;
  }[];
  apprenticeshipMatches: {
    company: string;
    stipend: string;
    location: string;
    role: string;
    scheme: string;
  }[];
}

const DREAM_ROLES: DreamRole[] = [
  {
    id: "sde-1",
    title: "Full Stack SDE-1 (Product / Unicorn)",
    nsqfRoleCode: "QP-NOS: SSC/Q0508 (Software Developer)",
    targetNsqfLevel: 7,
    marketDemand: "Surge Demand",
    avgStartingCtc: "₹12 - 24 LPA",
    readinessScore: 56,
    competencies: [
      { name: "Microservices & API Architecture", category: "domain", status: "deficit", nsqfLevel: 7, industryWeight: "Critical" },
      { name: "Redis Caching & Data Sharding", category: "domain", status: "deficit", nsqfLevel: 7, industryWeight: "Critical" },
      { name: "Modern TypeScript & Next.js", category: "domain", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Relational DBMS & SQL Optimization", category: "domain", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "CI/CD Pipeline Automation (GitHub Actions)", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "Critical" },
      { name: "Test-Driven Development (Jest / PyTest)", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Agile Sprint Execution & JIRA Workflow", category: "functional", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "STAR Method Technical Articulation", category: "behavioral", status: "in_progress", nsqfLevel: 6, industryWeight: "High" },
      { name: "Cross-Functional Code Reviews", category: "behavioral", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" }
    ],
    recommendedGovtCourses: [
      {
        portal: "Skill India Digital",
        courseCode: "SID-SD01",
        title: "Cloud-Native Application Development & Microservices",
        duration: "30 Hours • Free Certified",
        level: "NSQF Level 6",
        url: "https://www.skillindiadigital.gov.in"
      },
      {
        portal: "iGOT Karmayogi",
        courseCode: "IGOT-CS04",
        title: "Agile Engineering & DevOps Pipeline Implementation",
        duration: "16 Hours • Govt Digital Badge",
        level: "Competency Level 4",
        url: "https://igotkarmayogi.gov.in"
      },
      {
        portal: "SWAYAM / NPTEL",
        courseCode: "NPTEL-CS72",
        title: "Scalable Distributed Systems & High Performance Computing",
        duration: "8 Weeks • IIT Certified",
        level: "NSQF Level 7 Equivalent",
        url: "https://swayam.gov.in"
      }
    ],
    vokePracticeTools: [
      { title: "Curated DSA Problem Sheet", toolPath: "/dsa-sheet", outcome: "Master LeetCode Medium/Hard patterns for SDE-1 screening" },
      { title: "Interactive Code Sandbox", toolPath: "/playground", outcome: "Practice fullstack TypeScript & algorithms with live compiler" },
      { title: "AI Technical Voice Coach", toolPath: "/voice-assistant", outcome: "Conduct realistic mock voice interviews with STAR evaluation" }
    ],
    apprenticeshipMatches: [
      { company: "Tata Consultancy Services (Digital)", stipend: "₹38,000 / month", location: "Bangalore / Hybrid", role: "Junior SDE Apprentice", scheme: "NAPS Certified" },
      { company: "Razorpay Software", stipend: "₹50,000 / month", location: "Bangalore", role: "Backend Engineering Intern", scheme: "Skill India Partner" },
      { company: "Persistent Systems", stipend: "₹35,000 / month", location: "Pune", role: "Cloud Full Stack Trainee", scheme: "NAPS Certified" }
    ]
  },
  {
    id: "ai-llm",
    title: "Generative AI & LLM Application Engineer",
    nsqfRoleCode: "QP-NOS: SSC/Q8102 (AI / Data Specialist)",
    targetNsqfLevel: 7,
    marketDemand: "Surge Demand",
    avgStartingCtc: "₹15 - 30 LPA",
    readinessScore: 42,
    competencies: [
      { name: "RAG Pipelines & Vector Databases", category: "domain", status: "deficit", nsqfLevel: 7, industryWeight: "Critical" },
      { name: "LangChain & Agentic Tool Calling", category: "domain", status: "deficit", nsqfLevel: 7, industryWeight: "Critical" },
      { name: "Model Quantization & vLLM Deployment", category: "domain", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Classical Machine Learning Math", category: "domain", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "LLM Evaluation & Prompt Regression Testing", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "Critical" },
      { name: "API Cost & Latency Optimization", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Python Asynchronous Data Pipelines", category: "functional", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "Ethical AI & Bias Mitigation Articulation", category: "behavioral", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "Technical Whitepaper Communication", category: "behavioral", status: "in_progress", nsqfLevel: 6, industryWeight: "High" }
    ],
    recommendedGovtCourses: [
      {
        portal: "Skill India Digital",
        courseCode: "SID-AI03",
        title: "Applied Generative AI, Embeddings & Large Language Models",
        duration: "40 Hours • MSDE Certified",
        level: "NSQF Level 7",
        url: "https://www.skillindiadigital.gov.in"
      },
      {
        portal: "iGOT Karmayogi",
        courseCode: "IGOT-AI01",
        title: "Digital Public Goods & AI Governance Standards",
        duration: "12 Hours • DoPT Verified",
        level: "Competency Level 4",
        url: "https://igotkarmayogi.gov.in"
      },
      {
        portal: "SWAYAM / NPTEL",
        courseCode: "NPTEL-AI44",
        title: "Deep Learning Foundations & Neural Network Architectures",
        duration: "12 Weeks • IIT Madras",
        level: "NSQF Level 7",
        url: "https://swayam.gov.in"
      }
    ],
    vokePracticeTools: [
      { title: "AI Voice Agent Interview", toolPath: "/voice-assistant", outcome: "Practice RAG architecture & LLM system design mock questions" },
      { title: "Elite Preparation Track", toolPath: "/elite-prep", outcome: "Prepare for high-bar algorithmic rounds in AI startups" }
    ],
    apprenticeshipMatches: [
      { company: "Krutrim AI / Ola Tech", stipend: "₹45,000 / month", location: "Bangalore", role: "LLM Data & Evaluation Intern", scheme: "Skill India Partner" },
      { company: "Infosys AI Innovation Labs", stipend: "₹36,000 / month", location: "Hyderabad", role: "Generative AI Trainee", scheme: "NAPS Certified" }
    ]
  },
  {
    id: "devops-cloud",
    title: "Cloud Infrastructure & DevOps Engineer",
    nsqfRoleCode: "QP-NOS: SSC/Q0509 (Cloud Administrator / DevOps)",
    targetNsqfLevel: 6,
    marketDemand: "High Demand",
    avgStartingCtc: "₹10 - 22 LPA",
    readinessScore: 49,
    competencies: [
      { name: "Docker Containerization & Multi-stage Builds", category: "domain", status: "deficit", nsqfLevel: 6, industryWeight: "Critical" },
      { name: "Kubernetes Pod Orchestration & Helm", category: "domain", status: "deficit", nsqfLevel: 7, industryWeight: "Critical" },
      { name: "Infrastructure as Code (Terraform)", category: "domain", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Linux Bash Scripting & Networking", category: "domain", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "CI/CD Deployment & Automated Testing", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "Critical" },
      { name: "Monitoring & Alerting (Prometheus / Grafana)", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Incident Triage & Root Cause Analysis", category: "behavioral", status: "in_progress", nsqfLevel: 6, industryWeight: "High" },
      { name: "Collaborative Post-Mortem Documentation", category: "behavioral", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" }
    ],
    recommendedGovtCourses: [
      {
        portal: "Skill India Digital",
        courseCode: "SID-CL02",
        title: "Enterprise Cloud Infrastructure & Kubernetes Management",
        duration: "35 Hours • MSDE Aligned",
        level: "NSQF Level 6",
        url: "https://www.skillindiadigital.gov.in"
      },
      {
        portal: "iGOT Karmayogi",
        courseCode: "IGOT-CY02",
        title: "Cyber Resilience & Secure Cloud Configuration",
        duration: "20 Hours • DoPT Verified",
        level: "Competency Level 4",
        url: "https://igotkarmayogi.gov.in"
      }
    ],
    vokePracticeTools: [
      { title: "Live Code Playground", toolPath: "/playground", outcome: "Run and test bash scripts, algorithms, and build processes" },
      { title: "AI Technical Voice Coach", toolPath: "/voice-assistant", outcome: "Simulate live production outage triage & incident interview scenarios" }
    ],
    apprenticeshipMatches: [
      { company: "Wipro Cloud Practice", stipend: "₹32,000 / month", location: "Pune / Noida", role: "Cloud Operations Apprentice", scheme: "NAPS Certified" },
      { company: "Zoho Corporation", stipend: "₹40,000 / month", location: "Chennai", role: "Site Reliability Intern", scheme: "Skill India Partner" }
    ]
  },
  {
    id: "cyber-analyst",
    title: "Cyber Defense & Security Analyst",
    nsqfRoleCode: "QP-NOS: SSC/Q0901 (Information Security Analyst)",
    targetNsqfLevel: 6,
    marketDemand: "High Demand",
    avgStartingCtc: "₹9 - 18 LPA",
    readinessScore: 61,
    competencies: [
      { name: "Threat Hunting & SIEM Log Analysis", category: "domain", status: "deficit", nsqfLevel: 6, industryWeight: "Critical" },
      { name: "OWASP Top 10 Vulnerability Assessment", category: "domain", status: "aligned", nsqfLevel: 6, industryWeight: "High" },
      { name: "Network Packet Analysis (Wireshark)", category: "domain", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "Zero Trust Architecture Implementation", category: "domain", status: "deficit", nsqfLevel: 7, industryWeight: "Critical" },
      { name: "Automated DAST/SAST Security Scanning", category: "functional", status: "deficit", nsqfLevel: 6, industryWeight: "High" },
      { name: "Security Compliance & CERT-In Guidelines", category: "functional", status: "aligned", nsqfLevel: 5, industryWeight: "Moderate" },
      { name: "Incident Communication Under Pressure", category: "behavioral", status: "in_progress", nsqfLevel: 6, industryWeight: "High" }
    ],
    recommendedGovtCourses: [
      {
        portal: "Skill India Digital",
        courseCode: "SID-CS01",
        title: "National Cyber Security Framework & Ethical Defense",
        duration: "25 Hours • Govt Certificate",
        level: "NSQF Level 6",
        url: "https://www.skillindiadigital.gov.in"
      },
      {
        portal: "iGOT Karmayogi",
        courseCode: "IGOT-SEC01",
        title: "Information Security Auditing & Governance",
        duration: "18 Hours • Govt Badge",
        level: "Competency Level 4",
        url: "https://igotkarmayogi.gov.in"
      }
    ],
    vokePracticeTools: [
      { title: "Technical Voice Coach", toolPath: "/voice-assistant", outcome: "Answer deep-dive network security & incident response rounds" },
      { title: "DSA Problem Practice", toolPath: "/question-practice", outcome: "Sharpen data structure foundations tested in OA screens" }
    ],
    apprenticeshipMatches: [
      { company: "L&T Technology Services", stipend: "₹35,000 / month", location: "Bangalore", role: "SOC Analyst Apprentice", scheme: "NAPS Certified" }
    ]
  }
];

export default function SkillIndiaHub() {
  const navigate = useNavigate();

  // State
  const [selectedRoleId, setSelectedRoleId] = useState<string>("sde-1");
  const [competencyCategoryFilter, setCompetencyCategoryFilter] = useState<string>("all");
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const currentRole = DREAM_ROLES.find(r => r.id === selectedRoleId) || DREAM_ROLES[0];

  // Competency filter
  const filteredCompetencies = currentRole.competencies.filter(c => {
    if (competencyCategoryFilter === "all") return true;
    return c.category === competencyCategoryFilter;
  });

  const deficitCount = currentRole.competencies.filter(c => c.status === "deficit").length;
  const alignedCount = currentRole.competencies.filter(c => c.status === "aligned").length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between py-3">
          {/* Logo & Alignment Tag */}
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
                alt="Voke Logo"
                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-white dark:to-slate-400 bg-clip-text text-transparent">
                Voke
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                <span>Skill India / iGOT Alignment</span>
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-xs h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="text-xs h-8 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              <span>Competency Card</span>
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* National Skilling Banner & Problem Statement Focus */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20 dark:border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40">
                National Skilling Alignment Engine
              </Badge>
              <span className="text-xs text-slate-500">NSQF Levels 5–7 • iGOT FRAC Model</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Aligning Skill Development with Emerging Job Market Demands
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
              Directly resolving the gap between conventional skilling certifications and 2025/2026 tech company hiring criteria. Connect your competency profile to accredited government training, hands-on Voke practice, and high-paying dream jobs.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              size="sm"
              onClick={() => setDiagnosticModalOpen(true)}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify My Competency Level</span>
            </Button>
          </div>
        </div>

        {/* 4 Core Competency Metric Scorecard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Industry Readiness</span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {currentRole.readinessScore}% Matched
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {currentRole.readinessScore}%
                </span>
                <span className="text-[10px] text-slate-400">vs 2026 hiring bar</span>
              </div>
              <Progress value={currentRole.readinessScore} className="h-1 mt-2 bg-slate-100 dark:bg-slate-800" />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Target NSQF Level</span>
                <span className="text-[10px] font-mono text-slate-400">MSDE Standard</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  Level {currentRole.targetNsqfLevel}
                </span>
                <span className="text-[10px] text-slate-400">Tech Specialist</span>
              </div>
              <span className="block text-[10px] text-slate-500 mt-2 truncate">
                {currentRole.nsqfRoleCode}
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>iGOT Competency Gaps</span>
                <AlertTriangle className="w-3 h-3 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {deficitCount} Deficits
                </span>
                <span className="text-[10px] text-slate-400">({alignedCount} aligned)</span>
              </div>
              <span className="block text-[10px] text-slate-500 mt-2 truncate">
                High-priority skills missing in standard syllabus
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Fast-track Bridge</span>
                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  4 - 6 Weeks
                </span>
                <span className="text-[10px] text-slate-400">micro-sprint</span>
              </div>
              <span className="block text-[10px] text-slate-500 mt-2 truncate">
                SIDH Courses + Voke AI Practice
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Section: Dream Job Competency Navigator */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Dream Job Competency Navigator (iGOT FRAC Model)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select your target career to view real-time domain, functional, and behavioral competency requirements.
              </p>
            </div>

            {/* Role Switcher */}
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="h-8 text-xs w-[240px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium">
                <SelectValue placeholder="Select Target Dream Role" />
              </SelectTrigger>
              <SelectContent>
                {DREAM_ROLES.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Summary Banner */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {currentRole.title}
                </span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {currentRole.marketDemand}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Target CTC: <strong className="text-slate-700 dark:text-slate-300">{currentRole.avgStartingCtc}</strong> • {currentRole.nsqfRoleCode}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button
                variant={competencyCategoryFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCompetencyCategoryFilter("all")}
                className="h-7 text-[11px] px-2.5"
              >
                All ({currentRole.competencies.length})
              </Button>
              <Button
                variant={competencyCategoryFilter === "domain" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCompetencyCategoryFilter("domain")}
                className="h-7 text-[11px] px-2.5"
              >
                Domain
              </Button>
              <Button
                variant={competencyCategoryFilter === "functional" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCompetencyCategoryFilter("functional")}
                className="h-7 text-[11px] px-2.5"
              >
                Functional
              </Button>
              <Button
                variant={competencyCategoryFilter === "behavioral" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCompetencyCategoryFilter("behavioral")}
                className="h-7 text-[11px] px-2.5"
              >
                Behavioral
              </Button>
            </div>
          </div>

          {/* Competency Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredCompetencies.map((comp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {comp.name}
                  </span>
                  {comp.status === "deficit" ? (
                    <Badge variant="outline" className="text-[9px] py-0 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 shrink-0">
                      Syllabus Deficit
                    </Badge>
                  ) : comp.status === "in_progress" ? (
                    <Badge variant="outline" className="text-[9px] py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 shrink-0">
                      In Progress
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                      Aligned
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="capitalize font-medium text-slate-500">{comp.category} Competency</span>
                  <span>NSQF L{comp.nsqfLevel} • {comp.industryWeight} Weight</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Section: Government Skilling Bridge + Voke Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Column 1: Government Accredited Courses (Skill India / iGOT) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Accredited Govt Skill Courses (SIDH & iGOT)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Free / Subsidized</span>
            </div>

            <div className="space-y-2.5">
              {currentRole.recommendedGovtCourses.map((course, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs space-y-1.5 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {course.portal} • {course.courseCode}
                    </Badge>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {course.level}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    {course.title}
                  </h4>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">{course.duration}</span>
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500 font-medium"
                    >
                      <span>Enroll on Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Hands-on Voke Competency Verification & Tools */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Hands-on Competency Verification (Voke Engine)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Prove Skill to Recruiters</span>
            </div>

            <div className="space-y-2.5">
              {currentRole.vokePracticeTools.map((tool, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs space-y-1.5 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {tool.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Interactive Practice
                    </Badge>
                  </div>

                  <p className="text-slate-500 text-[11px]">
                    {tool.outcome}
                  </p>

                  <div className="pt-1 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(tool.toolPath)}
                      className="h-7 text-[11px] border-slate-200 dark:border-slate-800 gap-1"
                    >
                      <span>Launch Practice Tool</span>
                      <Zap className="w-3 h-3 text-amber-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Apprenticeship & Junior Openings (NAPS & Corporate Partners) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Matched Apprenticeship & Entry Openings (NAPS / Skill India)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Aligned with your target competencies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentRole.apprenticeshipMatches.map((app, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">
                    {app.scheme}
                  </Badge>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    {app.stipend}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  {app.role}
                </h4>
                <p className="text-slate-500 text-[11px]">
                  {app.company} • {app.location}
                </p>

                <div className="pt-1.5 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success(`Application registered for ${app.role} at ${app.company}`);
                    }}
                    className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Apply with Voke Credential
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* DIAGNOSTIC VERIFICATION MODAL */}
      <Dialog open={diagnosticModalOpen} onOpenChange={setDiagnosticModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Verify Competency Level (Digilocker / Skill India)</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Take an automated 45-minute adaptive evaluation on Voke to benchmark your skills against NSQF Level {currentRole.targetNsqfLevel} standards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold">{currentRole.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Occupational Standard:</span>
                <span className="font-mono text-[11px]">{currentRole.nsqfRoleCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assessment Components:</span>
                <span className="font-medium">2 Coding Rounds + System Design + Voice AI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Digital Certificate:</span>
                <span className="font-medium text-emerald-600">Verifiable Badge ID</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Once verified, your digital micro-credential can be attached to your Skill India profile, LinkedIn, and resume for direct recruiter verification.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDiagnosticModalOpen(false)} className="text-xs h-8">
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
              Start Diagnostic Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXPORT COMPETENCY CARD MODAL */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Skill Competency Card</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate an official NSQF-aligned competency scorecard for employers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold">{currentRole.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Readiness Score:</span>
                <span className="font-semibold text-emerald-600">{currentRole.readinessScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FRAC Competencies:</span>
                <span className="font-medium">{currentRole.competencies.length} Evaluated</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setExportModalOpen(false);
                toast.success("Competency Card exported successfully!");
              }}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
