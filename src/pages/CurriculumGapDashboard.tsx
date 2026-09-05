import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  Download,
  Share2,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  Code2,
  Cpu,
  Database,
  Cloud,
  Brain,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  Target,
  FileSpreadsheet,
  ChevronRight,
  BookOpen,
  Info,
  Calendar,
  Zap,
  Printer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Comprehensive Gap Matrix Data (Academic University Syllabus vs 2025/2026 Tech Hiring Demands)
interface GapItem {
  id: string;
  subject: string;
  category: "core_cs" | "software_eng" | "systems" | "ai_data" | "dsa";
  syllabusContent: string;
  industryRequirement: string;
  gapSeverity: "critical" | "high" | "moderate" | "aligned";
  gapPercentage: number;
  impactOnPlacements: string;
  recommendedIntervention: string;
  creditHours: string;
}

const GAP_DATA: GapItem[] = [
  {
    id: "gap-1",
    subject: "Distributed Systems & System Design",
    category: "systems",
    syllabusContent: "Theoretical OSI model, basic client-server architecture, standard socket programming.",
    industryRequirement: "High-level architecture, Microservices, Caching (Redis), Message Queues (Kafka/RabbitMQ), Load Balancing, Rate Limiting, CAP Theorem.",
    gapSeverity: "critical",
    gapPercentage: 78,
    impactOnPlacements: "74% rejection rate in Product SDE-1 Round 2 technical rounds.",
    recommendedIntervention: "Introduce 3-week micro-course: 'Practical System Design & Scalable Architectures' with case studies (Netflix, WhatsApp).",
    creditHours: "16 Hours (Lab + Projects)"
  },
  {
    id: "gap-2",
    subject: "Modern Database Engineering",
    category: "systems",
    syllabusContent: "Relational DBMS, 1NF-3NF Normalization, basic SQL queries, ER diagrams.",
    industryRequirement: "Query indexing strategies, EXPLAIN query plans, NoSQL (MongoDB), Vector Databases (Pinecone/Milvus), Connection Pooling & Sharding.",
    gapSeverity: "critical",
    gapPercentage: 71,
    impactOnPlacements: "Students struggle with database performance & modern backend stack interviews.",
    recommendedIntervention: "Add hands-on lab on Vector DBs, indexing optimization, and ORMs (Prisma / Drizzle) in 6th Sem DBMS curriculum.",
    creditHours: "12 Hours (Hands-on)"
  },
  {
    id: "gap-3",
    subject: "Cloud & DevOps (CI/CD)",
    category: "software_eng",
    syllabusContent: "Overview of virtualization, static web server hosting, theoretical cloud taxonomy (IaaS/PaaS/SaaS).",
    industryRequirement: "Docker containerization, GitHub Actions CI/CD workflows, basic Kubernetes concepts, Cloud Deployments (AWS / GCP / Vercel), Environment Secrets.",
    gapSeverity: "critical",
    gapPercentage: 82,
    impactOnPlacements: "Zero production deployment skills; immediate disqualification in modern product and startup screening.",
    recommendedIntervention: "Replace static server lab with a modern 'Containerization & CI/CD Pipeline Deployment' workshop.",
    creditHours: "14 Hours (Lab Sprint)"
  },
  {
    id: "gap-4",
    subject: "Data Structures & Competitive Algorithms",
    category: "dsa",
    syllabusContent: "Basic C/C++ implementations of Linked Lists, Stacks, Queues, Binary Search Trees.",
    industryRequirement: "Dynamic Programming, Graph algorithms (BFS/DFS, Dijkstra), Monotonic Stacks, Sliding Window, Space-Time complexity analysis under tight constraints.",
    gapSeverity: "high",
    gapPercentage: 58,
    impactOnPlacements: "61% drop-off in automated online assessments (HackerEarth, HackerRank, Unstop OA rounds).",
    recommendedIntervention: "Incorporate 4-week daily problem sprint targeting LeetCode Mediums and standard interview sheets into Practical Lab.",
    creditHours: "24 Hours (Problem Sprint)"
  },
  {
    id: "gap-5",
    subject: "GenAI, LLMs & Modern AI Engineering",
    category: "ai_data",
    syllabusContent: "Decision trees, basic neural network math, traditional classification, classical search algorithms.",
    industryRequirement: "Retrieval-Augmented Generation (RAG), Prompt Engineering, Function Calling with LLM APIs, LangChain / LlamaIndex, Vector embeddings.",
    gapSeverity: "high",
    gapPercentage: 66,
    impactOnPlacements: "Rapidly rising demand: 42% of 2025/2026 tech openings test for practical GenAI/LLM utilization.",
    recommendedIntervention: "Add elective module: 'Building Production AI Apps with RAG & Multimodal LLMs'.",
    creditHours: "18 Hours (Elective / Workshop)"
  },
  {
    id: "gap-6",
    subject: "Production Full Stack Development",
    category: "software_eng",
    syllabusContent: "HTML/CSS basics, PHP/JSP, XML, rudimentary JavaScript DOM manipulation.",
    industryRequirement: "Modern TypeScript, React / Next.js / Vue, RESTful & WebSocket API development, state management, asynchronous programming, Tailwind.",
    gapSeverity: "high",
    gapPercentage: 62,
    impactOnPlacements: "Resumes lack production-ready GitHub repositories; projects are deemed academic toy apps by interviewers.",
    recommendedIntervention: "Mandate end-to-end full-stack capstone project with modern TypeScript & deployed cloud API.",
    creditHours: "20 Hours (Capstone Sprint)"
  },
  {
    id: "gap-7",
    subject: "Operating Systems & Concurrency",
    category: "core_cs",
    syllabusContent: "Process scheduling algorithms, Banker's algorithm, Semaphore theoretical proofs, memory paging.",
    industryRequirement: "Linux bash scripting, multi-threading vs async event loops, memory leak debugging, process isolation & CPU profiling.",
    gapSeverity: "moderate",
    gapPercentage: 42,
    impactOnPlacements: "Theoretical concepts clear, but inability to debug live server logs or memory issues.",
    recommendedIntervention: "Add 4 Linux and concurrency labs with terminal-based profiling tools.",
    creditHours: "8 Hours (Lab)"
  },
  {
    id: "gap-8",
    subject: "Object-Oriented Design & Clean Code",
    category: "core_cs",
    syllabusContent: "OOP 4 pillars (Inheritance, Polymorphism, Encapsulation, Abstraction) in C++ or Java.",
    industryRequirement: "SOLID principles, Design Patterns (Factory, Strategy, Observer), Unit testing, Clean code practices, Code reviews.",
    gapSeverity: "moderate",
    gapPercentage: 35,
    impactOnPlacements: "Students write unmaintainable single-file spaghetti code during live machine coding rounds.",
    recommendedIntervention: "Enforce unit testing (Jest / JUnit) and SOLID pattern rubrics in student practical evaluations.",
    creditHours: "6 Hours (Integrated)"
  },
  {
    id: "gap-9",
    subject: "Basic Computer Architecture & Logic",
    category: "core_cs",
    syllabusContent: "K-Maps, Boolean logic, CPU registers, Assembly language fundamentals.",
    industryRequirement: "High-level understanding of hardware efficiency, cache misses, 64-bit architectures.",
    gapSeverity: "aligned",
    gapPercentage: 15,
    impactOnPlacements: "Adequately covered; aligns well with foundational requirements.",
    recommendedIntervention: "Maintain current coursework; no major syllabus intervention required.",
    creditHours: "0 Hours"
  }
];

// Role Profiles for Gap Simulator
interface RoleProfile {
  id: string;
  role: string;
  marketDemand: "Extreme" | "High" | "Moderate";
  avgStartingPackage: string;
  syllabusCoverage: number;
  criticalMissingSkills: string[];
  recommendedElectives: string[];
}

const ROLE_PROFILES: RoleProfile[] = [
  {
    id: "sde-1",
    role: "Full Stack SDE-1 (Product)",
    marketDemand: "Extreme",
    avgStartingPackage: "₹12 - 24 LPA",
    syllabusCoverage: 48,
    criticalMissingSkills: [
      "Microservices & System Design",
      "Docker & CI/CD Pipelines",
      "Modern TypeScript & Next.js",
      "Redis Caching & Queue workers"
    ],
    recommendedElectives: ["Cloud-Native Web Development", "Advanced Scalable Architectures"]
  },
  {
    id: "backend-distributed",
    role: "Backend & Systems Engineer",
    marketDemand: "High",
    avgStartingPackage: "₹14 - 28 LPA",
    syllabusCoverage: 52,
    criticalMissingSkills: [
      "Distributed Caching & Sharding",
      "gRPC & WebSockets",
      "Query Optimization & EXPLAIN analysis",
      "Concurrency & Event-Driven Systems"
    ],
    recommendedElectives: ["High Performance Distributed Computing", "Database Internals"]
  },
  {
    id: "ai-engineer",
    role: "AI / LLM Application Engineer",
    marketDemand: "Extreme",
    avgStartingPackage: "₹15 - 30 LPA",
    syllabusCoverage: 36,
    criticalMissingSkills: [
      "RAG & Vector Databases",
      "LangChain / LlamaIndex orchestration",
      "Prompt Engineering & Evaluation",
      "Fine-tuning & Quantized deployment"
    ],
    recommendedElectives: ["Applied Generative AI", "Vector Search & Retrieval Systems"]
  },
  {
    id: "devops-cloud",
    role: "Cloud & DevOps Engineer",
    marketDemand: "High",
    avgStartingPackage: "₹10 - 20 LPA",
    syllabusCoverage: 28,
    criticalMissingSkills: [
      "Terraform (IaC)",
      "Kubernetes & Helm charts",
      "Monitoring & Observability (Prometheus/Grafana)",
      "Automated Security Scanning"
    ],
    recommendedElectives: ["Site Reliability Engineering", "Modern Cloud Infrastructure"]
  }
];

// Turnkey Bridge Modules for Colleges
const BRIDGE_MODULES = [
  {
    code: "VOKE-BM01",
    title: "Production Cloud & Containerization Sprint",
    duration: "3 Weeks (12 Contact Hours)",
    targetSemester: "5th / 6th Semester",
    outcome: "Every student builds, containerizes with Docker, and automates CI/CD to cloud with secrets.",
    modulesCount: 6,
    industryMentorSupported: true
  },
  {
    code: "VOKE-BM02",
    title: "Practical System Design & Scalability Lab",
    duration: "4 Weeks (16 Contact Hours)",
    targetSemester: "6th / 7th Semester",
    outcome: "Hands-on implementation of Redis caching, Rate Limiters, Message Queues, and load balancers.",
    modulesCount: 8,
    industryMentorSupported: true
  },
  {
    code: "VOKE-BM03",
    title: "Applied Generative AI & Vector Search",
    duration: "3 Weeks (12 Contact Hours)",
    targetSemester: "6th / 7th Semester",
    outcome: "Students deploy working RAG pipelines, API-driven agents, and embeddings on modern datasets.",
    modulesCount: 5,
    industryMentorSupported: true
  },
  {
    code: "VOKE-BM04",
    title: "Elite DSA & Live Machine Coding Accelerator",
    duration: "4 Weeks (20 Contact Hours)",
    targetSemester: "5th / 6th / 7th Semester",
    outcome: "Intensive focus on DP, Graphs, Trees, and timed machine coding rounds for Tier-1 placements.",
    modulesCount: 10,
    industryMentorSupported: true
  }
];

export default function CurriculumGapDashboard() {
  const navigate = useNavigate();

  // Filters
  const [department, setDepartment] = useState("cse");
  const [targetBenchmark, setTargetBenchmark] = useState("product");
  const [semester, setSemester] = useState("sem6");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<RoleProfile>(ROLE_PROFILES[0]);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Filtered Gaps
  const filteredGaps = useMemo(() => {
    return GAP_DATA.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.syllabusContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.industryRequirement.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  // Aggregate Metrics
  const criticalCount = GAP_DATA.filter((g) => g.gapSeverity === "critical").length;
  const highCount = GAP_DATA.filter((g) => g.gapSeverity === "high").length;
  const avgGap = Math.round(
    GAP_DATA.reduce((acc, curr) => acc + curr.gapPercentage, 0) / GAP_DATA.length
  );
  const alignmentScore = 100 - avgGap;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="w-4 h-4" />
              </span>
              <span className="font-semibold text-sm tracking-tight">Institutional Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 py-1 px-3 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2025/2026 Hiring Benchmark
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Export BoS Report</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Brief</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Academic Syllabus vs. Industry Hiring Demand
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Curriculum-Gap Dashboard
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
              Real-time audit comparing university engineering syllabi with actual 2025/2026 tech company hiring criteria. Pinpoint deficits, reduce round-1 screening drop-offs, and implement turnkey bridge modules.
            </p>
          </div>

          {/* Institutional Filters Selector */}
          <div className="flex flex-wrap items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 ml-1" />
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-[140px] h-9 text-xs font-medium border-0 focus:ring-0 bg-transparent">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cse">CSE (Core)</SelectItem>
                  <SelectItem value="it">Information Tech</SelectItem>
                  <SelectItem value="aids">AI & Data Science</SelectItem>
                  <SelectItem value="ece">ECE / Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              <Select value={targetBenchmark} onValueChange={setTargetBenchmark}>
                <SelectTrigger className="w-[150px] h-9 text-xs font-medium border-0 focus:ring-0 bg-transparent">
                  <SelectValue placeholder="Benchmark" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Tier-1 Product (₹15L+)</SelectItem>
                  <SelectItem value="startups">High Growth Startups</SelectItem>
                  <SelectItem value="services">Enterprise / IT Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-[120px] h-9 text-xs font-medium border-0 focus:ring-0 bg-transparent">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem5">5th Semester</SelectItem>
                  <SelectItem value="sem6">6th Semester</SelectItem>
                  <SelectItem value="sem7">7th / 8th Sem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 4 High-Impact KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Alignment Score */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Curriculum Alignment</span>
                <Badge variant="secondary" className="text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {avgGap}% Deficit
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight">{alignmentScore}%</span>
                <span className="text-xs text-slate-500">of modern hiring bar</span>
              </div>
              <Progress value={alignmentScore} className="h-1.5 mt-3 bg-slate-100 dark:bg-slate-800" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Based on analysis of 450+ tech job specs</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Critical Gaps */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Critical Deficits</span>
                <span className="p-1 rounded bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{criticalCount}</span>
                <span className="text-xs text-slate-500">high-risk subjects</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">System Design</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Docker/Cloud</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Vector DBs</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
                Causes 70%+ of early round rejections
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Batch Screening Vulnerability */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Campus Screening Risk</span>
                <span className="p-1 rounded bg-indigo-500/10 text-indigo-500">
                  <TrendingDown className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">62%</span>
                <span className="text-xs text-slate-500">students vulnerable</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>OA Assessment: 42%</span>
                <span>Tech Round 1: 58%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Can be reduced to &lt;18% with bridge modules
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Recommended Turnaround */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Bridge Resolution Time</span>
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-500">
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">4 Weeks</span>
                <span className="text-xs text-slate-500">credit micro-sprint</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4 Ready-to-use BoS modules</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                No university re-accreditation needed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gap-matrix" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <TabsTrigger value="gap-matrix" className="gap-2 text-xs sm:text-sm">
                <Layers className="w-4 h-4" />
                <span>Syllabus vs. Industry Gap Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="role-simulator" className="gap-2 text-xs sm:text-sm">
                <Target className="w-4 h-4" />
                <span>Job Role Readiness</span>
              </TabsTrigger>
              <TabsTrigger value="bridge-plans" className="gap-2 text-xs sm:text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Turnkey Bridge Modules ({BRIDGE_MODULES.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Matrix Search & Category Quick Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Filter subjects or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs w-[180px] sm:w-[220px] bg-white dark:bg-slate-900/80"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[130px] bg-white dark:bg-slate-900/80">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="systems">Systems & DB</SelectItem>
                  <SelectItem value="software_eng">Software & Cloud</SelectItem>
                  <SelectItem value="dsa">Algorithms</SelectItem>
                  <SelectItem value="ai_data">AI & Data</SelectItem>
                  <SelectItem value="core_cs">Core CS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TAB 1: GAP MATRIX TABLE & CARDS */}
          <TabsContent value="gap-matrix" className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredGaps.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <p>No subjects match your filter criteria.</p>
                    <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }} className="mt-2 text-xs">
                      Reset Filters
                    </Button>
                  </div>
                ) : (
                  filteredGaps.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Subject Title & Badges */}
                        <div className="space-y-2 lg:max-w-[28%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                              {item.subject}
                            </h3>
                            {item.gapSeverity === "critical" && (
                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
                                Critical Deficit
                              </Badge>
                            )}
                            {item.gapSeverity === "high" && (
                              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                                High Gap
                              </Badge>
                            )}
                            {item.gapSeverity === "moderate" && (
                              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                                Moderate Gap
                              </Badge>
                            )}
                            {item.gapSeverity === "aligned" && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                                Aligned
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="capitalize">{item.category.replace("_", " ")}</span>
                            <span>•</span>
                            <span>Est. Gap: <strong className="text-slate-800 dark:text-slate-200">{item.gapPercentage}%</strong></span>
                          </div>

                          <div className="pt-2 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.impactOnPlacements}</span>
                          </div>
                        </div>

                        {/* Side by Side Comparison Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                          {/* Academic Syllabus Box */}
                          <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-slate-500 font-semibold tracking-wide uppercase text-[10px]">
                              <span>Academic Syllabus (Standard)</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Theory Focus</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {item.syllabusContent}
                            </p>
                          </div>

                          {/* Industry Requirement Box */}
                          <div className="p-3.5 rounded-lg border border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04] text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide uppercase text-[10px]">
                              <span>2025/2026 Industry Hiring Demand</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Tested in Rounds</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                              {item.industryRequirement}
                            </p>
                          </div>
                        </div>

                        {/* Recommendation Column */}
                        <div className="lg:w-[26%] p-3.5 rounded-lg border border-indigo-500/15 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold text-indigo-700 dark:text-indigo-300 text-[10px] uppercase">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-indigo-500" />
                              Actionable Intervention
                            </span>
                            <span className="text-slate-500 text-[10px]">{item.creditHours}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-xs leading-snug">
                            {item.recommendedIntervention}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ROLE READINESS SIMULATOR */}
          <TabsContent value="role-simulator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Selector List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
                  Select Target Placement Role
                </h3>
                {ROLE_PROFILES.map((rp) => {
                  const isSelected = selectedRole.id === rp.id;
                  return (
                    <div
                      key={rp.id}
                      onClick={() => setSelectedRole(rp)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{rp.role}</h4>
                        <Badge
                          variant="secondary"
                          className={
                            rp.marketDemand === "Extreme"
                              ? "bg-rose-500/10 text-rose-600 text-[10px]"
                              : "bg-indigo-500/10 text-indigo-600 text-[10px]"
                          }
                        >
                          {rp.marketDemand} Demand
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Pkg: <strong>{rp.avgStartingPackage}</strong></span>
                        <span>Coverage: <strong>{rp.syllabusCoverage}%</strong></span>
                      </div>
                      <Progress value={rp.syllabusCoverage} className="h-1 mt-2" />
                    </div>
                  );
                })}
              </div>

              {/* Right Diagnostic Inspector */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <span>{selectedRole.role}</span>
                          <Badge variant="outline" className="text-xs font-normal">
                            Target CTC: {selectedRole.avgStartingPackage}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Calculated against Tier-1 Product & Unicorn hiring rubrics for this discipline.
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {selectedRole.syllabusCoverage}%
                        </span>
                        <span className="block text-[11px] text-slate-500">Current Syllabus Match</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Critical Missing Skills In Current Academic Syllabus
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedRole.criticalMissingSkills.map((skill, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 flex items-center gap-2 text-xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800" />

                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Recommended Coursework / Elective Injection
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedRole.recommendedElectives.map((elec, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-2 text-xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{elec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action box */}
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h6 className="font-semibold text-xs">Deploy Targeted Diagnostic to Students</h6>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Run an automated 45-minute Voke test to evaluate which students already bridge these gaps.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(`Assessment drive initiated for ${selectedRole.role}!`);
                          navigate("/college/dashboard");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Schedule Batch Diagnostic</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: TURNKEY BRIDGE MODULES */}
          <TabsContent value="bridge-plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {BRIDGE_MODULES.map((mod) => (
                <Card
                  key={mod.code}
                  className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:border-emerald-500/50 transition-all group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {mod.code}
                      </Badge>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        <Clock className="w-3 h-3" />
                        {mod.duration}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {mod.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ideal for: <strong>{mod.targetSemester}</strong>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>Expected Student Outcome:</strong> {mod.outcome}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">
                        {mod.modulesCount} Structured Lectures + 4 Hands-on Projects
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.success(`Lesson plan for ${mod.code} downloaded!`);
                        }}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Syllabus PDF</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* MODAL: EXPORT ACADEMIC COUNCIL REPORT */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span>Export Board of Studies Report</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate an executive curriculum gap audit document ready for review by the Academic Council, HODs, and Placement Cell.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-medium">Engineering Campus / College</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium uppercase">{department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Benchmark Year:</span>
                <span className="font-medium">2025/2026 Hiring Rubric</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Audit Gaps Found:</span>
                <span className="font-medium text-rose-600">{criticalCount} Critical, {highCount} High Deficit</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Includes line-by-line course addendums, required lab infrastructure recommendations, and accredited hours estimates.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setExportModalOpen(false);
                toast.success("Executive Curriculum-Gap Report exported successfully!");
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download Report (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
