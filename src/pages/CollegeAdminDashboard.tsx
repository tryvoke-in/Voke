import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2, GraduationCap, Users, Calendar, Plus, Download,
  Search, Award, Sparkles, LogOut, CheckCircle2, Clock, AlertCircle,
  ChevronRight, ExternalLink, Bot, Video, Code, Layers, Mail, Phone,
  TrendingUp, BarChart3, ShieldCheck, Filter, ArrowUpRight, Trophy, RefreshCw, UserPlus,
  Copy, Link, Play, BookOpen, Check, X, FileText, User
} from "lucide-react";
import {
  College, CollegeStudent, CollegeScheduledDrive, CollegeAnalytics,
  collegeService, ScheduledDriveCandidate, StudentDetailedAssessmentReport
} from "@/services/collegeService";
import { ScheduleInterviewModal } from "@/components/college/ScheduleInterviewModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [college, setCollege] = useState<College | null>(null);
  const [students, setStudents] = useState<CollegeStudent[]>([]);
  const [drives, setDrives] = useState<CollegeScheduledDrive[]>([]);
  const [analytics, setAnalytics] = useState<CollegeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("students");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudentEmails, setSelectedStudentEmails] = useState<string[]>([]);

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preSelectedEmailsForSchedule, setPreSelectedEmailsForSchedule] = useState<string[]>([]);

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<CollegeStudent | null>(null);
  const [studentReportData, setStudentReportData] = useState<StudentDetailedAssessmentReport | null>(null);
  const [loadingReportData, setLoadingReportData] = useState(false);
  const [selectedCandidateForReport, setSelectedCandidateForReport] = useState<{ candidate: ScheduledDriveCandidate; drive: CollegeScheduledDrive } | null>(null);

  // Add Student Modal State
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentRole, setNewStudentRole] = useState("Full Stack Developer");
  const [newStudentBranch, setNewStudentBranch] = useState("Computer Science & AI");
  const [newStudentBatch, setNewStudentBatch] = useState("2025");

  useEffect(() => {
    loadCollegeData();

    // Subscribe to realtime roster events across browsers
    const channel = supabase
      .channel("voke_college_realtime_roster")
      .on("broadcast", { event: "student_registered" }, () => {
        loadCollegeData(false);
      })
      .on("broadcast", { event: "college_drive_scheduled" }, () => {
        loadCollegeData(false);
      })
      .on("broadcast", { event: "request_college_drives_sync" }, () => {
        const session = collegeService.getCollegeSession();
        if (session) {
          const drives = collegeService.getCollegeDrives(session.id);
          if (drives.length > 0) {
            channel.send({
              type: "broadcast",
              event: "response_college_drives_sync",
              payload: { drives }
            }).catch(() => { });
          }
        }
      })
      .on("broadcast", { event: "drive_candidate_evaluated" }, (payload: any) => {
        loadCollegeData(false);
        if (payload?.candidate) {
          toast.success(
            `Candidate Evaluated: ${payload.candidate.studentName} (${payload.candidate.studentEmail})`,
            {
              description: `Score: ${payload.candidate.score}% • Verdict: ${payload.candidate.selectionVerdict || (payload.isPassed ? "SELECTED 🎉" : "NOT SELECTED")}`
            }
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedStudentForReport && college) {
      setLoadingReportData(true);
      collegeService.getStudentDetailedReportAsync(selectedStudentForReport.email, college.id)
        .then(report => {
          setStudentReportData(report);
        })
        .catch(err => {
          console.error("Failed to load student assessment report:", err);
        })
        .finally(() => {
          setLoadingReportData(false);
        });
    } else {
      setStudentReportData(null);
    }
  }, [selectedStudentForReport, college]);

  const handlePrintReport = () => {
    window.print();
  };

  const loadCollegeData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);

    const requestedCollegeParam = searchParams.get("college") || searchParams.get("id");
    let activeCollege: College | null = null;

    if (requestedCollegeParam) {
      const allColleges = await collegeService.getCollegesAsync();
      const found = allColleges.find(c => 
        c.id === requestedCollegeParam || 
        c.slug === requestedCollegeParam || 
        c.shortName?.toLowerCase() === requestedCollegeParam.toLowerCase()
      );
      if (found) {
        activeCollege = found;
        collegeService.setCollegeSession(found);
      }
    }

    if (!activeCollege) {
      activeCollege = collegeService.getCollegeSession();
    }

    if (!activeCollege) {
      navigate("/college/auth");
      return;
    }

    setCollege(activeCollege);
    try {
      const studentList = await collegeService.getCollegeStudents(activeCollege.id);
      const drivesList = collegeService.getCollegeDrives(activeCollege.id);
      const analyticsData = await collegeService.getCollegeAnalytics(activeCollege.id);

      setStudents(studentList);
      setDrives(drivesList);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load college dashboard data:", err);
      toast.error("Failed to load college data.");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadCollegeData(false);
    toast.success("Roster synced & refreshed.");
  };

  const handleSignOut = () => {
    collegeService.clearCollegeSession();
    toast.info("Logged out from College Admin Portal.");
    navigate("/college/auth");
  };

  const handleExportCSV = async () => {
    if (!college) return;
    try {
      const csvContent = await collegeService.exportStudentsToCSV(college.id);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${college.slug}-students-roster.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Student directory exported to CSV successfully.");
    } catch (e) {
      toast.error("Failed to export CSV.");
    }
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail.trim() || !newStudentEmail.includes("@")) {
      toast.error("Please enter a valid student email address.");
      return;
    }
    if (!college) return;

    collegeService.addStudentToCollege(college.id, {
      fullName: newStudentName.trim() || newStudentEmail.split("@")[0],
      email: newStudentEmail.trim().toLowerCase(),
      targetRole: newStudentRole,
      branch: newStudentBranch,
      batch: newStudentBatch,
      interviewsCompleted: 1,
      averageScore: 85,
      readinessStatus: "Placement Ready"
    });

    toast.success(`Student ${newStudentEmail} successfully added to ${college.name} roster!`);
    setNewStudentName("");
    setNewStudentEmail("");
    setAddStudentOpen(false);
    loadCollegeData(false);
  };

  const toggleSelectStudent = (email: string) => {
    setSelectedStudentEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    if (selectedStudentEmails.length === filteredStudents.length) {
      setSelectedStudentEmails([]);
    } else {
      setSelectedStudentEmails(filteredStudents.map(s => s.email));
    }
  };

  const handleScheduleForSingleStudent = (studentEmail: string) => {
    setPreSelectedEmailsForSchedule([studentEmail]);
    setScheduleModalOpen(true);
  };

  const handleScheduleForSelectedStudents = () => {
    if (selectedStudentEmails.length === 0) {
      setPreSelectedEmailsForSchedule([]);
    } else {
      setPreSelectedEmailsForSchedule(selectedStudentEmails);
    }
    setScheduleModalOpen(true);
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.targetRole.toLowerCase().includes(q) ||
      s.branch.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "ready" && s.readinessStatus === "Placement Ready") ||
      (statusFilter === "intermediate" && s.readinessStatus === "Intermediate") ||
      (statusFilter === "needs_practice" && s.readinessStatus === "Needs Practice");

    return matchesSearch && matchesStatus;
  });

  if (loading || !college) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading College Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10 transform-gpu" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10 transform-gpu" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 md:px-8 py-3.5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-0 cursor-pointer group rounded-lg"
            >
              <img
                src="/images/voke_logo.png"
                alt="Voke Logo"
                width={48}
                height={48}
                decoding="async"
                className="w-11 h-11 object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Voke
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualRefresh}
              className="text-xs h-9 px-3"
              title="Sync latest student registrations"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600 dark:text-blue-300' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs hidden lg:flex items-center gap-1.5 h-9"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>

            <ThemeToggle />

            <div className="relative flex items-center justify-center w-9 h-9 cursor-pointer group ml-1" onClick={() => navigate('/college/profile')}>
              <Avatar className="w-8 h-8 transition-transform group-hover:scale-105 border border-border">
                <AvatarImage src={college?.logoUrl} alt={college?.name || "Profile"} className="object-cover" />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {(college?.name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* College Header Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-100/60 via-card to-card dark:from-blue-950/40 dark:via-card dark:to-card border border-border relative overflow-hidden shadow-xl dark:shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <GraduationCap className="w-48 h-48 text-blue-600 dark:text-blue-300" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 text-xs">
                  {college.shortName} Placement & Training Cell
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Academic Year {college.contractPeriod}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {college.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Placement Admin: <strong className="text-foreground">{college.adminName}</strong> ({college.adminEmail}) • Authorized Domains: <span className="font-mono text-blue-600 dark:text-blue-300 text-xs">{college.domains.map(d => `@${d}`).join(", ")}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border text-center min-w-[100px]">
                <div className="text-2xl font-bold text-foreground">{students.length}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Registered</div>
              </div>
              <div className="p-3 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border text-center min-w-[100px]">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {analytics?.placementReadyPercentage || 0}%
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Ready Rate</div>
              </div>
              <div className="p-3 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border text-center min-w-[100px]">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{drives.length}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Mock Drives</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Students Roster</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-foreground">{students.length}</div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-mapped via college domain
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Mocks Conducted</span>
                <Bot className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{analytics?.totalInterviewsTaken || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                AI technical & coding sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg AI Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-500">{analytics?.averageScore || 0}%</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                DSA, System Design & Articulation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Drives</span>
                <Calendar className="w-4 h-4 text-pink-500" />
              </div>
              <div className="text-2xl font-bold text-pink-500">{drives.filter(d => d.status === "active").length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Scheduled placement rounds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border">
            <TabsList className="bg-card border border-border p-1 gap-2 rounded-full shadow-sm">
              <TabsTrigger
                value="students"
                className="relative rounded-full data-[state=active]:text-white text-xs md:text-sm py-1.5 px-4 font-medium transition-all"
              >
                {activeTab === "students" && (
                  <motion.div
                    layoutId="active-dashboard-tab"
                    className="absolute inset-0 bg-blue-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  <Users className="w-4 h-4 mr-1.5" />
                  Registered Students ({students.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="drives"
                className="relative rounded-full data-[state=active]:text-white text-xs md:text-sm py-1.5 px-4 font-medium transition-all"
              >
                {activeTab === "drives" && (
                  <motion.div
                    layoutId="active-dashboard-tab"
                    className="absolute inset-0 bg-blue-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Scheduled Interviews ({drives.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="relative rounded-full data-[state=active]:text-white text-xs md:text-sm py-1.5 px-4 font-medium transition-all"
              >
                {activeTab === "analytics" && (
                  <motion.div
                    layoutId="active-dashboard-tab"
                    className="absolute inset-0 bg-blue-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Placement Analytics
                </span>
              </TabsTrigger>

            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === "students" && selectedStudentEmails.length > 0 && (
                <div className="flex items-center gap-2 mr-1">
                  <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                    {selectedStudentEmails.length} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={handleScheduleForSelectedStudents}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Schedule Interview
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                onClick={() => setAddStudentOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 rounded-full px-4 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Enroll Student
              </Button>
            </div>
          </div>

          {/* TAB 1: Registered Students Directory */}
          <TabsContent value="students" className="space-y-4 mt-0">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                <Input
                  placeholder="Search students"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-muted/40 dark:bg-muted/30 border-border pl-9 text-xs text-white placeholder:text-gray-500 h-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                <div className="flex items-center gap-1 bg-muted/40 dark:bg-muted/30 p-1 rounded-full border border-border">
                  {[
                    { id: "all", label: "All" },
                    { id: "ready", label: "Ready (80%+)" },
                    { id: "intermediate", label: "Intermediate" },
                    { id: "needs_practice", label: "Needs Prep" }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`relative text-xs px-2.5 py-1 rounded-full transition-colors ${statusFilter === filter.id
                          ? "text-white font-medium"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {statusFilter === filter.id && (
                        <motion.div
                          layoutId="active-filter-tab"
                          className="absolute inset-0 bg-blue-600 rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40 dark:bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudentEmails.length === filteredStudents.length
                        }
                        onCheckedChange={handleSelectAllFilteredStudents}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80">Student & College Email</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80">Branch & Batch</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80">Target Role</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 text-center">Mocks</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 text-center">Avg AI Score</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80">Placement Readiness</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-300" />
                        <h4 className="font-semibold text-black dark:text-white text-sm mb-1">No Registered Students Yet</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                          Students with authorized college email domains will automatically appear here once they sign up, or you can enroll them directly.
                        </p>

                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => {
                      const isSelected = selectedStudentEmails.includes(student.email);
                      return (
                        <TableRow
                          key={student.id}
                          className={`border-border/50 transition-colors ${isSelected ? "bg-blue-600/10" : "hover:bg-muted/40 dark:bg-muted/30"
                            }`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectStudent(student.email)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-600 dark:text-blue-300">
                                {student.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                  {student.fullName}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-muted-foreground/70" />
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-foreground/80">{student.branch}</div>
                            <div className="text-[11px] text-muted-foreground/80 font-mono">{student.batch}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-foreground/80">{student.targetRole}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-border text-foreground/80 font-mono text-xs">
                              {student.interviewsCompleted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold text-sm font-mono ${student.averageScore >= 85 ? "text-emerald-600 dark:text-emerald-400" :
                                student.averageScore >= 70 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                              }`}>
                              {student.averageScore}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[11px] px-2.5 py-1 whitespace-nowrap border ${student.readinessStatus === "Placement Ready"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : student.readinessStatus === "Intermediate"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                              }`}>
                              {student.readinessStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedStudentForReport(student)}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              >
                                Report
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleScheduleForSingleStudent(student.email)}
                                className="h-8 px-2.5 text-xs bg-blue-600/30 hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white border border-blue-500/30"
                              >
                                Schedule
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 2: Scheduled Placement Drives */}
          <TabsContent value="drives" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Campus Mock Placement Drives</h3>
                <p className="text-xs text-muted-foreground">
                  Custom mock interview assessments assigned to students by your college training & placement cell.
                </p>
              </div>
              <Button
                onClick={() => {
                  setPreSelectedEmailsForSchedule([]);
                  setScheduleModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-full"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Schedule Interview
              </Button>
            </div>

            {drives.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-xl border border-border bg-card text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
                <h4 className="font-semibold text-foreground text-sm mb-1">No Placement Drives Scheduled Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                  Schedule customized mock interviews and placement drives for your college students.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drives.map(drive => (
                  <Card
                    key={drive.id}
                    className="bg-card border-border text-foreground overflow-hidden hover:border-blue-500/40 transition-all cursor-pointer group"
                    onClick={() => navigate(`/college/drive/${drive.id}`)}
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${drive.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" :
                                drive.status === "scheduled" ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30" :
                                  "bg-muted text-muted-foreground border-border"
                              }`}>
                              {drive.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {drive.durationMinutes} mins • Benchmark: {drive.passingScore}%
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {drive.title}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{drive.customQuestions?.length || 0} Questions Selected</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/40 dark:bg-muted/30 p-3 rounded-lg border border-border/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Candidate Participation:</span>
                          <span className="font-semibold text-foreground">
                            {drive.completedCount} / {drive.candidatesCount} Completed
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{
                              width: `${drive.candidatesCount > 0 ? (drive.completedCount / drive.candidatesCount) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <span>Window: {drive.scheduledDate} → {drive.deadlineDate}</span>
                          {drive.completedCount > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-300 font-semibold">Avg Score: {drive.avgScore}%</span>
                          )}
                        </div>
                      </div>

                      {drive.targetCompanies && drive.targetCompanies.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-muted-foreground/70">Benchmarked against:</span>
                          {drive.targetCompanies.map(c => (
                            <Badge key={c} variant="outline" className="text-[10px] border-border text-foreground/80">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-border/50 text-xs text-blue-600 dark:text-blue-300 font-medium">
                        <span>View Candidates & Results Leaderboard</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Placement Analytics */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skill Competency Breakdown */}
              <Card className="bg-card border-border text-foreground">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Institutional Skill Competency Averages
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Evaluated across all AI mock interviews taken by {college.shortName} students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Data Structures & Algorithms", value: analytics?.skillAverages.dsa || 85, color: "bg-emerald-600 dark:bg-emerald-300" },
                    { label: "System Design & Architecture", value: analytics?.skillAverages.systemDesign || 80, color: "bg-cyan-600 dark:bg-cyan-300" },
                    { label: "Technical Articulation & Communication", value: analytics?.skillAverages.communication || 88, color: "bg-blue-600 dark:bg-blue-300" },
                    { label: "Problem Solving & Complexity Analysis", value: analytics?.skillAverages.problemSolving || 86, color: "bg-amber-600 dark:bg-amber-300" }
                  ].map(skill => (
                    <div key={skill.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-black dark:text-gray-300 font-medium">{skill.label}</span>
                        <span className="font-bold text-black dark:text-white font-mono">{skill.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${skill.color} rounded-full`}
                          style={{ width: `${skill.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card className="bg-card border-border text-foreground">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    Candidate Score Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Placement readiness tier distribution across active candidates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(analytics?.scoreDistribution || []).map(dist => (
                    <div key={dist.range} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 dark:bg-muted/30 border border-border/50">
                      <span className="text-xs font-semibold text-foreground/80">{dist.range}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600/30 text-blue-600 dark:text-blue-300 border-blue-500/30 font-mono text-xs">
                          {dist.count} student{dist.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Top Placement Performers */}
            <Card className="bg-card border-border text-foreground">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Top Placement-Ready Candidates for Tier-1 Referrals
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Highest ranking candidates ready for direct corporate placement drives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analytics?.topPerformers || []).map((student, idx) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 dark:bg-muted/30 border border-border/50 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40" :
                            idx === 1 ? "bg-slate-300/20 text-slate-600 dark:text-slate-300 border border-slate-700/60 dark:border-slate-300/40" :
                              "bg-amber-700/20 text-amber-600 dark:text-amber-300 border border-amber-700/40"
                          }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{student.fullName}</div>
                          <div className="text-xs text-muted-foreground">{student.email} • {student.targetRole}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-emerald-400 text-sm">{student.averageScore}%</div>
                          <div className="text-[10px] text-muted-foreground">{student.interviewsCompleted} mocks</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStudentForReport(student)}
                          className="border-border text-xs h-8 bg-transparent text-gray-600 dark:text-gray-300 hover:bg-muted/50"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </main>

      {/* Enroll / Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground p-6 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Enroll Student to College Roster
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a student from <strong className="text-foreground">{college.name}</strong> to your directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStudentSubmit} className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/80 font-medium">Official College Email</Label>
              <Input
                type="email"
                placeholder="e.g. anurag.s25561@nst.rishihood.edu.in"
                value={newStudentEmail}
                onChange={e => setNewStudentEmail(e.target.value)}
                className="bg-muted/40 dark:bg-muted/30 border-border text-foreground text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/80 font-medium">Student Full Name</Label>
              <Input
                placeholder="e.g. Anurag Sonawane"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                className="bg-muted/40 dark:bg-muted/30 border-border text-foreground text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground/80 font-medium">Target Role</Label>
                <Select value={newStudentRole} onValueChange={setNewStudentRole}>
                  <SelectTrigger className="bg-muted/40 dark:bg-muted/30 border-border text-foreground text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                    <SelectItem value="Software Engineer / SDE-1">SDE-1 / SWE</SelectItem>
                    <SelectItem value="Frontend Engineer">Frontend Engineer</SelectItem>
                    <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
                    <SelectItem value="AI / ML Engineer">AI / ML Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-foreground/80 font-medium">Batch</Label>
                <Select value={newStudentBatch} onValueChange={setNewStudentBatch}>
                  <SelectTrigger className="bg-muted/40 dark:bg-muted/30 border-border text-foreground text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="2025">Batch 2025</SelectItem>
                    <SelectItem value="2026">Batch 2026</SelectItem>
                    <SelectItem value="2027">Batch 2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddStudentOpen(false)}
                className="border-border text-foreground text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
              >
                Enroll Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        college={college}
        students={students}
        preSelectedStudentEmails={preSelectedEmailsForSchedule}
        onDriveCreated={() => loadCollegeData(false)}
      />


      {/* Candidate AI Evaluation Report Modal */}
      {selectedCandidateForReport && (
        <Dialog open={!!selectedCandidateForReport} onOpenChange={() => setSelectedCandidateForReport(null)}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-card border-border text-foreground p-6 shadow-2xl rounded-2xl">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Candidate Assessment Report
                </DialogTitle>
                <Badge className={
                  (selectedCandidateForReport.candidate.score || 0) >= (selectedCandidateForReport.drive.passingScore || 75)
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-xs px-2.5 py-0.5 font-bold"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 text-xs px-2.5 py-0.5 font-bold"
                }>
                  {(selectedCandidateForReport.candidate.score || 0) >= (selectedCandidateForReport.drive.passingScore || 75)
                    ? "🎉 SELECTED"
                    : "NOT SELECTED"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {selectedCandidateForReport.drive.title} • {selectedCandidateForReport.drive.collegeName}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Candidate summary card */}
              <div className="p-4 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {selectedCandidateForReport.candidate.studentName || selectedCandidateForReport.candidate.studentEmail}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedCandidateForReport.candidate.studentEmail}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Completed: {selectedCandidateForReport.candidate.completedAt ? new Date(selectedCandidateForReport.candidate.completedAt).toLocaleString() : "Recently"}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Overall AI Score</div>
                  <div className={`text-2xl font-extrabold font-mono ${(selectedCandidateForReport.candidate.score || 0) >= (selectedCandidateForReport.drive.passingScore || 75)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                    }`}>
                    {selectedCandidateForReport.candidate.score}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Threshold: {selectedCandidateForReport.drive.passingScore || 75}%
                  </div>
                </div>
              </div>

              {/* Feedback note */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 text-xs space-y-1">
                <span className="font-bold text-blue-700 dark:text-blue-300 block">Placement Cell Assessment Summary:</span>
                <p className="text-foreground/90 leading-relaxed">
                  {selectedCandidateForReport.candidate.feedback}
                </p>
              </div>

              {/* Question-by-Question breakdown */}
              {selectedCandidateForReport.candidate.answers && selectedCandidateForReport.candidate.answers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Question-by-Question Evaluation ({selectedCandidateForReport.candidate.answers.length} Questions):
                  </h4>

                  {selectedCandidateForReport.candidate.answers.map((ans, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground">
                          Q{idx + 1}: {ans.question}
                        </span>
                        <Badge className={`text-[10px] font-mono font-bold ${ans.score >= (selectedCandidateForReport.drive.passingScore || 75)
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          }`}>
                          Score: {ans.score}%
                        </Badge>
                      </div>

                      <div className="bg-background/80 dark:bg-black/20 p-2.5 rounded-lg border border-border/60 text-foreground/90">
                        <strong className="text-muted-foreground block text-[10px] uppercase mb-0.5">Submitted Answer:</strong>
                        <p className="italic text-foreground/90">{ans.studentAnswer}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300">
                        <strong className="text-blue-700 dark:text-blue-300 block text-[10px] uppercase mb-0.5">AI Feedback:</strong>
                        <p>{ans.aiFeedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Comprehensive Student Interview Assessment & Feedback Report Dialog */}
      {selectedStudentForReport && (
        <Dialog open={!!selectedStudentForReport} onOpenChange={() => setSelectedStudentForReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground p-0 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-card to-blue-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-lg text-white shadow-lg shadow-blue-500/20">
                    {selectedStudentForReport.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-bold text-foreground">
                        {selectedStudentForReport.fullName}
                      </DialogTitle>
                      <Badge className={`text-[11px] px-2 py-0.5 border ${
                        (studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 80
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : (studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 60
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                      }`}>
                        {(studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 80 ? "Placement Ready 🎉" : (studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 60 ? "Intermediate" : "Needs Practice"}
                      </Badge>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                      <span>{selectedStudentForReport.email}</span>
                      <span>•</span>
                      <span>{selectedStudentForReport.branch} ({selectedStudentForReport.batch})</span>
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrintReport}
                    className="border-border text-xs gap-1.5 h-8 bg-card"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Print / Export
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleScheduleForSingleStudent(selectedStudentForReport.email);
                      setSelectedStudentForReport(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 h-8 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </div>

            {loadingReportData ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm">Compiling student evaluation report & AI analytics...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* 1. Scorecard Hero Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Overall Score */}
                  <div className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center shadow-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Overall AI Score</span>
                    <div className={`text-4xl font-black font-mono my-1 ${
                      (studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : (studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 60
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {studentReportData?.overallScore || selectedStudentForReport.averageScore}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Benchmark Cutoff: 75%
                    </span>
                  </div>

                  {/* Target Role */}
                  <div className="p-4 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Target Role</span>
                    <div className="font-bold text-foreground text-sm mt-1">{selectedStudentForReport.targetRole}</div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Assessed for Campus Placements</span>
                  </div>

                  {/* Interviews Taken */}
                  <div className="p-4 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Interviews Completed</span>
                    <div className="font-black text-2xl text-foreground mt-1">
                      {studentReportData?.interviewsCompleted || selectedStudentForReport.interviewsCompleted || 1}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {studentReportData?.durationMinutes || 25} Mins Avg Duration
                    </span>
                  </div>

                  {/* Placement Verdict */}
                  <div className="p-4 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Placement Status</span>
                    <div className="font-bold text-foreground text-sm mt-1 flex items-center gap-1.5">
                      {(studentReportData?.overallScore || selectedStudentForReport.averageScore) >= 80 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400">Selected / Shortlisted</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-amber-600 dark:text-amber-400">In Training / Prep</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Last Active: {studentReportData?.latestAssessmentDate || selectedStudentForReport.lastActive}
                    </span>
                  </div>
                </div>

                {/* 2. Executive Evaluation & AI Summary */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    <Bot className="w-4 h-4" />
                    AI Evaluator Executive Feedback & Summary
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-sans">
                    {studentReportData?.feedbackSummary || "Candidate demonstrated solid foundational understanding with good problem-solving instincts. Suggested improvement in time-complexity optimization and edge-case handling."}
                  </p>
                </div>

                {/* 3. Strengths & Areas for Improvement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      Key Technical Strengths ("What's Good")
                    </div>
                    <ul className="space-y-2">
                      {(studentReportData?.strengths || [
                        "Strong grasp of core data structures and algorithmic complexity",
                        "Articulate communication and structured approach to problem solving",
                        "Quick adaptation and clear explanation of trade-offs",
                        "Confident delivery and professional technical articulation"
                      ]).map((st, i) => (
                        <li key={i} className="text-xs text-foreground/85 flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      Areas for Improvement ("What Needs Work")
                    </div>
                    <ul className="space-y-2">
                      {(studentReportData?.weaknesses || [
                        "Can deepen edge-case coverage in multi-threaded & high-concurrency scenarios",
                        "Recommend adding explicit unit test validation before finalizing solutions",
                        "Further practice on distributed system caching & consistency strategies"
                      ]).map((wk, i) => (
                        <li key={i} className="text-xs text-foreground/85 flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Core Competencies Matrix (6 metrics) */}
                <div className="p-5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      Core Competency Scorecard
                    </h4>
                    <span className="text-[11px] text-muted-foreground">Scored on scale of 100</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: "Technical Accuracy & Depth", score: studentReportData?.detailedScores.technicalAccuracy || 84, color: "bg-blue-500" },
                      { name: "DSA & Algorithmic Problem Solving", score: studentReportData?.detailedScores.dsa || 82, color: "bg-indigo-500" },
                      { name: "Communication & Articulation", score: studentReportData?.detailedScores.communication || 88, color: "bg-emerald-500" },
                      { name: "System Design & Architecture", score: studentReportData?.detailedScores.systemDesign || 78, color: "bg-blue-500" },
                      { name: "Confidence & Executive Delivery", score: studentReportData?.detailedScores.confidence || 85, color: "bg-amber-500" },
                      { name: "Logic & Analytical Reasoning", score: studentReportData?.detailedScores.problemSolving || 80, color: "bg-cyan-500" },
                    ].map(comp => (
                      <div key={comp.name} className="space-y-1.5 p-3 rounded-xl bg-card border border-border/50">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground/90 font-medium">{comp.name}</span>
                          <span className="font-bold font-mono text-foreground">{comp.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${comp.color} rounded-full transition-all duration-500`} style={{ width: `${comp.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. 6Q Intelligence Matrix */}
                {studentReportData?.sixQScore && (
                  <div className="p-5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        6Q Intelligence Matrix (Cognitive & Behavioral Evaluation)
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { code: "IQ", title: "Intellectual", score: studentReportData.sixQScore.iq || 82, desc: "Algorithmic Logic" },
                        { code: "EQ", title: "Emotional", score: studentReportData.sixQScore.eq || 86, desc: "Team & Comms" },
                        { code: "CQ", title: "Coding", score: studentReportData.sixQScore.cq || 80, desc: "Syntax & Edge Cases" },
                        { code: "AQ", title: "Adversity", score: studentReportData.sixQScore.aq || 84, desc: "Handling Ambiguity" },
                        { code: "SQ", title: "System", score: studentReportData.sixQScore.sq || 78, desc: "Scalability & Architecture" },
                        { code: "MQ", title: "Mindset", score: studentReportData.sixQScore.mq || 88, desc: "Professional Drive" },
                      ].map(q => (
                        <div key={q.code} className="p-3 rounded-xl bg-card border border-border/50 text-center space-y-1">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase">{q.code} • {q.title}</div>
                          <div className="text-xl font-extrabold font-mono text-foreground">{q.score}</div>
                          <div className="text-[9px] text-muted-foreground line-clamp-1">{q.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Question-by-Question Evaluation Breakdown (if student has drive answers) */}
                {studentReportData?.driveEvaluations && studentReportData.driveEvaluations.some(d => d.answers && d.answers.length > 0) && (
                  <div className="p-5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Detailed Question-by-Question Evaluation
                    </h4>

                    <div className="space-y-3">
                      {studentReportData.driveEvaluations.flatMap(d => d.answers || []).map((ans, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-card border border-border/60 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-foreground">
                              Q{idx + 1}: {ans.question}
                            </span>
                            <Badge className={`text-[10px] font-mono font-bold ${
                              ans.score >= 75
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            }`}>
                              Score: {ans.score}%
                            </Badge>
                          </div>

                          <div className="bg-muted/50 p-2.5 rounded-lg border border-border/40 text-foreground/90">
                            <strong className="text-muted-foreground block text-[10px] uppercase mb-0.5">Candidate Answer:</strong>
                            <p className="italic">{ans.studentAnswer}</p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300">
                            <strong className="text-blue-700 dark:text-blue-400 block text-[10px] uppercase mb-0.5">AI Feedback:</strong>
                            <p>{ans.aiFeedback}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Completed Assessment History */}
                {studentReportData?.driveEvaluations && studentReportData.driveEvaluations.length > 0 && (
                  <div className="p-5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Placement Drives & Assessment History
                    </h4>

                    <div className="divide-y divide-border/50">
                      {studentReportData.driveEvaluations.map((evalItem, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                          <div>
                            <div className="font-semibold text-foreground">{evalItem.driveTitle}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {evalItem.interviewType.replace(/_/g, " ").toUpperCase()} • {new Date(evalItem.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right font-mono">
                              <span className="font-bold text-foreground text-sm">{evalItem.score}%</span>
                              <span className="text-[10px] text-muted-foreground block">Pass: {evalItem.passingScore}%</span>
                            </div>
                            <Badge className={`text-[10px] font-bold ${
                              evalItem.isPassed
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            }`}>
                              {evalItem.selectionVerdict}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CollegeAdminDashboard;
