import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, Clock, Sparkles, Users, Award, Briefcase, Bot, Video, Code, Layers, 
  CheckCircle2, Plus, Trash2, BookOpen, ShieldCheck, FileText, UploadCloud, Check, HelpCircle
} from "lucide-react";
import { College, CollegeStudent, CollegeCustomQuestion, collegeService } from "@/services/collegeService";
import { toast } from "sonner";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  college: College;
  students: CollegeStudent[];
  preSelectedStudentEmails?: string[];
  onDriveCreated: () => void;
}

const DEFAULT_PRESET_QUESTIONS: Record<string, CollegeCustomQuestion[]> = {
  "Software Development Engineer (SDE-1)": [
    {
      id: "q1",
      question: "Explain the difference between process and thread, and how context switching works in modern operating systems.",
      type: "technical",
      difficulty: "Medium",
      expectedAnswerOrKeyPoints: "Memory space isolation, virtual address space vs shared heap, PCB/TCB state save/restore overhead."
    },
    {
      id: "q2",
      question: "How would you design and implement an LRU (Least Recently Used) Cache with O(1) time complexity for get and put operations?",
      type: "coding",
      difficulty: "Medium",
      expectedAnswerOrKeyPoints: "Doubly linked list combined with hash map. Node movement to head on access, tail node eviction on capacity reach."
    },
    {
      id: "q3",
      question: "Explain Time and Space complexity of QuickSort vs MergeSort, and in which real-world scenarios you would pick one over the other.",
      type: "technical",
      difficulty: "Medium",
      expectedAnswerOrKeyPoints: "QuickSort O(N log N) avg / O(N^2) worst with O(log N) in-place space. MergeSort guaranteed O(N log N) with O(N) auxiliary space, stability."
    },
    {
      id: "q4",
      question: "Describe how database indexing (B+ Tree) optimizes SELECT queries and what trade-offs it introduces during INSERT/UPDATE operations.",
      type: "system_design",
      difficulty: "Medium",
      expectedAnswerOrKeyPoints: "B+ Tree balanced tree search O(log N), range queries on leaf nodes, write amplification and index rebalancing overhead on updates."
    }
  ],
  "Full Stack Developer": [
    {
      id: "q1",
      question: "Explain React's Virtual DOM diffing algorithm, how reconciliation works, and why keys are essential in list rendering.",
      type: "technical",
      difficulty: "Medium",
      expectedAnswerOrKeyPoints: "Tree diffing heuristics, O(N) comparison, key stability for identity tracking, avoiding full component remounts."
    },
    {
      id: "q2",
      question: "How do you secure a REST API against common vulnerabilities like CSRF, XSS, and SQL Injection?",
      type: "technical",
      difficulty: "Hard",
      expectedAnswerOrKeyPoints: "Parameterized queries/ORMs, HttpOnly SameSite cookies, anti-CSRF tokens, input sanitization, CSP headers."
    },
    {
      id: "q3",
      question: "Design a distributed rate limiter for an API gateway handling 100,000 requests per minute. Which algorithm would you use?",
      type: "system_design",
      difficulty: "Hard",
      expectedAnswerOrKeyPoints: "Token Bucket or Sliding Window Log with Redis atomic INCR and EXPIRE or Lua scripts, distributed clock synchronization."
    }
  ]
};

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  college,
  students,
  preSelectedStudentEmails = [],
  onDriveCreated
}: ScheduleInterviewModalProps) => {
  const [title, setTitle] = useState("Campus Placement Mock Drive 2025");
  const [targetRole, setTargetRole] = useState("Software Development Engineer (SDE-1)");
  const [interviewType, setInterviewType] = useState<"technical_ai" | "video_interview" | "dsa_coding" | "system_design" | "behavioral_hr">("technical_ai");
  const [audienceType, setAudienceType] = useState<"all" | "branch" | "selected_emails">(
    preSelectedStudentEmails.length > 0 ? "selected_emails" : "all"
  );
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    preSelectedStudentEmails.length > 0 ? preSelectedStudentEmails : students.map(s => s.email)
  );
  const [selectedBatch, setSelectedBatch] = useState("Batch 2025");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(75);
  const [passingCriteriaDescription, setPassingCriteriaDescription] = useState(
    "Candidate must achieve >= 75% overall score on the custom question set to qualify for the placement shortlist."
  );
  const [instructions, setInstructions] = useState(
    "Focus on Core Data Structures, Dynamic Programming, Time-Space Complexity Analysis, and Clear Technical Articulation."
  );
  const [targetCompaniesInput, setTargetCompaniesInput] = useState("Google, Amazon, Microsoft, Uber");
  
  // Custom Question Bank State
  const [customQuestions, setCustomQuestions] = useState<CollegeCustomQuestion[]>(
    DEFAULT_PRESET_QUESTIONS["Software Development Engineer (SDE-1)"] || []
  );
  const [customQuestionsOnly, setCustomQuestionsOnly] = useState(true);
  const [questionCountLimit, setQuestionCountLimit] = useState<number>(5);
  const [bulkQuestionsInput, setBulkQuestionsInput] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionKeyPoints, setNewQuestionKeyPoints] = useState("");
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSelectAllEmails = () => {
    if (selectedEmails.length === students.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(students.map(s => s.email));
    }
  };

  const computedTargetEmails = () => {
    if (audienceType === "all") {
      return students.map(s => s.email);
    }
    if (audienceType === "branch") {
      return students
        .filter(s => (selectedBranch === "All Branches" || s.branch === selectedBranch))
        .map(s => s.email);
    }
    return selectedEmails;
  };

  const handleAddSingleQuestion = () => {
    if (!newQuestionText.trim()) {
      toast.error("Please enter a question prompt.");
      return;
    }

    const q: CollegeCustomQuestion = {
      id: `cq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: newQuestionText.trim(),
      type: "technical",
      difficulty: newQuestionDifficulty,
      expectedAnswerOrKeyPoints: newQuestionKeyPoints.trim()
    };

    setCustomQuestions(prev => [...prev, q]);
    setNewQuestionText("");
    setNewQuestionKeyPoints("");
    setIsAddingQuestion(false);
    toast.success("Custom question added to assessment!");
  };

  const handleParseBulkQuestions = () => {
    if (!bulkQuestionsInput.trim()) {
      toast.error("Please paste question text or JSON.");
      return;
    }

    const hasOnlyPresets = customQuestions.every(q => !q.id.startsWith("cq-"));

    try {
      if (bulkQuestionsInput.trim().startsWith("[")) {
        const parsed = JSON.parse(bulkQuestionsInput);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: CollegeCustomQuestion[] = parsed.map((item, idx) => ({
            id: `cq-${Date.now()}-${idx}`,
            question: typeof item === "string" ? item : item.question || item.title || "Custom Question",
            type: item.type || "technical",
            difficulty: item.difficulty || "Medium",
            expectedAnswerOrKeyPoints: item.expectedAnswerOrKeyPoints || item.expected || ""
          }));
          setCustomQuestions(hasOnlyPresets ? formatted : prev => [...prev, ...formatted]);
          setBulkQuestionsInput("");
          setIsBulkMode(false);
          toast.success(`Imported ${formatted.length} custom questions successfully!`);
          return;
        }
      }
    } catch (e) {
      // Fall through to plain text parsing
    }

    const lines = bulkQuestionsInput
      .split("\n")
      .map(l => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter(l => l.length > 10);

    if (lines.length === 0) {
      toast.error("Could not parse valid questions. Please ensure each question is on a new line.");
      return;
    }

    const newQuestions: CollegeCustomQuestion[] = lines.map((q, idx) => ({
      id: `cq-${Date.now()}-${idx}`,
      question: q,
      type: "technical",
      difficulty: "Medium",
      expectedAnswerOrKeyPoints: ""
    }));

    setCustomQuestions(hasOnlyPresets ? newQuestions : prev => [...prev, ...newQuestions]);
    setBulkQuestionsInput("");
    setIsBulkMode(false);
    toast.success(`Set ${newQuestions.length} custom questions for assessment!`);
  };

  const handleClearAllQuestions = () => {
    setCustomQuestions([]);
    toast.info("Cleared question bank. You can now upload or paste your custom questions.");
  };

  const handleRemoveQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
    toast.info("Question removed");
  };

  const handleLoadRolePresets = () => {
    const preset = DEFAULT_PRESET_QUESTIONS[targetRole] || DEFAULT_PRESET_QUESTIONS["Software Development Engineer (SDE-1)"];
    setCustomQuestions(preset);
    toast.success(`Loaded ${preset.length} curated preset questions for ${targetRole}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a drive title.");
      return;
    }

    const finalEmails = computedTargetEmails();
    if (finalEmails.length === 0) {
      toast.error("Please select at least one candidate for this interview drive.");
      return;
    }

    setIsSubmitting(true);

    try {
      const companies = targetCompaniesInput
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const createdDrive = collegeService.scheduleCollegeDrive({
        collegeId: college.id,
        collegeName: college.name,
        title: title.trim(),
        targetRole: targetRole.trim(),
        interviewType,
        targetAudience: audienceType,
        targetBatch: selectedBatch,
        targetBranch: selectedBranch,
        targetEmails: finalEmails,
        scheduledDate,
        deadlineDate,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        passingCriteriaDescription: passingCriteriaDescription.trim(),
        customQuestions: customQuestions,
        customQuestionsOnly: customQuestionsOnly,
        questionCountLimit: Number(questionCountLimit) || 5,
        instructions: instructions.trim(),
        targetCompanies: companies,
        status: "active",
        candidatesCount: finalEmails.length,
        completedCount: 0,
        avgScore: 0
      });

      toast.success(`Mock Interview Drive scheduled! Dispatched to ${finalEmails.length} candidate(s).`, {
        description: `Direct Link generated with ${customQuestions.length} custom questions.`,
        action: {
          label: "Copy Link",
          onClick: () => {
            if (createdDrive.interviewUrl) {
              navigator.clipboard.writeText(createdDrive.interviewUrl);
              toast.info("Interview link copied to clipboard!");
            }
          }
        }
      });
      onDriveCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule drive.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetEmailsCount = computedTargetEmails().length;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0a0a0f] border-white/10 text-white shadow-2xl p-0">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-violet-950/50 via-purple-900/20 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs px-2.5 py-0.5">
              <Sparkles className="w-3 h-3 mr-1" />
              {college.shortName || "College"} Placement Assessment Builder
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Schedule Institutional Placement Drive
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs mt-1">
            Upload custom question banks, configure passing criteria, and evaluate candidate responses in real-time for <strong className="text-white">{college.name}</strong>.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Drive Title & Target Role */}
          <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Drive / Assessment Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Campus Placement SDE-1 Technical Assessment 2025"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Target Role
                </Label>
                <Select value={targetRole} onValueChange={(val) => {
                  setTargetRole(val);
                  if (DEFAULT_PRESET_QUESTIONS[val]) {
                    setCustomQuestions(DEFAULT_PRESET_QUESTIONS[val]);
                  }
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select target role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121a] border-white/10 text-white">
                    <SelectItem value="Software Development Engineer (SDE-1)">SDE-1 / Software Engineer</SelectItem>
                    <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                    <SelectItem value="Frontend Engineer">Frontend Engineer (React / Next.js)</SelectItem>
                    <SelectItem value="Backend Engineer">Backend Engineer (Node/Java/Go)</SelectItem>
                    <SelectItem value="AI / ML Engineer">AI & Machine Learning Engineer</SelectItem>
                    <SelectItem value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Interview Format
                </Label>
                <Select 
                  value={interviewType} 
                  onValueChange={(val: any) => setInterviewType(val)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121a] border-white/10 text-white">
                    <SelectItem value="technical_ai">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-violet-400" />
                        <span>Live AI Technical & Voice Interview</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dsa_coding">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <span>DSA & Algorithms Live Assessment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system_design">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>System Design & Architecture</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="video_interview">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-amber-400" />
                        <span>Timed Video Interview & Expression Analysis</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="behavioral_hr">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-pink-400" />
                        <span>Behavioral & Leadership Round (STAR)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Question Bank Builder (CRUCIAL REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    College Question Bank
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">
                      {customQuestions.length} Questions
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    AI will strictly ask questions only from this uploaded question set.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {customQuestions.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleClearAllQuestions}
                    className="text-gray-400 hover:text-red-400 text-xs h-7 px-2"
                    title="Clear all questions"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleLoadRolePresets}
                  className="border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white text-xs h-7 px-2.5"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Presets
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white text-xs h-7 px-2.5"
                >
                  <UploadCloud className="w-3 h-3 mr-1" /> {isBulkMode ? "Form View" : "Bulk Paste"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-7 px-2.5"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Question
                </Button>
              </div>
            </div>

            {/* Strict questions mode checkbox & Question Count Limit */}
            <div className="space-y-3 bg-violet-950/40 p-3 rounded-lg border border-violet-500/20">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="strictQuestions" 
                  checked={customQuestionsOnly} 
                  onCheckedChange={(checked) => setCustomQuestionsOnly(!!checked)}
                />
                <label htmlFor="strictQuestions" className="text-xs text-gray-300 font-medium cursor-pointer">
                  Strict Assessment Mode: <span className="text-violet-300 font-semibold">AI asks ONLY uploaded questions in randomized order</span> (No outside questions generated).
                </label>
              </div>

              <div className="pt-2 border-t border-violet-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Label className="text-xs text-white font-semibold flex items-center gap-1.5">
                    Interview Question Count Limit
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      Q1: Introduction Included
                    </Badge>
                  </Label>
                  <p className="text-[11px] text-gray-400">
                    Total questions candidate will be asked in their pro voice & video interview round.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={questionCountLimit}
                    onChange={(e) => setQuestionCountLimit(Number(e.target.value))}
                    className="bg-black/60 border border-violet-500/40 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-400 cursor-pointer font-medium"
                  >
                    <option value={3}>3 Questions (1 Intro + 2 Technical)</option>
                    <option value={5}>5 Questions (1 Intro + 4 Technical - Standard)</option>
                    <option value={7}>7 Questions (1 Intro + 6 Technical)</option>
                    <option value={10}>10 Questions (1 Intro + 9 Technical)</option>
                    <option value={15}>15 Questions (1 Intro + 14 Technical)</option>
                    <option value={customQuestions.length + 1}>All Uploaded Questions ({customQuestions.length + 1} total)</option>
                  </select>
                </div>
              </div>

              {/* Mandatory Introduction Notice */}
              <div className="bg-blue-950/40 border border-blue-500/30 rounded-md p-2 flex items-start gap-2 text-[11px] text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard Placement Round Protocol:</strong> Question 1 is always automatically set to <em>"Introduce yourself, your academic background, core technical skills, and key projects."</em> The remaining questions are asked sequentially from your uploaded question bank.
                </span>
              </div>
            </div>

            {/* Bulk Paste Box */}
            {isBulkMode && (
              <div className="space-y-2 bg-black/40 p-3 rounded-lg border border-violet-500/20">
                <Label className="text-xs text-violet-300 font-semibold">
                  Paste Custom Questions (One question per line or JSON array)
                </Label>
                <Textarea
                  value={bulkQuestionsInput}
                  onChange={e => setBulkQuestionsInput(e.target.value)}
                  placeholder={`1. Explain the difference between process and thread.\n2. Design an LRU Cache with O(1) get and put operations.\n3. How would you handle database connection pooling under heavy load?`}
                  className="bg-white/5 border-white/10 text-white text-xs min-h-[100px] font-mono"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsBulkMode(false)}
                    className="text-xs h-7 text-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleParseBulkQuestions}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-7"
                  >
                    <Check className="w-3 h-3 mr-1" /> Import Questions
                  </Button>
                </div>
              </div>
            )}

            {/* Add Individual Question Form */}
            {isAddingQuestion && !isBulkMode && (
              <div className="space-y-3 bg-black/40 p-3 rounded-lg border border-violet-500/20">
                <div className="space-y-1">
                  <Label className="text-xs text-violet-300 font-semibold">Question Prompt *</Label>
                  <Input
                    value={newQuestionText}
                    onChange={e => setNewQuestionText(e.target.value)}
                    placeholder="e.g. Explain how B-Trees optimize database lookups and range scans."
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-400">Expected Key Concepts / Rubric (Optional)</Label>
                    <Input
                      value={newQuestionKeyPoints}
                      onChange={e => setNewQuestionKeyPoints(e.target.value)}
                      placeholder="e.g. Balanced search tree, leaf node pointers, O(log N)"
                      className="bg-white/5 border-white/10 text-white text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-400">Difficulty</Label>
                    <Select value={newQuestionDifficulty} onValueChange={(v: any) => setNewQuestionDifficulty(v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#12121a] border-white/10 text-white text-xs">
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAddingQuestion(false)}
                    className="text-xs h-7 text-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSingleQuestion}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-7"
                  >
                    Add to Question Set
                  </Button>
                </div>
              </div>
            )}

            {/* List of Attached Questions */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {customQuestions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 border border-dashed border-white/10 rounded-lg text-xs">
                  No questions uploaded yet. Click <strong>"Add Question"</strong> or <strong>"Load Preset"</strong> to attach questions.
                </div>
              ) : (
                customQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start justify-between gap-3 text-xs group hover:border-violet-500/40 transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/10 text-gray-300 text-[9px] px-1.5 py-0 font-mono">
                          Q{idx + 1}
                        </Badge>
                        <span className="text-[10px] text-violet-400 font-semibold uppercase">
                          {q.difficulty || "Medium"}
                        </span>
                      </div>
                      <p className="text-gray-200 font-medium leading-relaxed">
                        {q.question}
                      </p>
                      {q.expectedAnswerOrKeyPoints && (
                        <p className="text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          <strong className="text-violet-300">Key Points:</strong> {q.expectedAnswerOrKeyPoints}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors shrink-0"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Passing Criteria & Benchmark (CRUCIAL REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Passing Criteria & Selection Threshold
                </h4>
                <p className="text-[11px] text-gray-400">
                  Students achieving this benchmark will be automatically marked as <strong>SELECTED</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs text-emerald-300 font-semibold">Minimum Passing Score (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={passingScore}
                    onChange={e => setPassingScore(Number(e.target.value))}
                    className="bg-white/5 border-emerald-500/30 text-white font-bold h-9 text-xs"
                    required
                  />
                  <span className="text-xs text-emerald-400 font-bold">%</span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-gray-300">Passing Criteria Description</Label>
                <Input
                  value={passingCriteriaDescription}
                  onChange={e => setPassingCriteriaDescription(e.target.value)}
                  placeholder="e.g. Candidate must score >= 75% across custom questions to qualify."
                  className="bg-white/5 border-white/10 text-white text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Target Candidates & Scheduling Dates */}
          <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                <span>Target Candidates</span>
                <span className="text-violet-400 font-normal lowercase">({targetEmailsCount} selected)</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All Students", desc: `All ${students.length} registered` },
                  { id: "branch", label: "By Batch & Branch", desc: "Filtered group" },
                  { id: "selected_emails", label: "Specific Students", desc: "Custom checklist" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAudienceType(opt.id as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      audienceType === opt.id
                        ? "bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-950/50"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{opt.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Student Checklist */}
              {audienceType === "selected_emails" && (
                <div className="mt-3 p-3 rounded-lg border border-white/10 bg-black/40 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <span className="text-gray-400">Select candidate email IDs:</span>
                    <button
                      type="button"
                      onClick={handleSelectAllEmails}
                      className="text-violet-400 hover:text-violet-300 font-medium"
                    >
                      {selectedEmails.length === students.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {students.map(s => {
                      const isChecked = selectedEmails.includes(s.email);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleEmail(s.email)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs transition-colors ${
                            isChecked ? "bg-violet-600/20 text-white" : "hover:bg-white/5 text-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Checkbox checked={isChecked} onCheckedChange={() => toggleEmail(s.email)} />
                            <span className="font-medium text-white truncate">{s.fullName}</span>
                            <span className="text-gray-400 text-[11px] truncate font-mono">({s.email})</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400 shrink-0">
                            Score: {s.averageScore}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dates & Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Deadline</Label>
                <Input
                  type="date"
                  value={deadlineDate}
                  onChange={e => setDeadlineDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Duration</Label>
                <Select value={String(durationMinutes)} onValueChange={v => setDurationMinutes(Number(v))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121a] border-white/10 text-white text-xs">
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || targetEmailsCount === 0 || customQuestions.length === 0}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-600/30 px-6"
            >
              {isSubmitting ? (
                "Scheduling Assessment..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Dispatch Assessment ({customQuestions.length} Questions) to {targetEmailsCount} Student{targetEmailsCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
