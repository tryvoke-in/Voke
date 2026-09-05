import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  Search,
  Filter,
  Target,
  FileSpreadsheet,
  BookOpen,
  Info,
  Calendar,
  Zap,
  Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

// Gap Matrix Data (Academic University Syllabus vs 2025/2026 Tech Hiring Demands)
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
    code: "BM-01",
    title: "Production Cloud & Containerization Sprint",
    duration: "3 Weeks (12 Contact Hours)",
    targetSemester: "5th / 6th Semester",
    outcome: "Every student builds, containerizes with Docker, and automates CI/CD to cloud with secrets.",
    modulesCount: 6
  },
  {
    code: "BM-02",
    title: "Practical System Design & Scalability Lab",
    duration: "4 Weeks (16 Contact Hours)",
    targetSemester: "6th / 7th Semester",
    outcome: "Hands-on implementation of Redis caching, Rate Limiters, Message Queues, and load balancers.",
    modulesCount: 8
  },
  {
    code: "BM-03",
    title: "Applied Generative AI & Vector Search",
    duration: "3 Weeks (12 Contact Hours)",
    targetSemester: "6th / 7th Semester",
    outcome: "Students deploy working RAG pipelines, API-driven agents, and embeddings on modern datasets.",
    modulesCount: 5
  },
  {
    code: "BM-04",
    title: "Elite DSA & Live Machine Coding Accelerator",
    duration: "4 Weeks (20 Contact Hours)",
    targetSemester: "5th / 6th / 7th Semester",
    outcome: "Intensive focus on DP, Graphs, Trees, and timed machine coding rounds for Tier-1 placements.",
    modulesCount: 10
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
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Top Header with Voke Logo, Breadcrumbs, ThemeToggle, and Quick Actions */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Top Left: Voke Logo & Section Label */}
          <div className="flex items-center gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/dashboard")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
              }}
              className="flex items-center gap-2.5 cursor-pointer group focus:outline-none"
              title="Return to Dashboard"
            >
              <img
                src="/images/voke_logo.png"
                alt="Voke Logo"
                className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-white dark:to-slate-400 bg-clip-text text-transparent">
                Voke
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-slate-700 dark:text-slate-200">Curriculum Gap</span>
              <span className="hidden sm:inline text-slate-400">/ Institutions</span>
            </div>
          </div>

          {/* Top Right: Theme Toggle & Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              <span>Export</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-7">
        {/* Minimal Title & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Curriculum-Gap Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Engineering syllabus audit benchmarked against 2025/2026 tech hiring bars.
            </p>
          </div>

          {/* Clean Segmented Filters */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-[125px] h-8 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cse">CSE (Core)</SelectItem>
                  <SelectItem value="it">Information Tech</SelectItem>
                  <SelectItem value="aids">AI & Data Sci</SelectItem>
                  <SelectItem value="ece">ECE / Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center">
              <Target className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <Select value={targetBenchmark} onValueChange={setTargetBenchmark}>
                <SelectTrigger className="w-[145px] h-8 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Benchmark" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Tier-1 (₹15L+)</SelectItem>
                  <SelectItem value="startups">High Growth Startups</SelectItem>
                  <SelectItem value="services">IT Services / Mass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-[110px] h-8 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem5">5th Sem</SelectItem>
                  <SelectItem value="sem6">6th Sem</SelectItem>
                  <SelectItem value="sem7">7th / 8th Sem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 4 Minimal Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Curriculum Alignment</span>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {avgGap}% Deficit
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {alignmentScore}%
                </span>
                <span className="text-xs text-slate-400">of hiring bar</span>
              </div>
              <Progress value={alignmentScore} className="h-1 mt-2.5 bg-slate-100 dark:bg-slate-800" />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Critical Deficits</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {criticalCount}
                </span>
                <span className="text-xs text-slate-400">high-risk subjects</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 truncate">
                System Design, Docker, Vector DBs
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Early Screening Risk</span>
                <span className="text-[11px] font-medium text-slate-400">Round 1/2</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  62%
                </span>
                <span className="text-xs text-slate-400">students at risk</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Drop-offs due to non-syllabus questions
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Remediation Time</span>
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  4 Weeks
                </span>
                <span className="text-xs text-slate-400">sprint format</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                4 Turnkey modules ready for BoS
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Gap Matrix, Job Roles, Turnkey Modules */}
        <Tabs defaultValue="gap-matrix" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
              <TabsTrigger value="gap-matrix" className="text-xs gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Syllabus vs. Industry Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="role-simulator" className="text-xs gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Role Readiness</span>
              </TabsTrigger>
              <TabsTrigger value="bridge-plans" className="text-xs gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bridge Modules ({BRIDGE_MODULES.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Filter Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Filter subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-xs w-[160px] sm:w-[200px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[120px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <Filter className="w-3 h-3 mr-1 text-slate-400" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="systems">Systems & DB</SelectItem>
                  <SelectItem value="software_eng">Software/Cloud</SelectItem>
                  <SelectItem value="dsa">Algorithms</SelectItem>
                  <SelectItem value="ai_data">AI & Data</SelectItem>
                  <SelectItem value="core_cs">Core CS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TAB 1: GAP MATRIX */}
          <TabsContent value="gap-matrix" className="space-y-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGaps.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No subjects match your query.
                </div>
              ) : (
                filteredGaps.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Subject Info */}
                      <div className="space-y-1.5 lg:w-[26%]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {item.subject}
                          </span>
                          {item.gapSeverity === "critical" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30">
                              Critical
                            </Badge>
                          )}
                          {item.gapSeverity === "high" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                              High Gap
                            </Badge>
                          )}
                          {item.gapSeverity === "moderate" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                              Moderate
                            </Badge>
                          )}
                          {item.gapSeverity === "aligned" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                              Aligned
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {item.gapPercentage}% Syllabus Deficit • {item.creditHours}
                        </div>

                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pt-1">
                          {item.impactOnPlacements}
                        </p>
                      </div>

                      {/* Middle: Comparison Columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                          <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                            Academic Syllabus Focus
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.syllabusContent}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/20 text-xs">
                          <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                            2025/2026 Industry Requirement
                          </span>
                          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                            {item.industryRequirement}
                          </p>
                        </div>
                      </div>

                      {/* Right: Recommended Fix */}
                      <div className="lg:w-[26%] p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                        <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                          Recommended Action
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-normal">
                          {item.recommendedIntervention}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: ROLE READINESS SIMULATOR */}
          <TabsContent value="role-simulator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Role Selectors */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Select Role Profile
                </span>
                {ROLE_PROFILES.map((rp) => {
                  const isSelected = selectedRole.id === rp.id;
                  return (
                    <div
                      key={rp.id}
                      onClick={() => setSelectedRole(rp)}
                      className={`p-3.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {rp.role}
                        </span>
                        <span className="text-[10px] text-slate-400">{rp.marketDemand} Demand</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-slate-500">
                        <span>CTC: {rp.avgStartingPackage}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{rp.syllabusCoverage}% Match</span>
                      </div>
                      <Progress value={rp.syllabusCoverage} className="h-1 mt-2" />
                    </div>
                  );
                })}
              </div>

              {/* Role Details */}
              <div className="lg:col-span-2">
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none h-full">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">
                          {selectedRole.role}
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target Entry CTC: {selectedRole.avgStartingPackage}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedRole.syllabusCoverage}%
                        </span>
                        <span className="block text-[10px] text-slate-400">Syllabus Match</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-5">
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2.5">
                        Missing Skills in College Syllabus
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedRole.criticalMissingSkills.map((skill, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-md border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5">
                        Recommended Elective Additions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedRole.recommendedElectives.map((elec, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-md border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{elec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          Automated Student Diagnostic
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Evaluate your batch with Voke's 45-min diagnostic test.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(`Assessment drive initiated for ${selectedRole.role}`);
                          navigate("/college/dashboard");
                        }}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        <span>Schedule Test</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: TURNKEY MODULES */}
          <TabsContent value="bridge-plans" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BRIDGE_MODULES.map((mod) => (
                <Card
                  key={mod.code}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none hover:border-emerald-500/40 transition-colors"
                >
                  <CardHeader className="pb-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono font-medium text-[11px]">{mod.code}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        {mod.duration}
                      </span>
                    </div>
                    <CardTitle className="text-sm sm:text-base font-bold">
                      {mod.title}
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Target: {mod.targetSemester} • {mod.modulesCount} Lectures + Labs
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      {mod.outcome}
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.success(`Syllabus for ${mod.code} downloaded!`);
                        }}
                        className="text-xs h-7 border-slate-200 dark:border-slate-800"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        <span>Download Syllabus</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* EXPORT MODAL */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Board of Studies Report</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generates an executive curriculum gap audit document for faculty and academic councils.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold uppercase">{department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Benchmark:</span>
                <span className="font-medium">2025/2026 Tech Rubric</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gaps Detected:</span>
                <span className="font-semibold text-rose-600">{criticalCount} Critical, {highCount} High Deficit</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setExportModalOpen(false);
                toast.success("Curriculum-Gap Report exported successfully!");
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
