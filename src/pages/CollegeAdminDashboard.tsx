import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { 
  Building2, GraduationCap, Users, Calendar, Plus, Download, 
  Search, Award, Sparkles, LogOut, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, ExternalLink, Bot, Video, Code, Layers, Mail, Phone,
  TrendingUp, BarChart3, ShieldCheck, Filter, ArrowUpRight, Trophy, RefreshCw, UserPlus,
  Copy, Link, Play
} from "lucide-react";
import { 
  College, CollegeStudent, CollegeScheduledDrive, CollegeAnalytics, 
  collegeService 
} from "@/services/collegeService";
import { ScheduleInterviewModal } from "@/components/college/ScheduleInterviewModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
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
  const [selectedDriveForDetails, setSelectedDriveForDetails] = useState<CollegeScheduledDrive | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<CollegeStudent | null>(null);
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
            }).catch(() => {});
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

  const loadCollegeData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);

    const session = collegeService.getCollegeSession();
    if (!session) {
      navigate("/college/auth");
      return;
    }

    setCollege(session);
    try {
      const studentList = await collegeService.getCollegeStudents(session.id);
      const drivesList = collegeService.getCollegeDrives(session.id);
      const analyticsData = await collegeService.getCollegeAnalytics(session.id);

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
      <div className="min-h-screen bg-[#07070c] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading College Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070c] text-white selection:bg-violet-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c14]/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img
                src="/images/voke_logo.png"
                alt="Voke Logo"
                className="w-8 h-8 object-contain group-hover:rotate-12 transition-transform duration-300"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                Voke <span className="text-xs text-violet-400 font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">Institutional</span>
              </span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">{college.name}</span>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5">
                {college.tier}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualRefresh}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs h-9 px-3"
              title="Sync latest student registrations"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddStudentOpen(true)}
              className="border-violet-500/30 bg-violet-600/10 text-violet-300 hover:bg-violet-600 hover:text-white text-xs h-9 px-3 hidden md:flex items-center"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Enroll Student
            </Button>

            <Button
              onClick={() => {
                setPreSelectedEmailsForSchedule([]);
                setScheduleModalOpen(true);
              }}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs md:text-sm px-3.5 md:px-4 py-2 shadow-lg shadow-violet-600/25 h-9"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule Drive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs hidden lg:flex items-center gap-1.5 h-9"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white hover:bg-white/5 text-xs h-9"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* College Header Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-violet-950/40 via-[#0e0e1a] to-[#0c0c16] border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <GraduationCap className="w-48 h-48 text-violet-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                  {college.shortName} Placement & Training Cell
                </Badge>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Academic Year {college.contractPeriod}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {college.name}
              </h1>
              <p className="text-sm text-gray-400">
                Placement Admin: <strong className="text-gray-200">{college.adminName}</strong> ({college.adminEmail}) • Authorized Domains: <span className="font-mono text-violet-300 text-xs">{college.domains.map(d => `@${d}`).join(", ")}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-white">{students.length}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider">Registered</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-emerald-400">
                  {analytics?.placementReadyPercentage || 0}%
                </div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider">Ready Rate</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-violet-400">{drives.length}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider">Mock Drives</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0e0e18]/80 border-white/10 text-white backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Students Roster</span>
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-white">{students.length}</div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-mapped via college domain
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0e0e18]/80 border-white/10 text-white backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Mocks Conducted</span>
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{analytics?.totalInterviewsTaken || 0}</div>
              <p className="text-[11px] text-gray-400 mt-1">
                AI technical & coding sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0e0e18]/80 border-white/10 text-white backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg AI Score</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{analytics?.averageScore || 0}%</div>
              <p className="text-[11px] text-gray-400 mt-1">
                DSA, System Design & Articulation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0e0e18]/80 border-white/10 text-white backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Drives</span>
                <Calendar className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-2xl font-bold text-pink-400">{drives.filter(d => d.status === "active").length}</div>
              <p className="text-[11px] text-gray-400 mt-1">
                Scheduled placement rounds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/10">
            <TabsList className="bg-[#0e0e18] border border-white/10 p-1">
              <TabsTrigger 
                value="students" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs md:text-sm py-1.5"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Registered Students ({students.length})
              </TabsTrigger>
              <TabsTrigger 
                value="drives" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs md:text-sm py-1.5"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                Scheduled Drives ({drives.length})
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs md:text-sm py-1.5"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Placement Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs md:text-sm py-1.5"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                College Config
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddStudentOpen(true)}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs h-8"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1 text-violet-400" />
                Enroll Student
              </Button>

              {activeTab === "students" && selectedStudentEmails.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-violet-300 font-medium">
                    {selectedStudentEmails.length} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={handleScheduleForSelectedStudents}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Schedule Drive
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: Registered Students Directory */}
          <TabsContent value="students" className="space-y-4 mt-0">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0e0e18] p-3 rounded-xl border border-white/10">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search student by name, email, role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/10 pl-9 text-xs text-white placeholder:text-gray-500 h-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                  {[
                    { id: "all", label: "All" },
                    { id: "ready", label: "Ready (80%+)" },
                    { id: "intermediate", label: "Intermediate" },
                    { id: "needs_practice", label: "Needs Prep" }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        statusFilter === filter.id
                          ? "bg-violet-600 text-white font-medium"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="rounded-xl border border-white/10 bg-[#0e0e18]/90 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudentEmails.length === filteredStudents.length
                        }
                        onCheckedChange={handleSelectAllFilteredStudents}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300">Student & College Email</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300">Branch & Batch</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300">Target Role</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300 text-center">Mocks</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300 text-center">Avg AI Score</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300">Placement Readiness</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                        <h4 className="font-semibold text-white text-sm mb-1">No Registered Students Yet</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                          Students with authorized college email domains will automatically appear here once they sign up, or you can enroll them directly.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setAddStudentOpen(true)}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                          Enroll Student
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => {
                      const isSelected = selectedStudentEmails.includes(student.email);
                      return (
                        <TableRow 
                          key={student.id}
                          className={`border-white/5 transition-colors ${
                            isSelected ? "bg-violet-600/10" : "hover:bg-white/5"
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
                              <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center font-bold text-xs text-violet-200">
                                {student.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                                  {student.fullName}
                                </div>
                                <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-500" />
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-300">{student.branch}</div>
                            <div className="text-[11px] text-gray-500 font-mono">{student.batch}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-300">{student.targetRole}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-white/10 text-gray-300 font-mono text-xs">
                              {student.interviewsCompleted}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold text-sm font-mono ${
                              student.averageScore >= 85 ? "text-emerald-400" :
                              student.averageScore >= 70 ? "text-amber-400" : "text-rose-400"
                            }`}>
                              {student.averageScore}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[11px] px-2.5 py-0.5 border ${
                              student.readinessStatus === "Placement Ready"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : student.readinessStatus === "Intermediate"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
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
                                className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                              >
                                Report
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleScheduleForSingleStudent(student.email)}
                                className="h-8 px-2.5 text-xs bg-violet-600/30 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/30"
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
                <h3 className="text-base font-semibold text-white">Campus Mock Placement Drives</h3>
                <p className="text-xs text-gray-400">
                  Custom mock interview assessments assigned to students by your college training & placement cell.
                </p>
              </div>
              <Button
                onClick={() => {
                  setPreSelectedEmailsForSchedule([]);
                  setScheduleModalOpen(true);
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Schedule New Drive
              </Button>
            </div>

            {drives.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-xl border border-white/10 bg-[#0e0e18]/80 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <h4 className="font-semibold text-white text-sm mb-1">No Placement Drives Scheduled Yet</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                  Schedule customized mock interviews and placement drives for your college students.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setPreSelectedEmailsForSchedule([]);
                    setScheduleModalOpen(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Schedule First Placement Drive
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drives.map(drive => (
                  <Card 
                    key={drive.id}
                    className="bg-[#0e0e18] border-white/10 text-white overflow-hidden hover:border-violet-500/40 transition-all cursor-pointer group"
                    onClick={() => setSelectedDriveForDetails(drive)}
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                              drive.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                              drive.status === "scheduled" ? "bg-violet-500/20 text-violet-300 border-violet-500/30" :
                              "bg-gray-500/20 text-gray-300 border-gray-500/30"
                            }`}>
                              {drive.status}
                            </Badge>
                            <span className="text-xs text-gray-400 font-mono">
                              {drive.durationMinutes} mins • Benchmark: {drive.passingScore}%
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                            {drive.title}
                          </h4>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-violet-400" /> Target Role: <span className="text-gray-200 font-medium">{drive.targetRole}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Candidate Participation:</span>
                          <span className="font-semibold text-white">
                            {drive.completedCount} / {drive.candidatesCount} Completed
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
                            style={{
                              width: `${drive.candidatesCount > 0 ? (drive.completedCount / drive.candidatesCount) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <span>Window: {drive.scheduledDate} → {drive.deadlineDate}</span>
                          {drive.completedCount > 0 && (
                            <span className="text-emerald-400 font-semibold">Avg Score: {drive.avgScore}%</span>
                          )}
                        </div>
                      </div>

                      {drive.targetCompanies && drive.targetCompanies.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-gray-500">Benchmarked against:</span>
                          {drive.targetCompanies.map(c => (
                            <Badge key={c} variant="outline" className="text-[10px] border-white/10 text-gray-300">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs text-violet-400 font-medium">
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
              <Card className="bg-[#0e0e18] border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Institutional Skill Competency Averages
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Evaluated across all AI mock interviews taken by {college.shortName} students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Data Structures & Algorithms", value: analytics?.skillAverages.dsa || 85, color: "bg-emerald-500" },
                    { label: "System Design & Architecture", value: analytics?.skillAverages.systemDesign || 80, color: "bg-cyan-500" },
                    { label: "Technical Articulation & Communication", value: analytics?.skillAverages.communication || 88, color: "bg-violet-500" },
                    { label: "Problem Solving & Complexity Analysis", value: analytics?.skillAverages.problemSolving || 86, color: "bg-amber-500" }
                  ].map(skill => (
                    <div key={skill.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium">{skill.label}</span>
                        <span className="font-bold text-white font-mono">{skill.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
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
              <Card className="bg-[#0e0e18] border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    Candidate Score Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Placement readiness tier distribution across active candidates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(analytics?.scoreDistribution || []).map(dist => (
                    <div key={dist.range} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-xs font-semibold text-gray-300">{dist.range}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-violet-600/30 text-violet-300 border-violet-500/30 font-mono text-xs">
                          {dist.count} student{dist.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Top Placement Performers */}
            <Card className="bg-[#0e0e18] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Top Placement-Ready Candidates for Tier-1 Referrals
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Highest ranking candidates ready for direct corporate placement drives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analytics?.topPerformers || []).map((student, idx) => (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          idx === 1 ? "bg-slate-300/20 text-slate-200 border border-slate-300/40" :
                          "bg-amber-700/20 text-amber-500 border border-amber-700/40"
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-white">{student.fullName}</div>
                          <div className="text-xs text-gray-400">{student.email} • {student.targetRole}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-emerald-400 text-sm">{student.averageScore}%</div>
                          <div className="text-[10px] text-gray-400">{student.interviewsCompleted} mocks</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStudentForReport(student)}
                          className="border-white/10 text-xs h-8 bg-transparent text-gray-300 hover:bg-white/10"
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

          {/* TAB 4: College Config & Domain Settings */}
          <TabsContent value="settings" className="space-y-4 mt-0">
            <Card className="bg-[#0e0e18] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-violet-400" />
                  Institutional Partnership Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <Label className="text-xs text-gray-400 uppercase">Institution Name</Label>
                    <div className="font-bold text-white text-base">{college.name}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <Label className="text-xs text-gray-400 uppercase">Partnership Tier</Label>
                    <div className="font-bold text-emerald-400 text-base">{college.tier}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <Label className="text-xs text-gray-400 uppercase">Authorized Email Domains</Label>
                    <div className="font-mono text-violet-300 text-sm">
                      {college.domains.map(d => `@${d}`).join(", ")}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Students using these email addresses get instant college partner access.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <Label className="text-xs text-gray-400 uppercase">T&P Coordinator Contact</Label>
                    <div className="font-semibold text-white">{college.adminName}</div>
                    <div className="text-xs text-gray-400">{college.adminEmail} • {college.contactPhone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Enroll / Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-md bg-[#0c0c14] border-white/10 text-white p-6">
          <DialogHeader className="border-b border-white/10 pb-3">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-400" />
              Enroll Student to College Roster
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Add a student from <strong className="text-white">{college.name}</strong> to your directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStudentSubmit} className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Official College Email</Label>
              <Input
                type="email"
                placeholder="e.g. anurag.s25561@nst.rishihood.edu.in"
                value={newStudentEmail}
                onChange={e => setNewStudentEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Student Full Name</Label>
              <Input
                placeholder="e.g. Anurag Sonawane"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Target Role</Label>
                <Select value={newStudentRole} onValueChange={setNewStudentRole}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121a] border-white/10 text-white text-xs">
                    <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                    <SelectItem value="Software Engineer / SDE-1">SDE-1 / SWE</SelectItem>
                    <SelectItem value="Frontend Engineer">Frontend Engineer</SelectItem>
                    <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
                    <SelectItem value="AI / ML Engineer">AI / ML Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Batch</Label>
                <Select value={newStudentBatch} onValueChange={setNewStudentBatch}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121a] border-white/10 text-white text-xs">
                    <SelectItem value="2025">Batch 2025</SelectItem>
                    <SelectItem value="2026">Batch 2026</SelectItem>
                    <SelectItem value="2027">Batch 2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddStudentOpen(false)}
                className="border-white/10 text-gray-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
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

      {/* Drive Details & Candidate Results Modal */}
      {selectedDriveForDetails && (
        <Dialog open={!!selectedDriveForDetails} onOpenChange={() => setSelectedDriveForDetails(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0c0c14] border-white/10 text-white p-6">
            <DialogHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                  {selectedDriveForDetails.status.toUpperCase()} DRIVE
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-white mt-1">
                {selectedDriveForDetails.title}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                Target Role: <strong className="text-gray-200">{selectedDriveForDetails.targetRole}</strong> • Passing Benchmark: <strong className="text-emerald-400">{selectedDriveForDetails.passingScore}%</strong> • Duration: {selectedDriveForDetails.durationMinutes} mins
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Direct Interview Room Link */}
              <div className="p-3.5 rounded-xl bg-violet-950/25 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-violet-400" /> Direct Candidate Assessment Link
                  </div>
                  <p className="text-[11px] font-mono text-gray-300 truncate">
                    {selectedDriveForDetails.interviewUrl || `${window.location.origin}/adaptive-interview?role=${encodeURIComponent(selectedDriveForDetails.targetRole)}&driveId=${selectedDriveForDetails.id}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = selectedDriveForDetails.interviewUrl || `${window.location.origin}/adaptive-interview?role=${encodeURIComponent(selectedDriveForDetails.targetRole)}&driveId=${selectedDriveForDetails.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Interview link copied to clipboard!");
                    }}
                    className="border-violet-500/30 text-violet-200 hover:bg-violet-600 hover:text-white text-xs h-8 px-2.5"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const url = selectedDriveForDetails.interviewUrl || `${window.location.origin}/adaptive-interview?role=${encodeURIComponent(selectedDriveForDetails.targetRole)}&driveId=${selectedDriveForDetails.id}`;
                      window.open(url, "_blank");
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-2.5"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Test Link
                  </Button>
                </div>
              </div>

              {/* Uploaded Question Bank */}
              <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                    Uploaded Question Set ({selectedDriveForDetails.customQuestions?.length || 3} Questions)
                  </h4>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    Passing Benchmark: {selectedDriveForDetails.passingScore || 75}%
                  </Badge>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {(selectedDriveForDetails.customQuestions && selectedDriveForDetails.customQuestions.length > 0 
                    ? selectedDriveForDetails.customQuestions 
                    : [
                        { id: "q1", question: "Explain difference between process and thread, PCB/TCB switching.", difficulty: "Medium", expectedAnswerOrKeyPoints: "Memory isolation, virtual address space vs heap" },
                        { id: "q2", question: "Implement LRU Cache with O(1) get and put operations.", difficulty: "Medium", expectedAnswerOrKeyPoints: "Doubly linked list + hash map" },
                        { id: "q3", question: "QuickSort vs MergeSort complexity and real-world selection trade-offs.", difficulty: "Medium", expectedAnswerOrKeyPoints: "O(N log N) avg vs worst, memory auxiliary space" }
                      ]
                  ).map((q, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/10 text-gray-300 text-[9px] px-1.5 py-0 font-mono">
                          Q{idx + 1}
                        </Badge>
                        <span className="text-[10px] text-violet-400 font-semibold uppercase">
                          {q.difficulty || "Medium"}
                        </span>
                        <span className="text-gray-200 font-medium">{q.question}</span>
                      </div>
                      {q.expectedAnswerOrKeyPoints && (
                        <p className="text-[11px] text-gray-400 pl-6">
                          <strong className="text-violet-300">Expected:</strong> {q.expectedAnswerOrKeyPoints}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Drive Instructions:
                </h4>
                <p className="text-xs text-gray-300 p-3 rounded-lg bg-white/5 border border-white/5">
                  {selectedDriveForDetails.instructions}
                </p>
              </div>

              {/* Candidate Evaluations & Selection Verdict Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Candidate Results & Selection Status:
                  </h4>
                  <div className="text-xs text-gray-400">
                    Threshold: <span className="text-emerald-400 font-bold">{selectedDriveForDetails.passingScore || 75}%</span>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10">
                        <TableHead className="text-xs text-gray-300">Candidate Email</TableHead>
                        <TableHead className="text-xs text-gray-300">Status</TableHead>
                        <TableHead className="text-xs text-gray-300 text-center">Score</TableHead>
                        <TableHead className="text-xs text-gray-300 text-center">Selection Verdict</TableHead>
                        <TableHead className="text-xs text-gray-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDriveForDetails.candidates && selectedDriveForDetails.candidates.length > 0 ? (
                        selectedDriveForDetails.candidates.map(candidate => {
                          const hasAttempted = candidate.status === "Completed" && candidate.score !== undefined;
                          const isCandidatePassed = hasAttempted && (
                            candidate.selectionVerdict === "SELECTED" || 
                            (candidate.score !== undefined && candidate.score >= selectedDriveForDetails.passingScore)
                          );

                          return (
                            <TableRow key={candidate.studentEmail} className="border-white/5 text-xs">
                              <TableCell className="font-mono text-gray-200">
                                <div className="font-semibold text-white">{candidate.studentName || candidate.studentEmail.split('@')[0]}</div>
                                <div className="text-[11px] text-gray-400">{candidate.studentEmail}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-[10px] ${
                                  candidate.status === "Completed"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                }`}>
                                  {candidate.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-bold font-mono">
                                {candidate.score !== undefined ? (
                                  <span className={isCandidatePassed ? "text-emerald-400" : "text-rose-400"}>
                                    {candidate.score}%
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {!hasAttempted ? (
                                  <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">
                                    Pending
                                  </Badge>
                                ) : isCandidatePassed ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                                    <Check className="w-3 h-3 mr-1" /> SELECTED
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-bold">
                                    <X className="w-3 h-3 mr-1" /> NOT SELECTED
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {hasAttempted ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedCandidateForReport({
                                      candidate,
                                      drive: selectedDriveForDetails
                                    })}
                                    className="border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white text-xs h-7 px-2"
                                  >
                                    <FileText className="w-3 h-3 mr-1" /> AI Report
                                  </Button>
                                ) : (
                                  <span className="text-gray-500 text-[11px]">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                            No candidate records found for this drive.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Candidate AI Evaluation Report Modal */}
      {selectedCandidateForReport && (
        <Dialog open={!!selectedCandidateForReport} onOpenChange={() => setSelectedCandidateForReport(null)}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-[#0c0c14] border-white/10 text-white p-6 shadow-2xl">
            <DialogHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-400" />
                  Candidate Assessment Report
                </DialogTitle>
                <Badge className={
                  (selectedCandidateForReport.candidate.score || 0) >= (selectedCandidateForReport.drive.passingScore || 75)
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-2.5 py-0.5 font-bold"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs px-2.5 py-0.5 font-bold"
                }>
                  {(selectedCandidateForReport.candidate.score || 0) >= (selectedCandidateForReport.drive.passingScore || 75)
                    ? "🎉 SELECTED"
                    : "NOT SELECTED"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-gray-400 mt-1">
                {selectedCandidateForReport.drive.title} • {selectedCandidateForReport.drive.collegeName}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Candidate summary card */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-white">
                    {selectedCandidateForReport.candidate.studentName || selectedCandidateForReport.candidate.studentEmail}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {selectedCandidateForReport.candidate.studentEmail}
                  </p>
                  <p className="text-xs text-violet-300 mt-0.5">
                    Completed: {selectedCandidateForReport.candidate.completedAt ? new Date(selectedCandidateForReport.candidate.completedAt).toLocaleString() : "Recently"}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Overall AI Score</div>
                  <div className={`text-2xl font-extrabold font-mono ${
                    (selectedCandidateForReport.candidate.score || 0) >= (selectedCandidateForReport.drive.passingScore || 75)
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}>
                    {selectedCandidateForReport.candidate.score}%
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Threshold: {selectedCandidateForReport.drive.passingScore || 75}%
                  </div>
                </div>
              </div>

              {/* Feedback note */}
              <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs space-y-1">
                <span className="font-bold text-violet-300 block">Placement Cell Assessment Summary:</span>
                <p className="text-gray-300 leading-relaxed">
                  {selectedCandidateForReport.candidate.feedback}
                </p>
              </div>

              {/* Question-by-Question breakdown */}
              {selectedCandidateForReport.candidate.answers && selectedCandidateForReport.candidate.answers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Question-by-Question Evaluation ({selectedCandidateForReport.candidate.answers.length} Questions):
                  </h4>

                  {selectedCandidateForReport.candidate.answers.map((ans, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-violet-300">
                          Q{idx + 1}: {ans.question}
                        </span>
                        <Badge className={`text-[10px] font-mono font-bold ${
                          ans.score >= (selectedCandidateForReport.drive.passingScore || 75)
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}>
                          Score: {ans.score}%
                        </Badge>
                      </div>

                      <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 text-gray-300">
                        <strong className="text-gray-400 block text-[10px] uppercase mb-0.5">Submitted Answer:</strong>
                        <p className="italic text-gray-300">{ans.studentAnswer}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-violet-950/20 border border-violet-500/20 text-violet-200">
                        <strong className="text-violet-400 block text-[10px] uppercase mb-0.5">AI Feedback:</strong>
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

      {/* Student Report Dialog */}
      {selectedStudentForReport && (
        <Dialog open={!!selectedStudentForReport} onOpenChange={() => setSelectedStudentForReport(null)}>
          <DialogContent className="max-w-xl bg-[#0c0c14] border-white/10 text-white p-6">
            <DialogHeader className="border-b border-white/10 pb-4">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Student Placement Profile
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-lg text-violet-200">
                  {selectedStudentForReport.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedStudentForReport.fullName}</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedStudentForReport.email}</p>
                  <p className="text-xs text-violet-300 mt-0.5">
                    {selectedStudentForReport.branch} • {selectedStudentForReport.batch}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-400">Target Role</div>
                  <div className="font-semibold text-white text-sm">{selectedStudentForReport.targetRole}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-400">AI Readiness Score</div>
                  <div className="font-bold text-emerald-400 text-sm">{selectedStudentForReport.averageScore}%</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Skill Competencies:
                </h4>
                <div className="space-y-2">
                  {Object.entries(selectedStudentForReport.skills || {}).map(([skill, val]) => (
                    <div key={skill} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">{skill}</span>
                        <span className="font-bold text-white">{val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <Button
                  size="sm"
                  onClick={() => {
                    handleScheduleForSingleStudent(selectedStudentForReport.email);
                    setSelectedStudentForReport(null);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Schedule Mock Interview for Student
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CollegeAdminDashboard;
