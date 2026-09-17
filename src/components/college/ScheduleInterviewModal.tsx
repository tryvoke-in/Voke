import { useState, useEffect, useRef } from "react";
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
  CheckCircle2, Plus, Trash2, BookOpen, ShieldCheck, FileText, UploadCloud, Check, HelpCircle, 
  ChevronDown, ChevronUp, FileSpreadsheet, Download, Code2, Filter, Mail, RefreshCw
} from "lucide-react";
import { College, CollegeStudent, CollegeCustomQuestion, CollegeScheduledDrive, collegeService } from "@/services/collegeService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  college: College;
  students: CollegeStudent[];
  preSelectedStudentEmails?: string[];
  onDriveCreated: () => void;
  existingDrive?: CollegeScheduledDrive;
}

const ALL_PRESET_QUESTIONS: CollegeCustomQuestion[] = [
  {
    id: "q1",
    question: "Explain the difference between process and thread, and how context switching works in modern operating systems.",
    type: "theoretical",
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
    type: "theoretical",
    difficulty: "Medium",
    expectedAnswerOrKeyPoints: "QuickSort O(N log N) avg / O(N^2) worst with O(log N) in-place space. MergeSort guaranteed O(N log N) with O(N) auxiliary space, stability."
  },
  {
    id: "q4",
    question: "Describe how database indexing (B+ Tree) optimizes SELECT queries and what trade-offs it introduces during INSERT/UPDATE operations.",
    type: "theoretical",
    difficulty: "Medium",
    expectedAnswerOrKeyPoints: "B+ Tree balanced tree search O(log N), range queries on leaf nodes, write amplification and index rebalancing overhead on updates."
  },
  {
    id: "q5",
    question: "Write an algorithm to detect a cycle in a linked list and return the starting node of the cycle.",
    type: "coding",
    difficulty: "Medium",
    expectedAnswerOrKeyPoints: "Floyd's Tortoise and Hare algorithm with slow and fast pointers. Reset slow to head upon collision to find entry node."
  },
  {
    id: "q6",
    question: "Explain React's Virtual DOM diffing algorithm, how reconciliation works, and why keys are essential in list rendering.",
    type: "theoretical",
    difficulty: "Medium",
    expectedAnswerOrKeyPoints: "Tree diffing heuristics, O(N) comparison, key stability for identity tracking, avoiding full component remounts."
  },
  {
    id: "q7",
    question: "Implement an algorithm to find the maximum sum contiguous subarray (Kadane's Algorithm) and return the maximum sum.",
    type: "coding",
    difficulty: "Medium",
    expectedAnswerOrKeyPoints: "Kadane's algorithm maintaining maxSoFar and currentMax in O(N) time and O(1) space."
  },
  {
    id: "q8",
    question: "How do you secure a REST API against common vulnerabilities like CSRF, XSS, and SQL Injection?",
    type: "theoretical",
    difficulty: "Hard",
    expectedAnswerOrKeyPoints: "Parameterized queries/ORMs, HttpOnly SameSite cookies, anti-CSRF tokens, input sanitization, CSP headers."
  },
  {
    id: "q9",
    question: "Design a distributed rate limiter for an API gateway handling 100,000 requests per minute. Which algorithm would you use?",
    type: "theoretical",
    difficulty: "Hard",
    expectedAnswerOrKeyPoints: "Token Bucket or Sliding Window Log with Redis atomic INCR and EXPIRE or Lua scripts, distributed clock synchronization."
  },
  {
    id: "q10",
    question: "Implement a function to check if a binary tree is a valid Binary Search Tree (BST).",
    type: "coding",
    difficulty: "Medium",
    expectedAnswerOrKeyPoints: "Recursive boundary checking (minVal, maxVal) or inorder traversal checking for strictly increasing order."
  }
];

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  college,
  students,
  preSelectedStudentEmails = [],
  onDriveCreated,
  existingDrive
}: ScheduleInterviewModalProps) => {
  const [title, setTitle] = useState("Campus Placement Mock Drive 2025");
  const targetRole = "Software Development Engineer (SDE-1)";
  const interviewType: "system_design" | "technical_ai" | "video_interview" | "dsa_coding" | "behavioral_hr" = "technical_ai";
  const [audienceType, setAudienceType] = useState<"all" | "branch" | "selected_emails" | "paste_emails">(
    preSelectedStudentEmails.length > 0 ? "selected_emails" : "all"
  );
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    preSelectedStudentEmails.length > 0 ? preSelectedStudentEmails : students.map(s => s.email)
  );
  const [customPastedEmails, setCustomPastedEmails] = useState("");
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
    "Focus on DSA, DP, Code Quality, and Clear Articulation."
  );
  const [targetCompaniesInput] = useState("Google, Amazon, Microsoft, Uber");
  
  // Question Selection & Management State
  const [availableQuestions, setAvailableQuestions] = useState<CollegeCustomQuestion[]>(ALL_PRESET_QUESTIONS);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"]);
  const [questionTypeFilter, setQuestionTypeFilter] = useState<"all" | "theoretical" | "coding">("all");
  
  // Randomized Per-Candidate Sampling Quota State
  const [theoreticalQuota, setTheoreticalQuota] = useState(8);
  const [codingQuota, setCodingQuota] = useState(1);

  // New Question Form State
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"theoretical" | "coding">("theoretical");
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newQuestionExpected, setNewQuestionExpected] = useState("");
  
  const [isAddingCustomQuestion, setIsAddingCustomQuestion] = useState(false);
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(true);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkQuestionsInput, setBulkQuestionsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && existingDrive) {
      setTitle(existingDrive.title);
      if (existingDrive.scheduledDate) setScheduledDate(existingDrive.scheduledDate.split("T")[0]);
      if (existingDrive.deadlineDate) setDeadlineDate(existingDrive.deadlineDate.split("T")[0]);
      if (existingDrive.durationMinutes) setDurationMinutes(existingDrive.durationMinutes);
      if (existingDrive.passingScore) setPassingScore(existingDrive.passingScore);
      if (existingDrive.instructions) setInstructions(existingDrive.instructions);
      if (typeof existingDrive.theoreticalQuestionCount === "number") setTheoreticalQuota(existingDrive.theoreticalQuestionCount);
      if (typeof existingDrive.codingQuestionCount === "number") setCodingQuota(existingDrive.codingQuestionCount);
      
      if (existingDrive.customQuestions && existingDrive.customQuestions.length > 0) {
        setAvailableQuestions(prev => {
          const newQs = existingDrive.customQuestions.filter(dq => !prev.some(pq => pq.id === dq.id));
          return [...newQs, ...prev];
        });
        setSelectedQuestionIds(existingDrive.customQuestions.map(q => q.id));
      }
      
      if (existingDrive.targetAudience) {
        setAudienceType(existingDrive.targetAudience as any);
      }
      if (existingDrive.targetBranch) {
        setSelectedBranch(existingDrive.targetBranch);
      }
      if (existingDrive.targetEmails && existingDrive.targetEmails.length > 0) {
        setSelectedEmails(existingDrive.targetEmails);
      }
    }
  }, [isOpen, existingDrive]);

  // Excel Template Download
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        "Question": "Explain the difference between process and thread in operating systems.",
        "Type": "Theoretical",
        "Difficulty": "Medium",
        "Expected Answer / Key Points": "Memory isolation, virtual address space vs shared heap, PCB/TCB context switch overhead."
      },
      {
        "Question": "Write a function to reverse a singly linked list in-place.",
        "Type": "Coding",
        "Difficulty": "Easy",
        "Expected Answer / Key Points": "Iterative approach with prev, curr, next pointers in O(N) time and O(1) space."
      },
      {
        "Question": "What are ACID properties in relational database management systems?",
        "Type": "Theoretical",
        "Difficulty": "Easy",
        "Expected Answer / Key Points": "Atomicity, Consistency, Isolation, Durability with rollback mechanisms."
      },
      {
        "Question": "Design and implement an LRU Cache with O(1) get and put operations.",
        "Type": "Coding",
        "Difficulty": "Hard",
        "Expected Answer / Key Points": "Doubly linked list with head/tail dummy nodes combined with a Hash Map."
      },
      {
        "Question": "Explain how HTTPS handshake and SSL/TLS encryption work.",
        "Type": "Theoretical",
        "Difficulty": "Medium",
        "Expected Answer / Key Points": "Asymmetric encryption for session key exchange, symmetric encryption for data transfer, certificate authorities."
      },
      {
        "Question": "Given an array of integers, find two numbers such that they add up to a specific target.",
        "Type": "Coding",
        "Difficulty": "Easy",
        "Expected Answer / Key Points": "Hash map storing complement and indices in single pass O(N) time."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws["!cols"] = [
      { wch: 65 }, // Question
      { wch: 16 }, // Type
      { wch: 16 }, // Difficulty
      { wch: 65 }  // Expected Answer
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Placement Questions");
    XLSX.writeFile(wb, "voke_placement_questions_template.xlsx");
    toast.success("Excel template downloaded with sample Theoretical & Coding questions!");
  };

  // Excel / CSV File Upload Handler
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          toast.error("The uploaded Excel sheet is empty or unreadable.");
          return;
        }

        const parsedQuestions: CollegeCustomQuestion[] = [];

        data.forEach((row, idx) => {
          // Detect Question text
          const qText = row["Question"] || row["question"] || row["Title"] || row["title"] || row["Prompt"] || row["prompt"] || row["Problem"] || row["problem"] || Object.values(row)[0];
          if (!qText || String(qText).trim().length < 3) return;

          // Detect Type: Coding vs Theoretical
          const rawType = String(row["Type"] || row["type"] || row["Category"] || row["category"] || row["Question Type"] || row["Kind"] || "").toLowerCase();
          let qType: "coding" | "theoretical" = "theoretical";
          if (rawType.includes("code") || rawType.includes("coding") || rawType.includes("dsa") || rawType.includes("program") || rawType.includes("algorithm") || rawType.includes("problem")) {
            qType = "coding";
          } else {
            qType = "theoretical";
          }

          // Detect Difficulty
          const rawDiff = String(row["Difficulty"] || row["difficulty"] || row["Level"] || row["level"] || "").toLowerCase();
          let diff: "Easy" | "Medium" | "Hard" = "Medium";
          if (rawDiff.includes("hard")) diff = "Hard";
          else if (rawDiff.includes("easy")) diff = "Easy";

          // Detect Expected Answer / Key Points
          const expected = String(row["Expected Answer / Key Points"] || row["Expected Answer"] || row["Key Points"] || row["KeyPoints"] || row["Answer"] || row["Rubric"] || row["expected"] || "").trim();

          parsedQuestions.push({
            id: `cq-excel-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            question: String(qText).trim(),
            type: qType,
            difficulty: diff,
            expectedAnswerOrKeyPoints: expected
          });
        });

        if (parsedQuestions.length === 0) {
          toast.error("Could not find valid questions. Ensure the sheet has a 'Question' column.");
          return;
        }

        const theoreticalCount = parsedQuestions.filter(q => q.type === "theoretical").length;
        const codingCount = parsedQuestions.filter(q => q.type === "coding").length;

        setAvailableQuestions(prev => [...parsedQuestions, ...prev]);
        setSelectedQuestionIds(prev => [...parsedQuestions.map(q => q.id), ...prev]);
        setIsQuestionsExpanded(true);

        toast.success(`Imported & Selected ${parsedQuestions.length} Questions from Excel!`, {
          description: `${theoreticalCount} Theoretical, ${codingCount} Coding questions loaded.`
        });
      } catch (err: any) {
        console.error("Excel parse error:", err);
        toast.error("Failed to parse Excel file: " + (err.message || "Invalid format"));
      } finally {
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAllQuestions = () => {
    const currentFiltered = filteredQuestions.map(q => q.id);
    const allFilteredSelected = currentFiltered.every(id => selectedQuestionIds.includes(id));

    if (allFilteredSelected) {
      setSelectedQuestionIds(prev => prev.filter(id => !currentFiltered.includes(id)));
    } else {
      setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...currentFiltered])));
    }
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim()) {
      toast.error("Please enter a question prompt.");
      return;
    }

    const newQ: CollegeCustomQuestion = {
      id: `cq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: newQuestionText.trim(),
      type: newQuestionType,
      difficulty: newQuestionDifficulty,
      expectedAnswerOrKeyPoints: newQuestionExpected.trim()
    };

    setAvailableQuestions(prev => [newQ, ...prev]);
    setSelectedQuestionIds(prev => [newQ.id, ...prev]);
    setNewQuestionText("");
    setNewQuestionExpected("");
    setIsAddingCustomQuestion(false);
    toast.success(`Custom ${newQuestionType === "coding" ? "Coding" : "Theoretical"} Question Added & Selected!`);
  };

  const handleParseBulkQuestions = () => {
    if (!bulkQuestionsInput.trim()) {
      toast.error("Please paste questions (one per line).");
      return;
    }

    try {
      if (bulkQuestionsInput.trim().startsWith("[")) {
        const parsed = JSON.parse(bulkQuestionsInput);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: CollegeCustomQuestion[] = parsed.map((item, idx) => ({
            id: `cq-${Date.now()}-${idx}`,
            question: typeof item === "string" ? item : item.question || item.title || "Custom Question",
            type: (item.type === "coding" || item.category === "coding") ? "coding" : "theoretical",
            difficulty: item.difficulty || "Medium",
            expectedAnswerOrKeyPoints: item.expectedAnswerOrKeyPoints || item.expected || ""
          }));
          setAvailableQuestions(prev => [...formatted, ...prev]);
          setSelectedQuestionIds(prev => [...formatted.map(q => q.id), ...prev]);
          setBulkQuestionsInput("");
          setIsBulkMode(false);
          toast.success(`Imported & selected ${formatted.length} questions successfully!`);
          return;
        }
      }
    } catch {
      // Fall through to text lines
    }

    const lines = bulkQuestionsInput
      .split("\n")
      .map(l => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter(l => l.length > 5);

    if (lines.length === 0) {
      toast.error("Could not find valid questions. Please ensure each question is on a new line.");
      return;
    }

    const newQuestions: CollegeCustomQuestion[] = lines.map((q, idx) => {
      const isCoding = q.toLowerCase().includes("code") || q.toLowerCase().includes("algorithm") || q.toLowerCase().includes("implement") || q.toLowerCase().includes("function");
      return {
        id: `cq-${Date.now()}-${idx}`,
        question: q,
        type: isCoding ? "coding" : "theoretical",
        difficulty: "Medium",
        expectedAnswerOrKeyPoints: ""
      };
    });

    setAvailableQuestions(prev => [...newQuestions, ...prev]);
    setSelectedQuestionIds(prev => [...newQuestions.map(q => q.id), ...prev]);
    setBulkQuestionsInput("");
    setIsBulkMode(false);
    toast.success(`Imported & selected ${newQuestions.length} questions!`);
  };

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

  const getPastedEmailList = (): string[] => {
    if (!customPastedEmails.trim()) return [];
    const tokens = customPastedEmails
      .split(/[\n,; \t]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@") && e.includes("."));
    return Array.from(new Set(tokens));
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
    if (audienceType === "paste_emails") {
      return getPastedEmailList();
    }
    return selectedEmails;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a drive title.");
      return;
    }

    const finalEmails = computedTargetEmails();
    if (finalEmails.length === 0) {
      toast.error("Please select or paste at least one candidate email for this interview drive.");
      return;
    }

    const finalQuestions = availableQuestions.filter(q => selectedQuestionIds.includes(q.id));
    if (finalQuestions.length === 0) {
      toast.error("Please select at least one question for the assessment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const companies = targetCompaniesInput
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const driveData = {
        collegeId: college.id,
        collegeName: college.name,
        title: title.trim(),
        targetRole: targetRole.trim(),
        interviewType,
        targetAudience: audienceType === "paste_emails" ? "selected_emails" as const : audienceType,
        targetBatch: selectedBatch,
        targetBranch: selectedBranch,
        targetEmails: finalEmails,
        scheduledDate,
        deadlineDate,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        passingCriteriaDescription: passingCriteriaDescription.trim(),
        customQuestions: finalQuestions,
        customQuestionsOnly: true,
        theoreticalQuestionCount: Number(theoreticalQuota),
        codingQuestionCount: Number(codingQuota),
        questionCountLimit: Number(theoreticalQuota) + Number(codingQuota),
        instructions: instructions.trim(),
        targetCompanies: companies,
        status: "active" as const
      };

      let resultDrive;
      if (existingDrive) {
        resultDrive = collegeService.updateCollegeDrive(existingDrive.id, driveData);
        toast.success(`Drive updated successfully!`);
      } else {
        resultDrive = collegeService.scheduleCollegeDrive({
          ...driveData,
          candidatesCount: finalEmails.length,
          completedCount: 0,
          avgScore: 0
        });
        toast.success(`Mock Interview Drive scheduled! Dispatched to ${finalEmails.length} candidate(s).`, {
          description: `Direct Link generated with ${finalQuestions.length} bank questions. Each student gets ${theoreticalQuota} Theoretical + ${codingQuota} Coding randomized questions.`,
          action: {
            label: "Copy Link",
            onClick: () => {
              if (resultDrive?.interviewUrl) {
                navigator.clipboard.writeText(resultDrive.interviewUrl);
                toast.info("Interview link copied to clipboard!");
              }
            }
          }
        });
      }

      onDriveCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule drive.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = availableQuestions.filter(q => {
    if (questionTypeFilter === "all") return true;
    if (questionTypeFilter === "coding") return q.type === "coding";
    if (questionTypeFilter === "theoretical") return q.type === "theoretical" || !q.type || q.type === "technical" || q.type === "system_design" || q.type === "behavioral";
    return true;
  });

  const totalTheoretical = availableQuestions.filter(q => q.type === "theoretical" || !q.type || q.type === "technical" || q.type === "system_design" || q.type === "behavioral").length;
  const totalCoding = availableQuestions.filter(q => q.type === "coding").length;
  const targetEmailsCount = computedTargetEmails().length;
  const selectedQuestionsCount = selectedQuestionIds.length;
  const selectedTheoreticalCount = availableQuestions.filter(q => selectedQuestionIds.includes(q.id) && (q.type === "theoretical" || !q.type || q.type === "technical" || q.type === "system_design" || q.type === "behavioral")).length;
  const selectedCodingCount = availableQuestions.filter(q => selectedQuestionIds.includes(q.id) && q.type === "coding").length;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto bg-card border-border text-foreground shadow-2xl p-0 rounded-2xl">
        <div className="p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 text-xs px-2.5 py-0.5 font-semibold">
              <Sparkles className="w-3 h-3 mr-1" />
              {college.shortName || "College"} Placement Assessment Builder
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {existingDrive ? "Update Institutional Placement Drive" : "Schedule Institutional Placement Drive"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            Configure passing criteria, upload questions from Excel (.xlsx / .csv), and dispatch to candidates for <strong className="text-foreground">{college.name}</strong>.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Drive Title */}
          <div className="space-y-2 bg-muted/40 dark:bg-muted/20 p-4 rounded-xl border border-border/70">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Drive / Assessment Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Campus Placement Mock Drive 2025"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 text-sm h-10"
              required
            />
          </div>

          {/* Section 2: Question Selection & Excel Upload Box */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-300">
                  <BookOpen className="w-4 h-4" />
                </div>
                <button 
                  type="button"
                  onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Question Bank & Excel Upload
                  </h4>
                  <Badge className="bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 text-[10px] font-mono font-medium">
                    {selectedQuestionsCount} Selected ({selectedTheoreticalCount} Theory, {selectedCodingCount} Coding)
                  </Badge>
                  {isQuestionsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                  )}
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Hidden Excel File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                {/* Upload Excel Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-7 px-2.5 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 font-medium shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  Upload Excel
                </Button>

                {/* Download Template Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  title="Download sample Excel template with Theoretical and Coding columns"
                  className="text-xs h-7 px-2 border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  Template
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsBulkMode(!isBulkMode);
                    setIsAddingCustomQuestion(false);
                  }}
                  className={`text-xs h-7 px-2.5 border-border bg-card text-foreground hover:bg-muted ${isBulkMode ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300" : ""}`}
                >
                  <UploadCloud className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                  Bulk Text
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingCustomQuestion(!isAddingCustomQuestion);
                    setIsBulkMode(false);
                  }}
                  className={`text-xs h-7 px-2.5 border-border bg-card text-foreground hover:bg-muted ${isAddingCustomQuestion ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300" : ""}`}
                >
                  <Plus className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                  Add Question
                </Button>
              </div>
            </div>

            {isQuestionsExpanded && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Filter Tabs & Select All Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30 p-2 rounded-lg border border-border/50 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[11px] font-medium mr-1 flex items-center">
                      <Filter className="w-3 h-3 mr-1" /> Type:
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuestionTypeFilter("all")}
                      className={`px-2.5 py-1 rounded-md transition-colors text-xs font-medium ${
                        questionTypeFilter === "all"
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      All ({availableQuestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTypeFilter("theoretical")}
                      className={`px-2.5 py-1 rounded-md transition-colors text-xs font-medium flex items-center gap-1 ${
                        questionTypeFilter === "theoretical"
                          ? "bg-emerald-600 text-white font-semibold"
                          : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      Theoretical ({totalTheoretical})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTypeFilter("coding")}
                      className={`px-2.5 py-1 rounded-md transition-colors text-xs font-medium flex items-center gap-1 ${
                        questionTypeFilter === "coding"
                          ? "bg-indigo-600 text-white font-semibold"
                          : "text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      Coding ({totalCoding})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllQuestions}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium px-1 text-right"
                  >
                    {filteredQuestions.every(q => selectedQuestionIds.includes(q.id)) ? "Deselect Filtered" : "Select All Filtered"}
                  </button>
                </div>

                {/* Bulk Paste Form */}
                {isBulkMode && (
                  <div className="p-3.5 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">
                        Paste Questions (One per line or JSON array)
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Automatic Coding vs Theory detection</span>
                    </div>
                    <Textarea
                      value={bulkQuestionsInput}
                      onChange={e => setBulkQuestionsInput(e.target.value)}
                      placeholder={`1. Explain the difference between process and thread in OS.\n2. Write a function to check if a binary tree is symmetric.\n3. How would you design a distributed database with master-replica architecture?`}
                      className="bg-card border-border text-foreground text-xs min-h-[110px] font-mono focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-2 pt-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsBulkMode(false)}
                        className="text-xs h-7 text-muted-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleParseBulkQuestions}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-7 px-3 shadow-xs"
                      >
                        <Check className="w-3 h-3 mr-1" /> Import Questions
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Add Single Question Form with Coding / Theoretical Selector */}
                {isAddingCustomQuestion && !isBulkMode && (
                  <div className="p-4 bg-muted/40 dark:bg-muted/20 rounded-xl border border-blue-500/40 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-blue-500" />
                        Add Custom Question
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Select question type & rubric</span>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Type question prompt (e.g. Write an algorithm to solve 2-Sum / Explain CAP theorem)..."
                        value={newQuestionText}
                        onChange={e => setNewQuestionText(e.target.value)}
                        className="bg-card border-border text-foreground text-xs h-9 focus:border-blue-500"
                      />
                      <Input
                        placeholder="Optional: Expected Key Points / Answer Rubric for AI Evaluation..."
                        value={newQuestionExpected}
                        onChange={e => setNewQuestionExpected(e.target.value)}
                        className="bg-card border-border text-foreground text-xs h-8 focus:border-blue-500 placeholder:text-muted-foreground/60"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {/* Type Selector */}
                        <div className="flex items-center gap-1 bg-card p-0.5 rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => setNewQuestionType("theoretical")}
                            className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition-all ${
                              newQuestionType === "theoretical"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            Theoretical
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewQuestionType("coding")}
                            className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition-all ${
                              newQuestionType === "coding"
                                ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/40"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Code2 className="w-3 h-3" />
                            Coding
                          </button>
                        </div>

                        {/* Difficulty Selector */}
                        <Select value={newQuestionDifficulty} onValueChange={(v: any) => setNewQuestionDifficulty(v)}>
                          <SelectTrigger className="bg-card border-border text-foreground h-8 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground text-xs">
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsAddingCustomQuestion(false)}
                          className="text-xs h-8 text-muted-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCustomQuestion}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-4 shrink-0 shadow-xs font-semibold"
                        >
                          Save & Select Question
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions Checklist */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredQuestions.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                      No questions found matching the selected filter. Click "Upload Excel" or "+ Add Question" to create questions.
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      const isCoding = q.type === "coding";

                      return (
                        <div
                          key={q.id || idx}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-card border-blue-500/50 shadow-xs ring-1 ring-blue-500/20"
                              : "bg-muted/20 border-border/70 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleQuestionSelection(q.id)}
                            className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Type Badge */}
                              <Badge className={`text-[9px] px-1.5 py-0 font-semibold uppercase flex items-center gap-1 ${
                                isCoding
                                  ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              }`}>
                                {isCoding ? <Code2 className="w-2.5 h-2.5 mr-0.5" /> : <BookOpen className="w-2.5 h-2.5 mr-0.5" />}
                                {isCoding ? "Coding" : "Theoretical"}
                              </Badge>

                              {/* Difficulty Badge */}
                              <Badge className={`text-[9px] px-1.5 py-0 font-semibold uppercase ${
                                q.difficulty === "Hard"
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
                                  : q.difficulty === "Easy"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                              }`}>
                                {q.difficulty || "Medium"}
                              </Badge>

                              <span className={`font-medium leading-relaxed ${isSelected ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                                {q.question}
                              </span>
                            </div>

                            {q.expectedAnswerOrKeyPoints && (
                              <p className="text-[10px] text-muted-foreground/80 truncate pl-0.5">
                                <span className="font-semibold text-muted-foreground">Rubric:</span> {q.expectedAnswerOrKeyPoints}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2.5: Randomized Question Sampling Quota (Anti-Cheating) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent border border-border space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Randomized Question Quota per Student (Anti-Cheating)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Each student gets a randomized subset drawn from your master {selectedQuestionsCount}-question bank.
                  </p>
                </div>
              </div>

              <Badge className="bg-blue-600 text-white text-xs px-2.5 py-1 font-mono font-semibold self-start sm:self-auto">
                {Number(theoreticalQuota) + Number(codingQuota)} Questions / Candidate
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5 bg-card p-3.5 rounded-xl border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Theoretical Questions per Student
                  </Label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    ({selectedTheoreticalCount} available in pool)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={selectedTheoreticalCount || 200}
                    value={theoreticalQuota}
                    onChange={e => setTheoreticalQuota(Math.max(0, Number(e.target.value)))}
                    className="bg-background border-border text-foreground font-bold h-9 text-xs"
                    required
                  />
                  <span className="text-xs text-muted-foreground shrink-0 font-medium">questions</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  AI randomly draws {theoreticalQuota} theoretical questions for each candidate to test conceptual depth.
                </p>
              </div>

              <div className="space-y-1.5 bg-card p-3.5 rounded-xl border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Coding Questions per Student
                  </Label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                    ({selectedCodingCount} available in pool)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={selectedCodingCount || 100}
                    value={codingQuota}
                    onChange={e => setCodingQuota(Math.max(0, Number(e.target.value)))}
                    className="bg-background border-border text-foreground font-bold h-9 text-xs"
                    required
                  />
                  <span className="text-xs text-muted-foreground shrink-0 font-medium">questions</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  AI randomly draws {codingQuota} live coding challenge{codingQuota !== 1 ? "s" : ""} opening the code editor.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Passing Criteria & Benchmark */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Passing Criteria & Selection Threshold
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Students achieving this benchmark will be automatically marked as <strong>SELECTED</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs text-foreground font-semibold">Minimum Passing Score (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={passingScore}
                    onChange={e => setPassingScore(Number(e.target.value))}
                    className="bg-card border-border text-foreground font-bold h-9 text-xs"
                    required
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">%</span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-foreground/80 font-medium">Passing Criteria Description</Label>
                <Input
                  value={passingCriteriaDescription}
                  onChange={e => setPassingCriteriaDescription(e.target.value)}
                  placeholder="e.g. Candidate must score >= 75% across custom questions to qualify."
                  className="bg-card border-border text-foreground text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Target Candidates & Scheduling Dates */}
          <div className="space-y-4 bg-muted/40 dark:bg-muted/20 p-4 rounded-xl border border-border/60">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Target Candidates</span>
                <span className="text-blue-600 dark:text-blue-400 font-normal lowercase">({targetEmailsCount} candidate{targetEmailsCount !== 1 ? "s" : ""} targeted)</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "all", label: "All Students", desc: `All ${students.length} registered` },
                  { id: "branch", label: "By Branch", desc: "Filtered group" },
                  { id: "selected_emails", label: "From Roster", desc: "Select students" },
                  { id: "paste_emails", label: "Google Form", desc: "Paste emails/CSV" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAudienceType(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      audienceType === opt.id
                        ? "bg-blue-500/15 border-blue-500 text-foreground shadow-xs"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="font-semibold text-xs text-foreground">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Paste Google Form Emails Option */}
              {audienceType === "paste_emails" && (
                <div className="mt-3 p-3.5 rounded-xl border border-border bg-card space-y-2 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      Paste Candidate Emails (Google Form responses / Excel column)
                    </Label>
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-mono">
                      {getPastedEmailList().length} valid emails detected
                    </Badge>
                  </div>
                  <Textarea
                    value={customPastedEmails}
                    onChange={e => setCustomPastedEmails(e.target.value)}
                    placeholder="Paste emails separated by commas, spaces, or one per line:&#10;john.doe@college.edu&#10;sarah.smith@college.edu&#10;alex.kumar@gmail.com"
                    className="bg-background border-border text-foreground text-xs min-h-[90px] font-mono focus:border-blue-500"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Students don't need an existing Voke account yet. When they sign up or log in using this email, their scheduled interview will automatically appear on their dashboard.
                  </p>
                </div>
              )}

              {/* Student Checklist from College Roster */}
              {audienceType === "selected_emails" && (
                <div className="mt-3 p-3 rounded-xl border border-border bg-card space-y-2 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                    <span className="text-muted-foreground font-medium">Select candidate email IDs from roster:</span>
                    <button
                      type="button"
                      onClick={handleSelectAllEmails}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs"
                    >
                      {selectedEmails.length === students.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {students.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">No students registered yet in roster. Use "Google Form" option to paste emails.</p>
                    ) : (
                      students.map(s => {
                        const isChecked = selectedEmails.includes(s.email);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleEmail(s.email)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-blue-500/15 text-foreground" : "hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Checkbox checked={isChecked} onCheckedChange={() => toggleEmail(s.email)} />
                              <span className="font-medium text-foreground truncate">{s.fullName}</span>
                              <span className="text-muted-foreground text-[11px] truncate font-mono">({s.email})</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground shrink-0 bg-background/50">
                              Score: {s.averageScore}%
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dates & Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80 font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="bg-card border-border text-foreground h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80 font-medium">Deadline</Label>
                <Input
                  type="date"
                  value={deadlineDate}
                  onChange={e => setDeadlineDate(e.target.value)}
                  className="bg-card border-border text-foreground h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80 font-medium">Duration</Label>
                <Select value={String(durationMinutes)} onValueChange={v => setDurationMinutes(Number(v))}>
                  <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || targetEmailsCount === 0 || selectedQuestionsCount === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/20 px-6"
            >
              {isSubmitting ? (
                existingDrive ? "Updating Assessment..." : "Scheduling Assessment..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {existingDrive ? "Update" : "Dispatch"} Assessment ({selectedQuestionsCount} Question{selectedQuestionsCount !== 1 ? "s" : ""}: {selectedTheoreticalCount} Theory, {selectedCodingCount} Code) {existingDrive ? "" : `to ${targetEmailsCount} Student${targetEmailsCount !== 1 ? "s" : ""}`}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
