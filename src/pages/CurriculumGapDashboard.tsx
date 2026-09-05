import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  Download,
  AlertTriangle,
  Clock,
  Building2,
  Layers,
  Search,
  Filter,
  Target,
  FileSpreadsheet,
  BookOpen,
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

// Concise, tag-driven data structure to prevent text clutter
interface GapItem {
  id: string;
  subject: string;
  category: "core_cs" | "software_eng" | "systems" | "ai_data" | "dsa";
  syllabusPills: string[];
  industryPills: string[];
  gapSeverity: "critical" | "high" | "moderate" | "aligned";
  gapPercentage: number;
  impactShort: string;
  recommendedAction: string;
  creditHours: string;
}

const GAP_DATA: GapItem[] = [
  {
    id: "gap-1",
    subject: "Distributed Systems & System Design",
    category: "systems",
    syllabusPills: ["OSI 7-Layer Model", "Basic Sockets", "Client-Server Theory"],
    industryPills: ["Microservices", "Redis Caching", "Kafka / Queues", "Rate Limiting"],
    gapSeverity: "critical",
    gapPercentage: 78,
    impactShort: "74% drop in Round 2 System Design",
    recommendedAction: "3-Week Scalable Architectures Lab",
    creditHours: "16h Lab"
  },
  {
    id: "gap-2",
    subject: "Modern Database Engineering",
    category: "systems",
    syllabusPills: ["1NF-3NF Normalization", "Basic SQL CRUD", "ER Diagrams"],
    industryPills: ["Query Indexing", "Vector DBs", "Redis Cache", "Connection Pooling"],
    gapSeverity: "critical",
    gapPercentage: 71,
    impactShort: "Fails backend query optimization rounds",
    recommendedAction: "Vector DB & Indexing Practical Lab",
    creditHours: "12h Lab"
  },
  {
    id: "gap-3",
    subject: "Cloud & DevOps (CI/CD)",
    category: "software_eng",
    syllabusPills: ["Virtualization Theory", "Static Apache Hosting", "Cloud Taxonomy"],
    industryPills: ["Docker Containers", "GitHub Actions", "Kubernetes", "AWS / Vercel"],
    gapSeverity: "critical",
    gapPercentage: 82,
    impactShort: "Immediate filter-out for production roles",
    recommendedAction: "Docker & CI/CD Pipeline Workshop",
    creditHours: "14h Lab"
  },
  {
    id: "gap-4",
    subject: "Data Structures & Algorithms",
    category: "dsa",
    syllabusPills: ["C Arrays & Linked Lists", "Binary Search Trees", "Sorting"],
    industryPills: ["Dynamic Programming", "Graph Traversals", "Monotonic Stacks", "Trie"],
    gapSeverity: "high",
    gapPercentage: 58,
    impactShort: "61% drop in Online Coding Assessments",
    recommendedAction: "4-Week LeetCode Medium Problem Sprint",
    creditHours: "24h Sprint"
  },
  {
    id: "gap-5",
    subject: "Generative AI & LLM Systems",
    category: "ai_data",
    syllabusPills: ["Decision Trees Theory", "Perceptrons", "Classical Search"],
    industryPills: ["RAG Architecture", "Vector Embeddings", "LangChain", "Prompt Eng."],
    gapSeverity: "high",
    gapPercentage: 66,
    impactShort: "Lacks hands-on GenAI portfolio projects",
    recommendedAction: "RAG & LLM Applications Elective",
    creditHours: "18h Lab"
  },
  {
    id: "gap-6",
    subject: "Full-Stack Web Engineering",
    category: "software_eng",
    syllabusPills: ["HTML / CSS Basics", "JSP / PHP", "Rudimentary JS"],
    industryPills: ["TypeScript & React", "Next.js / Node", "REST & WebSockets", "Tailwind"],
    gapSeverity: "high",
    gapPercentage: 62,
    impactShort: "Resumes lack production GitHub projects",
    recommendedAction: "End-to-End TypeScript Capstone Project",
    creditHours: "20h Capstone"
  },
  {
    id: "gap-7",
    subject: "Operating Systems & Concurrency",
    category: "core_cs",
    syllabusPills: ["Banker's Algorithm", "Semaphore Proofs", "Memory Paging"],
    industryPills: ["Linux Bash Scripting", "Async Event Loops", "Memory Leak Debugging"],
    gapSeverity: "moderate",
    gapPercentage: 42,
    impactShort: "Struggles with terminal profiling & logs",
    recommendedAction: "Linux Concurrency & Profiling Lab",
    creditHours: "8h Lab"
  },
  {
    id: "gap-8",
    subject: "Object-Oriented Design & Clean Code",
    category: "core_cs",
    syllabusPills: ["OOP 4 Pillars (C++/Java)", "Syntax Exercises"],
    industryPills: ["SOLID Principles", "Design Patterns", "Unit Testing", "Code Reviews"],
    gapSeverity: "moderate",
    gapPercentage: 35,
    impactShort: "Fails live machine coding round structure",
    recommendedAction: "SOLID & Unit Testing Lab Integration",
    creditHours: "6h Lab"
  },
  {
    id: "gap-9",
    subject: "Computer Architecture",
    category: "core_cs",
    syllabusPills: ["K-Maps", "Boolean Logic", "Registers"],
    industryPills: ["Hardware Cache Misses", "64-bit Systems"],
    gapSeverity: "aligned",
    gapPercentage: 15,
    impactShort: "Adequately covered in standard syllabus",
    recommendedAction: "Maintain existing coursework",
    creditHours: "Aligned"
  }
];

// Role Profiles for Simulator
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
    role: "Full Stack SDE-1",
    marketDemand: "Extreme",
    avgStartingPackage: "₹12 - 24 LPA",
    syllabusCoverage: 48,
    criticalMissingSkills: ["Microservices", "Docker & CI/CD", "TypeScript & Next.js", "Redis Caching"],
    recommendedElectives: ["Cloud-Native Web Dev", "Scalable Systems"]
  },
  {
    id: "backend-distributed",
    role: "Backend & Systems",
    marketDemand: "High",
    avgStartingPackage: "₹14 - 28 LPA",
    syllabusCoverage: 52,
    criticalMissingSkills: ["Distributed Caching", "gRPC & WebSockets", "Query Optimization", "Async Concurrency"],
    recommendedElectives: ["High Performance Systems", "Database Internals"]
  },
  {
    id: "ai-engineer",
    role: "AI / LLM Engineer",
    marketDemand: "Extreme",
    avgStartingPackage: "₹15 - 30 LPA",
    syllabusCoverage: 36,
    criticalMissingSkills: ["RAG Pipelines", "Vector Databases", "LangChain / LlamaIndex", "Prompt Eng."],
    recommendedElectives: ["Applied Generative AI", "Vector Search"]
  },
  {
    id: "devops-cloud",
    role: "Cloud & DevOps",
    marketDemand: "High",
    avgStartingPackage: "₹10 - 20 LPA",
    syllabusCoverage: 28,
    criticalMissingSkills: ["Terraform (IaC)", "Kubernetes", "Prometheus / Grafana", "Automated CI/CD"],
    recommendedElectives: ["Site Reliability Eng", "Cloud Infrastructure"]
  }
];

const BRIDGE_MODULES = [
  {
    code: "BM-01",
    title: "Production Cloud & Containerization",
    duration: "3 Weeks • 12h",
    targetSemester: "5th/6th Sem",
    topics: ["Docker", "GitHub Actions", "Secrets", "AWS Deployment"],
    outcome: "Containerize & automate cloud deployment."
  },
  {
    code: "BM-02",
    title: "Practical System Design & Scale",
    duration: "4 Weeks • 16h",
    targetSemester: "6th/7th Sem",
    topics: ["Redis", "Message Queues", "Rate Limiters", "Load Balancers"],
    outcome: "Hands-on distributed caching and architectural design."
  },
  {
    code: "BM-03",
    title: "Applied Generative AI & Vector Search",
    duration: "3 Weeks • 12h",
    targetSemester: "6th/7th Sem",
    topics: ["RAG Pipelines", "Vector DBs", "LLM APIs", "Embeddings"],
    outcome: "Deploy working RAG apps with vector search."
  },
  {
    code: "BM-04",
    title: "Elite DSA Problem Sprint",
    duration: "4 Weeks • 20h",
    targetSemester: "5th/6th/7th Sem",
    topics: ["DP", "Graphs", "Monotonic Stacks", "Trees"],
    outcome: "Targeted problem solving for OA & Round 1 screening."
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
        item.syllabusPills.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.industryPills.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const criticalCount = GAP_DATA.filter((g) => g.gapSeverity === "critical").length;
  const avgGap = Math.round(
    GAP_DATA.reduce((acc, curr) => acc + curr.gapPercentage, 0) / GAP_DATA.length
  );
  const alignmentScore = 100 - avgGap;

  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between py-3">
          {/* Brand Logo & Section */}
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
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-slate-800 dark:text-slate-200">Curriculum Gap</span>
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
              <span>Export</span>
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
        {/* Title & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Curriculum-Gap Analysis
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Syllabus audit benchmarked against 2025/2026 tech hiring standards.
            </p>
          </div>

          {/* Compact Filters */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center">
              <Building2 className="w-3 h-3 text-slate-400 ml-2" />
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-[115px] h-7 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cse">CSE (Core)</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="aids">AI & DS</SelectItem>
                  <SelectItem value="ece">ECE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center">
              <Target className="w-3 h-3 text-slate-400 ml-1" />
              <Select value={targetBenchmark} onValueChange={setTargetBenchmark}>
                <SelectTrigger className="w-[130px] h-7 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Benchmark" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Tier-1 Product</SelectItem>
                  <SelectItem value="startups">Startups</SelectItem>
                  <SelectItem value="services">IT Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center">
              <Calendar className="w-3 h-3 text-slate-400 ml-1" />
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-[95px] h-7 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem5">Sem 5</SelectItem>
                  <SelectItem value="sem6">Sem 6</SelectItem>
                  <SelectItem value="sem7">Sem 7/8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 4 Concise Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Alignment</span>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {avgGap}% Deficit
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {alignmentScore}%
                </span>
                <span className="text-[10px] text-slate-400">match</span>
              </div>
              <Progress value={alignmentScore} className="h-1 mt-2 bg-slate-100 dark:bg-slate-800" />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Critical Deficits</span>
                <AlertTriangle className="w-3 h-3 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {criticalCount}
                </span>
                <span className="text-[10px] text-slate-400">subjects</span>
              </div>
              <span className="block text-[10px] text-slate-500 mt-2 truncate">
                System Design, Docker, Vector DBs
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Screening Risk</span>
                <span className="text-[10px] text-slate-400">Round 1/2</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  62%
                </span>
                <span className="text-[10px] text-slate-400">at risk</span>
              </div>
              <span className="block text-[10px] text-slate-500 mt-2 truncate">
                Non-syllabus questions drop-off
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bridge Sprints</span>
                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  4 Weeks
                </span>
                <span className="text-[10px] text-slate-400">duration</span>
              </div>
              <span className="block text-[10px] text-slate-500 mt-2 truncate">
                4 Turnkey modules available
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Gap Matrix, Job Roles, Turnkey Modules */}
        <Tabs defaultValue="gap-matrix" className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
              <TabsTrigger value="gap-matrix" className="text-xs h-7 gap-1">
                <Layers className="w-3 h-3" />
                <span>Syllabus vs. Industry</span>
              </TabsTrigger>
              <TabsTrigger value="role-simulator" className="text-xs h-7 gap-1">
                <Target className="w-3 h-3" />
                <span>Role Readiness</span>
              </TabsTrigger>
              <TabsTrigger value="bridge-plans" className="text-xs h-7 gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Bridge Modules ({BRIDGE_MODULES.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Filter Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-6 text-xs w-[140px] sm:w-[170px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-7 text-xs w-[110px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <Filter className="w-3 h-3 mr-1 text-slate-400" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="systems">Systems & DB</SelectItem>
                  <SelectItem value="software_eng">Software/Cloud</SelectItem>
                  <SelectItem value="dsa">DSA</SelectItem>
                  <SelectItem value="ai_data">AI & Data</SelectItem>
                  <SelectItem value="core_cs">Core CS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TAB 1: GAP MATRIX (Clean, Scannable Cards) */}
          <TabsContent value="gap-matrix" className="space-y-2.5">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGaps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No subjects match your query.
                </div>
              ) : (
                filteredGaps.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Subject Name & Severity */}
                      <div className="lg:w-[25%] space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {item.subject}
                          </span>
                          {item.gapSeverity === "critical" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30">
                              Critical {item.gapPercentage}%
                            </Badge>
                          )}
                          {item.gapSeverity === "high" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                              High {item.gapPercentage}%
                            </Badge>
                          )}
                          {item.gapSeverity === "moderate" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                              Moderate {item.gapPercentage}%
                            </Badge>
                          )}
                          {item.gapSeverity === "aligned" && (
                            <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                              Aligned
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400">
                          {item.impactShort}
                        </p>
                      </div>

                      {/* Pills Comparison Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        {/* Syllabus Pills */}
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                            Current Syllabus
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.syllabusPills.map((pill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                              >
                                {pill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Industry Pills */}
                        <div className="p-2 rounded bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-500/15">
                          <span className="block text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                            2026 Industry Demand
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.industryPills.map((pill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-emerald-100/60 dark:bg-emerald-900/40 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium"
                              >
                                {pill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Intervention */}
                      <div className="lg:w-[22%] text-right flex lg:flex-col justify-between items-center lg:items-end gap-1">
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {item.recommendedAction}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.creditHours}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: ROLE READINESS SIMULATOR */}
          <TabsContent value="role-simulator" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Role Selectors */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Target Roles
                </span>
                {ROLE_PROFILES.map((rp) => {
                  const isSelected = selectedRole.id === rp.id;
                  return (
                    <div
                      key={rp.id}
                      onClick={() => setSelectedRole(rp)}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {rp.role}
                        </span>
                        <span className="text-[10px] text-slate-400">{rp.avgStartingPackage}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Syllabus Coverage</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{rp.syllabusCoverage}%</span>
                      </div>
                      <Progress value={rp.syllabusCoverage} className="h-1 mt-1.5" />
                    </div>
                  );
                })}
              </div>

              {/* Role Details */}
              <div className="lg:col-span-2">
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none h-full">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 py-3.5 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm sm:text-base font-bold">
                          {selectedRole.role}
                        </CardTitle>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Entry CTC: {selectedRole.avgStartingPackage}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedRole.syllabusCoverage}%
                        </span>
                        <span className="block text-[9px] text-slate-400">Match</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4 text-xs">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
                        Missing Skills in College Syllabus
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRole.criticalMissingSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20 text-slate-800 dark:text-slate-200 text-[11px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                        Recommended Elective Injections
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRole.recommendedElectives.map((elec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-slate-800 dark:text-slate-200 text-[11px] font-medium"
                          >
                            {elec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2 pt-2.5">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          Automated Diagnostic Test
                        </span>
                        <p className="text-[10px] text-slate-500">
                          45-min student assessment drive.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(`Assessment drive initiated for ${selectedRole.role}`);
                          navigate("/college/dashboard");
                        }}
                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-500 text-white"
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
          <TabsContent value="bridge-plans" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BRIDGE_MODULES.map((mod) => (
                <Card
                  key={mod.code}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-none hover:border-emerald-500/40 transition-colors"
                >
                  <CardHeader className="p-3.5 pb-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                      <span className="font-mono text-[10px]">{mod.code}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        {mod.duration}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold">
                      {mod.title}
                    </CardTitle>
                    <span className="text-[11px] text-slate-400">
                      Target: {mod.targetSemester}
                    </span>
                  </CardHeader>

                  <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {mod.topics.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1">
                      {mod.outcome}
                    </p>

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.success(`Syllabus for ${mod.code} downloaded!`);
                        }}
                        className="text-[11px] h-7 border-slate-200 dark:border-slate-800"
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Report</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate executive summary for Board of Studies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold uppercase">{department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Benchmark:</span>
                <span className="font-medium">2026 Tech Rubric</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gaps:</span>
                <span className="font-semibold text-rose-600">{criticalCount} Critical Subjects</span>
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
                toast.success("Curriculum-Gap Report exported!");
              }}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
