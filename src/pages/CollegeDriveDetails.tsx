import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Play,
  BookOpen,
  Link,
  Check,
  X,
  FileText,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { collegeService } from "@/services/collegeService";
import {
  CollegeScheduledDrive,
  ScheduledDriveCandidate as CandidateProgress,
} from "@/services/collegeService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScheduleInterviewModal } from "@/components/college/ScheduleInterviewModal";

const DriveHeader = () => (
  <header className="sticky top-0 z-40 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 md:px-8 py-3.5 transition-colors duration-300">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => (window.location.href = "/")}
        >
          <img
            src="/images/voke_logo.png"
            alt="Voke Logo"
            className="w-8 h-8 object-contain group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Voke{" "}
            <span className="text-xs text-blue-600 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              Institutional
            </span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
      </div>
    </div>
  </header>
);

const CollegeDriveDetails: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const [drive, setDrive] = useState<CollegeScheduledDrive | null>(null);

  // State for the AI Report dialog
  const [selectedCandidateForReport, setSelectedCandidateForReport] = useState<{
    candidate: CandidateProgress;
    drive: CollegeScheduledDrive;
  } | null>(null);

  // State for Uploaded Question Set expansion
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);

  // State for Edit / Delete
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [college, setCollege] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);

  const handleDelete = () => {
    if (driveId) {
      collegeService.deleteCollegeDrive(driveId);
      toast.success("Interview drive deleted successfully");
      navigate("/college/dashboard");
    }
  };

  const refreshDrive = () => {
    if (driveId) {
      const foundDrive = collegeService.getCollegeDriveById(driveId);
      if (foundDrive) {
        setDrive(foundDrive);
      }
    }
  };

  useEffect(() => {
    if (driveId) {
      const foundDrive = collegeService.getCollegeDriveById(driveId);
      if (foundDrive) {
        setDrive(foundDrive);
        let col = collegeService.getCollegeById(foundDrive.collegeId);
        if (!col) {
          col = collegeService.getColleges()[0];
        }
        if (col) {
          setCollege(col);
          collegeService.getCollegeStudents(col.id).then(setStudents);
        }
      } else {
        toast.error("Drive not found.");
        navigate("/college/dashboard");
      }
    }
  }, [driveId, navigate]);

  if (!drive) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DriveHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const interviewLink =
    drive.interviewUrl ||
    `${window.location.origin}/adaptive-interview?role=${encodeURIComponent(drive.targetRole)}&driveId=${drive.id}`;

  const customQuestions =
    drive.customQuestions && drive.customQuestions.length > 0
      ? drive.customQuestions
      : [
          {
            id: "q1",
            question:
              "Explain difference between process and thread, PCB/TCB switching.",
            difficulty: "Medium",
            expectedAnswerOrKeyPoints:
              "Memory isolation, virtual address space vs heap",
          },
          {
            id: "q2",
            question: "Implement LRU Cache with O(1) get and put operations.",
            difficulty: "Medium",
            expectedAnswerOrKeyPoints: "Doubly linked list + hash map",
          },
          {
            id: "q3",
            question:
              "QuickSort vs MergeSort complexity and real-world selection trade-offs.",
            difficulty: "Medium",
            expectedAnswerOrKeyPoints:
              "O(N log N) avg vs worst, memory auxiliary space",
          },
        ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-blue-500/30">
      <DriveHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
        {/* Header section with back button */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/college/dashboard")}
              className="mb-4 text-muted-foreground hover:text-foreground pl-0 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2 mb-2">
              <Badge
                className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                  drive.status === "active"
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : drive.status === "scheduled"
                      ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      : "bg-gray-500/20 text-muted-foreground border-gray-500/30"
                }`}
              >
                {drive.status} DRIVE
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {drive.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Target Role:{" "}
              <strong className="text-foreground">{drive.targetRole}</strong> •
              Passing Benchmark:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {drive.passingScore}%
              </strong>{" "}
              • Duration: {drive.durationMinutes} mins
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-center md:justify-start gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs border-border w-full md:w-32 bg-card hover:bg-muted/80 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
              Edit Interview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-600 w-full md:w-32 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Drive
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Direct Interview Room Link */}
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />{" "}
                Direct Candidate Assessment Link
              </div>
              <p className="text-xs font-mono text-muted-foreground truncate">
                {interviewLink}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(interviewLink);
                  toast.success("Interview link copied to clipboard!");
                }}
                className="border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-600/50 text-xs h-9 px-3"
              >
                <Copy className="w-4 h-4 mr-1.5" /> Copy Link
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(interviewLink, "_blank")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 px-3"
              >
                <Play className="w-4 h-4 mr-1.5" /> Test Link
              </Button>
            </div>
          </div>

          {/* Uploaded Question Bank */}
          <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-4">
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
            >
              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5 group-hover:opacity-80 transition-opacity">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Uploaded Question Set ({customQuestions.length} Questions)
                {isQuestionsExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-1 opacity-50" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                )}
              </h4>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs">
                Passing Benchmark: {drive.passingScore || 75}%
              </Badge>
            </div>

            {isQuestionsExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                {customQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-muted/40 dark:bg-black/40 border border-border/50 text-sm space-y-1.5"
                  >
                    <div className="flex items-start md:items-center gap-2 flex-col md:flex-row">
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-muted text-foreground/80 text-[10px] px-2 py-0.5 font-mono">
                          Q{idx + 1}
                        </Badge>
                        <span className="text-xs text-blue-600 dark:text-blue-300 font-semibold uppercase">
                          {q.difficulty || "Medium"}
                        </span>
                      </div>
                      <span className="text-foreground font-medium">
                        {q.question}
                      </span>
                    </div>
                    {q.expectedAnswerOrKeyPoints && (
                      <p className="text-xs text-muted-foreground pl-0 md:pl-20 mt-1">
                        <strong className="text-blue-700 dark:text-blue-300">
                          Expected:
                        </strong>{" "}
                        {q.expectedAnswerOrKeyPoints}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Drive Instructions:
            </h4>
            <p className="text-sm text-foreground/90 p-4 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
              {drive.instructions}
            </p>
          </div>

          {/* Candidate Evaluations & Selection Verdict Table */}
          <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                Candidate Results & Selection Status
              </h4>
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md border border-border/50">
                Threshold:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {drive.passingScore || 75}%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/40 dark:bg-muted/30">
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-semibold text-foreground/80">
                      Candidate Email
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 text-center">
                      Score
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 text-center">
                      Selection Verdict
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drive.candidates && drive.candidates.length > 0 ? (
                    drive.candidates.map((candidate) => {
                      const hasAttempted =
                        candidate.status === "Completed" &&
                        candidate.score !== undefined;
                      const isCandidatePassed =
                        hasAttempted &&
                        (candidate.selectionVerdict === "SELECTED" ||
                          (candidate.score !== undefined &&
                            candidate.score >= (drive.passingScore || 75)));

                      return (
                        <TableRow
                          key={candidate.studentEmail}
                          className="border-border/50 transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="font-mono text-foreground">
                            <div className="font-semibold text-sm text-foreground">
                              {candidate.studentName ||
                                candidate.studentEmail.split("@")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {candidate.studentEmail}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] uppercase tracking-wider ${
                                candidate.status === "Completed"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              }`}
                            >
                              {candidate.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold font-mono">
                            {candidate.score !== undefined ? (
                              <span
                                className={
                                  isCandidatePassed
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }
                              >
                                {candidate.score}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {!hasAttempted ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-border text-muted-foreground"
                              >
                                Pending
                              </Badge>
                            ) : isCandidatePassed ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                                <Check className="w-3 h-3 mr-1" /> SELECTED
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold px-2 py-0.5">
                                <X className="w-3 h-3 mr-1" /> NOT SELECTED
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasAttempted ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedCandidateForReport({
                                    candidate,
                                    drive,
                                  })
                                }
                                className="border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-xs h-8 px-3"
                              >
                                <FileText className="w-3 h-3 mr-1.5" /> AI
                                Report
                              </Button>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">
                                -
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                          <p>No candidate records found for this drive yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      {/* Candidate AI Evaluation Report Modal */}
      {selectedCandidateForReport && (
        <Dialog
          open={!!selectedCandidateForReport}
          onOpenChange={() => setSelectedCandidateForReport(null)}
        >
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-card border-border p-6 shadow-2xl">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Candidate Assessment Report
                </DialogTitle>
                <Badge
                  className={
                    (selectedCandidateForReport.candidate.score || 0) >=
                    (selectedCandidateForReport.drive.passingScore || 75)
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 font-bold uppercase"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs px-2.5 py-0.5 font-bold uppercase"
                  }
                >
                  {(selectedCandidateForReport.candidate.score || 0) >=
                  (selectedCandidateForReport.drive.passingScore || 75)
                    ? "🎉 SELECTED"
                    : "NOT SELECTED"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {selectedCandidateForReport.drive.title} •{" "}
                {selectedCandidateForReport.drive.collegeName}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-5">
              {/* Candidate summary card */}
              <div className="p-4 rounded-xl bg-muted/30 dark:bg-muted/20 border border-border flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {selectedCandidateForReport.candidate.studentName ||
                      selectedCandidateForReport.candidate.studentEmail}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {selectedCandidateForReport.candidate.studentEmail}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-1.5 flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    Completed:{" "}
                    {selectedCandidateForReport.candidate.completedAt
                      ? new Date(
                          selectedCandidateForReport.candidate.completedAt,
                        ).toLocaleString()
                      : "Recently"}
                  </p>
                </div>

                <div className="text-right p-3 bg-background rounded-lg border border-border shadow-sm min-w-[120px]">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    Overall AI Score
                  </div>
                  <div
                    className={`text-3xl font-extrabold font-mono ${
                      (selectedCandidateForReport.candidate.score || 0) >=
                      (selectedCandidateForReport.drive.passingScore || 75)
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {selectedCandidateForReport.candidate.score}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                    Threshold:{" "}
                    {selectedCandidateForReport.drive.passingScore || 75}%
                  </div>
                </div>
              </div>

              {/* Feedback note */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-sm space-y-2">
                <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" /> Placement Cell Assessment
                  Summary:
                </span>
                <p className="text-foreground/80 leading-relaxed pl-5 border-l-2 border-blue-200 dark:border-blue-800 ml-2">
                  {selectedCandidateForReport.candidate.feedback}
                </p>
              </div>

              {/* Question-by-Question breakdown */}
              {selectedCandidateForReport.candidate.answers &&
                selectedCandidateForReport.candidate.answers.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      Question-by-Question Evaluation (
                      {selectedCandidateForReport.candidate.answers.length}{" "}
                      Questions)
                      <div className="h-px flex-1 bg-border ml-2"></div>
                    </h4>

                    {selectedCandidateForReport.candidate.answers.map(
                      (ans, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-3 text-sm transition-all hover:border-blue-500/30"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-2 max-w-lg">
                              <Badge className="bg-muted text-foreground/80 shrink-0 text-[10px] px-2 py-0.5 mt-0.5 font-mono">
                                Q{idx + 1}
                              </Badge>
                              <span className="font-semibold text-foreground leading-snug">
                                {ans.question}
                              </span>
                            </div>
                            <Badge
                              className={`shrink-0 text-[11px] font-mono font-bold px-2.5 py-1 ${
                                ans.score >=
                                (selectedCandidateForReport.drive
                                  .passingScore || 75)
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                              }`}
                            >
                              Score: {ans.score}%
                            </Badge>
                          </div>

                          <div className="bg-muted/30 dark:bg-muted/20 p-3 rounded-lg border border-border/50 text-foreground/90 ml-8">
                            <strong className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">
                              Submitted Answer:
                            </strong>
                            <p className="italic text-foreground/80 text-xs md:text-sm">
                              {ans.studentAnswer}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-200 ml-8">
                            <strong className="text-blue-600 dark:text-blue-400 block text-[10px] uppercase tracking-wider mb-1">
                              AI Feedback:
                            </strong>
                            <p className="text-xs md:text-sm">
                              {ans.aiFeedback}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Interview Drive
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-3">
              Are you sure you want to delete <strong>{drive.title}</strong>?
              This action cannot be undone and will permanently remove this
              drive from the database and the student dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Drive
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Interview Modal */}
      {isEditModalOpen && (
        <ScheduleInterviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          college={college || {
            id: drive.collegeId,
            name: drive.collegeName,
            domain: "example.com",
            adminEmail: "admin@example.com",
            established: "2000",
            location: "Unknown",
            contactPhone: "",
            studentCount: 0
          }}
          students={students}
          existingDrive={drive}
          onDriveCreated={() => {
            refreshDrive();
          }}
        />
      )}
    </div>
  );
};

export default CollegeDriveDetails;
