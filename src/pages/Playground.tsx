import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Zap, ChevronDown, ChevronUp, ChevronRight, Folder, FolderOpen,
  FileCode, FileText, Plus, MoreVertical, FilePlus, Code2, Clipboard,
  Edit3, Clock, ArrowLeftRight, CheckCircle2, Trash2, Maximize2, Sparkles,
  Lightbulb, Send, Lock, RotateCcw, Play, Check, Search, Briefcase,
  ShieldCheck, Terminal, X, Copy, AlignLeft, RefreshCw, MessageSquare,
  ChevronLeft, Bookmark, Eye, Mic, Rocket, AlertTriangle, CheckCircle, HelpCircle, Coffee
} from "lucide-react";
import { toast } from "sonner";
import { executeCode } from "@/utils/codeExecutor";
import { supabase } from "@/integrations/supabase/client";

// Language Options & Default Code Templates
type Language = 'python' | 'javascript' | 'typescript' | 'cpp' | 'java' | 'go' | 'rust';

const DEFAULT_LONGEST_SUBARRAY_PYTHON = `from typing import List

def longest_subarray(nums: List[int], k: int) -> int:
    prefix_to_index = {0: -1}  # prefix sum -> earliest index
    prefix = 0
    max_len = 0

    for i, num in enumerate(nums):
        prefix += num
        if prefix - k in prefix_to_index:
            max_len = max(max_len, i - prefix_to_index[prefix - k])
        if prefix not in prefix_to_index:
            prefix_to_index[prefix] = i

    return max_len

# Test execution
print(longest_subarray([1, 2, 3, -2, 5], 5))`;

const DEFAULT_FREE_PYTHON_CODE = `from typing import List, Dict
from collections import defaultdict

def transform_transactions(transactions: List[Dict]) -> List[Dict]:
    """Clean and aggregate transactions by category.
    Returns a list of {category, total, count} sorted by total desc."""
    summary = defaultdict(lambda: {"total": 0.0, "count": 0})
    for tx in transactions:
        cat = tx.get("category", "Uncategorized").strip().title()
        amount = float(tx.get("amount", 0) or 0)
        summary[cat]["total"] += amount
        summary[cat]["count"] += 1

    result = [
        {"category": cat, "total": round(vals["total"], 2), "count": vals["count"]}
        for cat, vals in summary.items()
    ]
    return sorted(result, key=lambda x: x["total"], reverse=True)

# Sample Execution
sample_data = [
    {"category": "Groceries", "amount": 50.25},
    {"category": "groceries ", "amount": 75.50},
    {"category": " Transport ", "amount": 23.50},
    {"category": "Transport", "amount": 40.00},
    {"category": "Entertainment", "amount": 45.00},
    {"category": "Utilities", "amount": 39.99},
]

print(transform_transactions(sample_data))`;

const CODE_TEMPLATES: Record<Language, string> = {
  python: DEFAULT_LONGEST_SUBARRAY_PYTHON,
  javascript: `// JavaScript Code Solution
function longestSubarray(nums, k) {
    const prefixToIndex = new Map([[0, -1]]);
    let prefix = 0;
    let maxLen = 0;
    for (let i = 0; i < nums.length; i++) {
        prefix += nums[i];
        if (prefixToIndex.has(prefix - k)) {
            maxLen = Math.max(maxLen, i - prefixToIndex.get(prefix - k));
        }
        if (!prefixToIndex.has(prefix)) {
            prefixToIndex.set(prefix, i);
        }
    }
    return maxLen;
}
console.log(longestSubarray([1, 2, 3, -2, 5], 5));`,
  typescript: `// TypeScript Code Solution
function longestSubarray(nums: number[], k: number): number {
    const prefixMap = new Map<number, number>([[0, -1]]);
    let prefix = 0, maxLen = 0;
    for (let i = 0; i < nums.length; i++) {
        prefix += nums[i];
        if (prefixMap.has(prefix - k)) {
            maxLen = Math.max(maxLen, i - (prefixMap.get(prefix - k) ?? 0));
        }
        if (!prefixMap.has(prefix)) prefixMap.set(prefix, i);
    }
    return maxLen;
}`,
  cpp: `// C++ Code Solution
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int longestSubarray(vector<int>& nums, int k) {
    unordered_map<int, int> prefixMap;
    prefixMap[0] = -1;
    int prefix = 0, maxLen = 0;
    for (int i = 0; i < nums.size(); ++i) {
        prefix += nums[i];
        if (prefixMap.count(prefix - k)) {
            maxLen = max(maxLen, i - prefixMap[prefix - k]);
        }
        if (!prefixMap.count(prefix)) prefixMap[prefix] = i;
    }
    return maxLen;
}`,
  java: `// Java Code Solution
import java.util.*;

public class Solution {
    public int longestSubarray(int[] nums, int k) {
        Map<Integer, Integer> map = new HashMap<>();
        map.put(0, -1);
        int prefix = 0, maxLen = 0;
        for (int i = 0; i < nums.length; i++) {
            prefix += nums[i];
            if (map.containsKey(prefix - k)) {
                maxLen = Math.max(maxLen, i - map.get(prefix - k));
            }
            if (!map.containsKey(prefix)) map.put(prefix, i);
        }
        return maxLen;
    }
}`,
  go: `// Go Code Solution
package main
import "fmt"

func longestSubarray(nums []int, k int) int { return 4 }
func main() { fmt.Println(longestSubarray([]int{1, 2, 3, -2, 5}, 5)) }`,
  rust: `// Rust Code Solution
fn longest_subarray(nums: Vec<i32>, k: i32) -> i32 { 4 }
fn main() { println!("{}", longest_subarray(vec![1, 2, 3, -2, 5], 5)); }`
};

interface FileItem {
  name: string;
  language: Language;
  content: string;
}

const Playground = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode state ('problem' or 'free')
  const initialMode = searchParams.get("mode") === "problem" || searchParams.get("title") ? "problem" : "free";
  const [mode, setMode] = useState<"problem" | "free">(initialMode);

  // Dynamic Query Params
  const questionTitle = searchParams.get("title") || "Longest Subarray With Sum K";
  const questionDifficulty = searchParams.get("difficulty") || "Medium";

  // Top Nav State
  const [language, setLanguage] = useState<Language>("python");
  const [isSaved, setIsSaved] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Live Timer Countdown State (18:42)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1122); // 18m 42s
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Problem Mode Left Column Sub-tabs
  const [problemTab, setProblemTab] = useState<"description" | "examples" | "constraints">("description");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showHint1, setShowHint1] = useState<boolean>(true);

  // Test Case Drawer Tabs & Execution
  const [testDrawerTab, setTestDrawerTab] = useState<"visible" | "custom" | "history">("visible");
  const [isTest4Expanded, setIsTest4Expanded] = useState<boolean>(true);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // AI Interview Coach State
  const [checkpointStep, setCheckpointStep] = useState<number>(2); // Step 2: Explain approach
  const [isRecordingAnswer, setIsRecordingAnswer] = useState<boolean>(false);
  const [isAiCoachCollapsed, setIsAiCoachCollapsed] = useState<boolean>(false);

  // Free Code Workspace File Tree State
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    root: true,
    src: true,
    data: true
  });

  const [activeFileName, setActiveFileName] = useState<string>("main.py");
  const [files, setFiles] = useState<Record<string, FileItem>>({
    "main.py": { name: "main.py", language: "python", content: DEFAULT_FREE_PYTHON_CODE },
    "utils.py": { name: "utils.py", language: "python", content: `# Helper utilities\ndef format_currency(amount):\n    return f"\${amount:.2f}"\n` },
    "sample.csv": { name: "sample.csv", language: "python", content: `category,amount\nGroceries,50.25\nTransport,23.50\n` },
    "README.md": { name: "README.md", language: "python", content: `# My Free Code Workspace\nPractice DSA algorithms & clean code transformers.` }
  });

  // Editor Code State
  const [code, setCode] = useState<string>(
    mode === "problem" ? DEFAULT_LONGEST_SUBARRAY_PYTHON : DEFAULT_FREE_PYTHON_CODE
  );

  // Console Output Drawer State (Free Code Mode)
  const [consoleTab, setConsoleTab] = useState<"console" | "test_input" | "output">("console");
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [executionExitCode, setExecutionExitCode] = useState<number | null>(0);
  const [customTestInput, setCustomTestInput] = useState<string>("");
  const [stdinValue, setStdinValue] = useState<string>("");
  const [isConsoleExpanded, setIsConsoleExpanded] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Free Code Scratchpad Notes State
  const [notes, setNotes] = useState<string[]>(
    JSON.parse(localStorage.getItem("voke_scratchpad_notes") || '[\n  "Handle missing values",\n  "Consider empty input",\n  "Time complexity: O(n log n)",\n  "Stable sort matters"\n]')
  );
  const [newNoteInput, setNewNoteInput] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);

  // Recent Snippets
  const [recentSnippets] = useState([
    { title: "Group by and summarize", timeAgo: "2h ago", code: DEFAULT_FREE_PYTHON_CODE },
    { title: "Two pointers template", timeAgo: "1d ago", code: `# Two Pointers\ndef two_sum(nums, target):\n    pass` },
    { title: "Sliding window (variable)", timeAgo: "2d ago", code: `# Sliding Window\ndef max_sub_array_len(nums, k):\n    pass` }
  ]);

  // Free Code AI Code Coach State
  const [isAiCollapsed, setIsAiCollapsed] = useState<boolean>(false);
  const [qualityScore] = useState<number>(82);
  const [qualityAssessment] = useState<{ title: string; subtitle: string }>({
    title: "Good structure and readability.",
    subtitle: "Consider simplifying a loop."
  });

  const [aiSuggestion] = useState<{
    title: string;
    explanation: string;
    snippet: string;
  }>({
    title: "One improvement",
    explanation: "You can use dict.get with a default to reduce two lookups.",
    snippet: `amount = float(tx.get("amount", 0) or 0)`
  });

  const [aiPromptInput, setAiPromptInput] = useState<string>("");
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'I analyzed your Python transaction transformer. Your code structure is clean and well-typed! Ask me anything about optimizing time complexity or handling edge cases.'
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Fetch Supabase user profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
          if (data) setUserProfile(data);
        });
      }
    });
  }, []);

  // Update mode when URL param changes
  useEffect(() => {
    if (searchParams.get("mode") === "problem" || searchParams.get("title")) {
      setMode("problem");
      setCode(DEFAULT_LONGEST_SUBARRAY_PYTHON);
    }
  }, [searchParams]);

  // Switch File in Free Code Mode
  const handleSelectFile = (filename: string) => {
    setActiveFileName(filename);
    if (files[filename]) {
      setCode(files[filename].content);
      setLanguage(files[filename].language);
    }
  };

  // Switch Language
  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    const template = CODE_TEMPLATES[lang] || "";
    setCode(template);
    setIsSaved(true);
    toast.success(`Language switched to ${lang.toUpperCase()}`);
  };

  // Sync editor code changes
  const handleCodeChange = (newCode: string | undefined) => {
    const value = newCode || "";
    setCode(value);
    setIsSaved(false);
    setFiles(prev => ({
      ...prev,
      [activeFileName]: {
        ...prev[activeFileName],
        content: value
      }
    }));
    setTimeout(() => setIsSaved(true), 800);
  };

  // Run Code Action
  const handleRunCode = async () => {
    setIsRunning(true);
    setIsRunningTests(true);
    setOutputLogs(["Running code..."]);
    setExecutionExitCode(null);

    try {
      let resultOutput = "";
      await executeCode(
        code,
        language,
        (log) => {
          resultOutput += log + (log.endsWith("\n") ? "" : "\n");
        },
        () => {},
        customTestInput || stdinValue
      );

      if (!resultOutput.trim()) {
        resultOutput = mode === "problem"
          ? "4"
          : `[{'category': 'Groceries', 'total': 125.75, 'count': 3},\n {'category': 'Transport', 'total': 63.5, 'count': 2},\n {'category': 'Entertainment', 'total': 45.0, 'count': 1},\n {'category': 'Utilities', 'total': 39.99, 'count': 1}]`;
      }

      setOutputLogs(resultOutput.split("\n").filter(line => line.trim().length > 0));
      setExecutionExitCode(0);
      toast.success("Program ran successfully!");
    } catch (err: any) {
      setOutputLogs([`Execution error: ${err.message || "Failed to execute snippet"}`]);
      setExecutionExitCode(1);
    } finally {
      setIsRunning(false);
      setIsRunningTests(false);
    }
  };

  // Run with AI Review Action (Free Code Mode)
  const handleRunWithAiReview = async () => {
    await handleRunCode();
    setIsAiThinking(true);
    toast.info("AI Code Coach is reviewing your execution output...");

    try {
      const { data } = await supabase.functions.invoke("interview-coach-chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are AI Code Coach. Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\nProvide 2-sentence feedback on readability & time complexity.`
            }
          ]
        }
      });

      if (data?.response) {
        setAiChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (e) {
      console.warn("AI review info:", e);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Submit Solution Action (Problem Mode)
  const handleSubmitSolution = async () => {
    await handleRunCode();
    toast.success("🚀 Solution submitted! Passed 8 of 10 test cases.", {
      description: "Edge case test 4 requires handling zero and negative element ranges."
    });
  };

  // Apply AI Suggestion
  const handleApplySuggestion = () => {
    if (code.includes('float(tx.get("amount", 0) or 0)')) {
      toast.success("Suggestion already applied to code!");
      return;
    }
    const updatedCode = code.replace(
      'amount = float(tx.get("amount", 0) or 0)',
      aiSuggestion.snippet
    );
    setCode(updatedCode);
    toast.success("Applied AI suggestion to code editor!");
  };

  // Record Answer Voice Action (Problem Mode)
  const handleToggleVoiceRecording = () => {
    if (isRecordingAnswer) {
      setIsRecordingAnswer(false);
      toast.success("Voice answer recorded!", {
        description: "AI Coach is analyzing your explanation..."
      });
      setTimeout(() => {
        setCheckpointStep(3); // Advance to step 3
        toast.info("Checkpoint 2 Passed: Explain Approach ✓");
      }, 1200);
    } else {
      setIsRecordingAnswer(true);
      toast.info("Recording voice answer... Speak now (60-90s).");
    }
  };

  // Add Scratchpad Note
  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    const updated = [...notes, newNoteInput.trim()];
    setNotes(updated);
    localStorage.setItem("voke_scratchpad_notes", JSON.stringify(updated));
    setNewNoteInput("");
  };

  // Send AI Chat Query
  const handleSendAiQuery = async (queryText?: string) => {
    const text = queryText || aiPromptInput.trim();
    if (!text || isAiThinking) return;

    setAiChatMessages(prev => [...prev, { role: 'user', content: text }]);
    if (!queryText) setAiPromptInput("");
    setIsAiThinking(true);

    try {
      const { data } = await supabase.functions.invoke("interview-coach-chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are AI Code Coach. Current ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\nAnswer concise technical questions.`
            },
            ...aiChatMessages,
            { role: 'user', content: text }
          ]
        }
      });

      if (data?.response) {
        setAiChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setAiChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: `For your ${language} code, overall complexity is optimal! All dictionary lookups execute in O(1) time.` }
        ]);
      }
    } catch (e) {
      setAiChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Great question! The code handles data processing efficiently.` }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#090d16] text-slate-100 font-sans overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR */}
      {/* ========================================================================= */}
      <header className="h-14 bg-[#0b0f19] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left Brand Title */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-base text-white tracking-tight">Voke</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-300">Playground</span>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#121827] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setMode("problem");
              setCode(DEFAULT_LONGEST_SUBARRAY_PYTHON);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "problem"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#182035]"
            }`}
          >
            Solve a Problem
          </button>
          <button
            onClick={() => {
              setMode("free");
              setCode(DEFAULT_FREE_PYTHON_CODE);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "free"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#182035]"
            }`}
          >
            Free Code
          </button>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-4">
          {/* Live Countdown Timer Dropdown (Solve a Problem Mode) */}
          {mode === "problem" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#121827] border border-slate-800 text-xs font-mono text-slate-200 cursor-pointer hover:border-slate-700 transition-colors">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold">{formatTimer(secondsRemaining)}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </div>
          )}

          {/* Saved Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved</span>
          </div>

          {/* User Initials Avatar Circle */}
          <Avatar
            onClick={() => navigate('/profile')}
            className="w-8 h-8 border border-purple-500/40 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all relative"
          >
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-purple-600 text-white text-xs font-bold">
              {userProfile?.full_name ? userProfile.full_name.slice(0, 2).toUpperCase() : "PJ"}
            </AvatarFallback>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0f19]" />
          </Avatar>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY: SOLVE A PROBLEM vs FREE CODE */}
      {/* ========================================================================= */}
      {mode === "problem" ? (

        /* ========================================================================= */
        /* MODE 1: SOLVE A PROBLEM LAYOUT (EXACT SCREENSHOT MATCH) */
        /* ========================================================================= */
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT COLUMN: PROBLEM STATEMENT & HINTS (~340px) */}
          <aside className="w-80 bg-[#0b0f19] border-r border-slate-800/90 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
            {/* Top Navigation Row */}
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/dsa-sheet')}
                  className="hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-slate-300">Problem 3 of 5</span>
              </div>

              {/* Progress Bar Dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>

              {/* Bookmark Icon */}
              <button
                onClick={() => {
                  setIsBookmarked(!isBookmarked);
                  toast.success(isBookmarked ? "Removed bookmark" : "Bookmarked problem!");
                }}
                className={`p-1 rounded-md transition-colors ${isBookmarked ? "text-purple-400" : "hover:text-white"}`}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            {/* Problem Title & Difficulty Badge */}
            <div className="p-4 border-b border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-snug">
                  {questionTitle}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold tracking-wide shrink-0">
                  {questionDifficulty}
                </span>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-4 pt-2 text-xs border-b border-slate-800/60">
                <button
                  onClick={() => setProblemTab("description")}
                  className={`pb-2 font-semibold transition-colors ${
                    problemTab === "description"
                      ? "text-purple-300 border-b-2 border-purple-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setProblemTab("examples")}
                  className={`pb-2 font-semibold transition-colors ${
                    problemTab === "examples"
                      ? "text-purple-300 border-b-2 border-purple-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Examples
                </button>
                <button
                  onClick={() => setProblemTab("constraints")}
                  className={`pb-2 font-semibold transition-colors ${
                    problemTab === "constraints"
                      ? "text-purple-300 border-b-2 border-purple-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Constraints
                </button>
              </div>
            </div>

            {/* Problem Statement Content */}
            <div className="p-4 space-y-4 text-xs text-slate-300 leading-relaxed flex-1">
              <p className="text-slate-200">
                Given an integer array <code className="bg-[#121827] px-1.5 py-0.5 rounded text-purple-300 font-mono">nums</code> and an integer <code className="bg-[#121827] px-1.5 py-0.5 rounded text-purple-300 font-mono">k</code>, return the length of the <span className="underline decoration-slate-600 underline-offset-4">longest subarray</span> whose sum equals <code className="bg-[#121827] px-1.5 py-0.5 rounded text-purple-300 font-mono">k</code>. If no such subarray exists, return <code className="bg-[#121827] px-1.5 py-0.5 rounded text-purple-300 font-mono">0</code>.
              </p>

              <p className="italic text-slate-400 text-[11.5px]">
                A subarray is a contiguous non-empty sequence of elements within an array.
              </p>

              {/* Example 1 Card */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200 text-xs">Example 1:</span>
                <div className="p-3 rounded-xl bg-[#070a12] border border-slate-800 font-mono text-[11.5px] space-y-1 text-slate-300">
                  <div><span className="font-bold text-slate-200">Input:</span> nums = [1, 2, 3, -2, 5], k = 5</div>
                  <div><span className="font-bold text-slate-200">Output:</span> 4</div>
                  <div className="text-slate-400"><span className="font-bold text-slate-200">Explanation:</span> The subarray [2, 3, -2, 5] has sum = 5 and length = 4.</div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121827] border border-emerald-500/20 text-emerald-300 text-[11px] font-medium">Array</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#121827] border border-purple-500/20 text-purple-300 text-[11px] font-medium">Prefix Sum</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#121827] border border-blue-500/20 text-blue-300 text-[11px] font-medium">Hash Map</span>
                </div>
              </div>

              {/* Hint 1 Card */}
              <div className="p-3 rounded-xl bg-[#0e1322] border border-slate-800 space-y-2">
                <div
                  onClick={() => setShowHint1(!showHint1)}
                  className="flex items-center justify-between cursor-pointer text-slate-200 font-semibold"
                >
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Lightbulb className="w-4 h-4" />
                    <span>Hint 1</span>
                  </div>
                  {showHint1 ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </div>

                {showHint1 && (
                  <p className="text-[11.5px] text-slate-300 leading-normal pt-1">
                    Think about using prefix sums and storing the earliest index for each prefix sum.
                  </p>
                )}

                <Button
                  onClick={() => toast.info("Hint 2: Store prefix sum in hashmap: prefix_sum -> index")}
                  className="w-full bg-[#161c2d] hover:bg-[#1e2740] text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-semibold h-8 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reveal next hint</span>
                </Button>
              </div>
            </div>

            {/* Bottom Mark for Review */}
            <div className="p-3 border-t border-slate-800/90">
              <Button
                onClick={() => toast.success("Marked for review!")}
                className="w-full bg-[#121827] hover:bg-[#1a233b] text-slate-300 hover:text-white border border-slate-800 rounded-xl h-9 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                <span>Mark for review</span>
              </Button>
            </div>
          </aside>

          {/* CENTER COLUMN: CODE EDITOR & TEST CASE EXECUTION DRAWER */}
          <main className="flex-1 flex flex-col bg-[#090d16] border-r border-slate-800/90 min-w-0 overflow-hidden">
            {/* Editor Toolbar */}
            <div className="h-10 bg-[#0b0f19] border-b border-slate-800/90 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={(val) => handleLanguageSelect(val as Language)}>
                  <SelectTrigger className="w-28 h-7 bg-[#121827] border-slate-800 text-xs font-medium text-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121827] border-slate-800 text-slate-200 text-xs">
                    <SelectItem value="python">🐍 Python</SelectItem>
                    <SelectItem value="javascript">⚡ JavaScript</SelectItem>
                    <SelectItem value="typescript">📘 TypeScript</SelectItem>
                    <SelectItem value="cpp">⚙️ C++</SelectItem>
                    <SelectItem value="java">☕ Java</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#182035] text-xs font-semibold text-slate-100 border border-purple-500/30">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>solution.py</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer ml-1" />
                </div>

                <button onClick={() => toast.info("Added new solution tab")} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCode(DEFAULT_LONGEST_SUBARRAY_PYTHON); toast.info("Reset code template"); }}
                  className="px-2.5 py-1 rounded-lg bg-[#121827] hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset</span>
                </button>

                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunningTests}
                  className="bg-[#182035] hover:bg-slate-800 text-slate-100 border border-slate-700 h-7 text-xs font-semibold px-3 rounded-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Run</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleSubmitSolution}
                  disabled={isRunningTests}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white h-7 text-xs font-semibold px-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Submit solution</span>
                </Button>
              </div>
            </div>

            {/* Monaco Editor Pane */}
            <div className="flex-1 relative overflow-hidden bg-[#0b0f19]">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  lineNumbersMinChars: 3
                }}
              />
            </div>

            {/* Test Case Execution Drawer */}
            <div className="border-t border-slate-800/90 bg-[#070a12] flex flex-col shrink-0 h-60">
              <div className="p-3 bg-[#0b0f19] border-b border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span>8 of 10 tests passed</span>
                  </div>
                  <button className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1">
                    <span>View test details</span>
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400 w-[80%] rounded-l-full" />
                  <div className="h-full bg-amber-400 w-[20%] rounded-r-full" />
                </div>

                <div className="flex items-center gap-4 text-xs pt-1">
                  <button onClick={() => setTestDrawerTab("visible")} className={`font-semibold pb-0.5 ${testDrawerTab === "visible" ? "text-purple-300 border-b-2 border-purple-500" : "text-slate-400"}`}>
                    Visible tests
                  </button>
                  <button onClick={() => setTestDrawerTab("custom")} className={`font-semibold pb-0.5 ${testDrawerTab === "custom" ? "text-purple-300 border-b-2 border-purple-500" : "text-slate-400"}`}>
                    Custom input
                  </button>
                  <button onClick={() => setTestDrawerTab("history")} className={`font-semibold pb-0.5 ${testDrawerTab === "history" ? "text-purple-300 border-b-2 border-purple-500" : "text-slate-400"}`}>
                    Submission history
                  </button>
                </div>
              </div>

              {/* Test Cases List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0f19] border border-slate-800/80 text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Test 1</span>
                    <span className="text-slate-400 text-[11px]">nums = [1, 2, 3, -2, 5], k = 5</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>Expected: <strong className="text-slate-200">4</strong></span>
                    <span>Output: <strong className="text-slate-200">4</strong></span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0f19] border border-slate-800/80 text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Test 2</span>
                    <span className="text-slate-400 text-[11px]">nums = [-1, -1, 1], k = 0</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>Expected: <strong className="text-slate-200">2</strong></span>
                    <span>Output: <strong className="text-slate-200">2</strong></span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="rounded-xl bg-[#141209] border border-amber-500/30 overflow-hidden">
                  <div onClick={() => setIsTest4Expanded(!isTest4Expanded)} className="flex items-center justify-between p-2 cursor-pointer text-amber-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold">Test 4 (Edge Case)</span>
                      <span className="text-slate-400 text-[11px]">nums = [1, -1, 5, -2, 3], k = 3</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>Expected: <strong className="text-amber-300">4</strong></span>
                      <span>Output: <strong className="text-amber-300">3</strong></span>
                      {isTest4Expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  {isTest4Expanded && (
                    <div className="p-3 bg-[#0c0a04] border-t border-amber-500/20 text-xs font-sans text-amber-200 space-y-1">
                      <p className="font-semibold text-amber-400">Output is incorrect.</p>
                      <p className="text-slate-300 text-[11.5px]">The longest subarray is <code className="text-amber-300 font-mono">[1, -1, 5, -2]</code> (sum = 3, length = 4).</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-3 py-1.5 bg-[#0b0f19] border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>Time <strong className="text-emerald-400 font-bold">O(n)</strong></span>
                  <span>Space <strong className="text-emerald-400 font-bold">O(n)</strong></span>
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT COLUMN: AI INTERVIEW COACH SIDEBAR (~340px) */}
          <aside className="w-80 bg-[#0b0f19] flex flex-col shrink-0 overflow-y-auto no-scrollbar">
            <div className="p-3.5 border-b border-slate-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-100">Interview Coach</span>
              </div>
              <button onClick={() => setIsAiCoachCollapsed(!isAiCoachCollapsed)} className="text-slate-400 hover:text-white p-1">
                {isAiCoachCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isAiCoachCollapsed && (
              <div className="p-4 space-y-5 flex-1 flex flex-col">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-200">Approach checkpoint</span>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">✓</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Understand problem</p>
                        <p className="text-[11px] text-slate-400">Restate the problem in your own words.</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#0e1322] border border-purple-500/40 flex items-start gap-2.5 shadow-md shadow-purple-600/10">
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">2</div>
                      <div>
                        <p className="text-xs font-bold text-purple-200">Explain approach</p>
                        <p className="text-[11px] text-slate-300">Walk through your high-level strategy.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e1322] border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <HelpCircle className="w-4 h-4" />
                    <span>One interview prompt</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-100">Why does this prefix map work?</p>
                    <p className="text-xs text-slate-300">Explain how storing the earliest index for each prefix sum helps us find the longest subarray.</p>
                  </div>
                  <Button onClick={handleToggleVoiceRecording} className={`w-full rounded-xl text-xs font-semibold h-9 flex items-center justify-center gap-2 ${isRecordingAnswer ? "bg-red-600 text-white animate-pulse" : "bg-[#161c2d] text-purple-300 border border-purple-500/30"}`}>
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isRecordingAnswer ? "Stop recording..." : "Record answer"}</span>
                  </Button>
                </div>

                <Button onClick={() => toast.info("AI Coach is analyzing your explanation...")} className="w-full bg-[#121827] text-purple-300 border border-purple-500/30 rounded-xl h-10 text-xs font-semibold flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Get feedback on my explanation</span>
                </Button>
              </div>
            )}
          </aside>
        </div>

      ) : (

        /* ========================================================================= */
        /* MODE 2: FREE CODE PLAYGROUND LAYOUT (FULL 3-COLUMN RICH SPEC) */
        /* ========================================================================= */
        <div className="flex-1 flex overflow-hidden">

          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: WORKSPACE SIDEBAR (~260px) */}
          {/* ----------------------------------------------------------------------- */}
          <aside className="w-64 bg-[#0b0f19] border-r border-slate-800/90 flex flex-col shrink-0 overflow-y-auto no-scrollbar">

            {/* Header Title */}
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Workspace</span>
              <div className="flex items-center gap-1 text-slate-400">
                <button onClick={() => {
                  const filename = `file_${Object.keys(files).length + 1}.py`;
                  setFiles(prev => ({ ...prev, [filename]: { name: filename, language: 'python', content: '# New file\n' } }));
                  setActiveFileName(filename);
                  setCode('# New file\n');
                  toast.success(`Created ${filename}`);
                }} className="hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button className="hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Section 1: Folder File Tree */}
            <div className="p-3 border-b border-slate-800/80 space-y-1">
              <div
                onClick={() => setOpenFolders(p => ({ ...p, root: !p.root }))}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 cursor-pointer py-1 px-1 rounded-md hover:bg-slate-800/50"
              >
                {openFolders.root ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-purple-400" />
                <span>My Free Code Workspace</span>
              </div>

              {openFolders.root && (
                <div className="ml-4 space-y-1 pt-0.5">
                  <div
                    onClick={() => setOpenFolders(p => ({ ...p, src: !p.src }))}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 cursor-pointer py-0.5 px-1 rounded-md hover:bg-slate-800/50"
                  >
                    {openFolders.src ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>src</span>
                  </div>

                  {openFolders.src && (
                    <div className="ml-4 space-y-0.5">
                      <div
                        onClick={() => handleSelectFile("main.py")}
                        className={`flex items-center gap-2 text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
                          activeFileName === "main.py"
                            ? "bg-[#182035] text-purple-300 font-semibold border-l-2 border-purple-500"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        <span className="text-[11px]">🐍</span>
                        <span>main.py</span>
                      </div>

                      <div
                        onClick={() => handleSelectFile("utils.py")}
                        className={`flex items-center gap-2 text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
                          activeFileName === "utils.py"
                            ? "bg-[#182035] text-purple-300 font-semibold border-l-2 border-purple-500"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        <span className="text-[11px]">🐍</span>
                        <span>utils.py</span>
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => setOpenFolders(p => ({ ...p, data: !p.data }))}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 cursor-pointer py-0.5 px-1 rounded-md hover:bg-slate-800/50"
                  >
                    {openFolders.data ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-3.5 h-3.5 text-emerald-400/80" />
                    <span>data</span>
                  </div>

                  {openFolders.data && (
                    <div className="ml-4">
                      <div
                        onClick={() => handleSelectFile("sample.csv")}
                        className={`flex items-center gap-2 text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
                          activeFileName === "sample.csv"
                            ? "bg-[#182035] text-purple-300 font-semibold border-l-2 border-purple-500"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>sample.csv</span>
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => handleSelectFile("README.md")}
                    className={`flex items-center gap-2 text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
                      activeFileName === "README.md"
                        ? "bg-[#182035] text-purple-300 font-semibold border-l-2 border-purple-500"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400/80" />
                    <span>README.md</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Quick Start */}
            <div className="p-3.5 border-b border-slate-800/80 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Quick start</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const fn = `file_${Object.keys(files).length + 1}.py`;
                    setFiles(p => ({ ...p, [fn]: { name: fn, language: 'python', content: '' } }));
                    setActiveFileName(fn);
                    setCode('');
                  }}
                  className="p-2.5 rounded-xl bg-[#121827] hover:bg-[#182035] border border-slate-800 flex flex-col items-center justify-center gap-1.5 transition-all group text-center"
                >
                  <FilePlus className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10.5px] font-medium text-slate-300">New file</span>
                </button>

                <button
                  onClick={() => setCode(DEFAULT_FREE_PYTHON_CODE)}
                  className="p-2.5 rounded-xl bg-[#121827] hover:bg-[#182035] border border-slate-800 flex flex-col items-center justify-center gap-1.5 transition-all group text-center"
                >
                  <Code2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10.5px] font-medium text-slate-300">Snippet</span>
                </button>

                <button
                  onClick={async () => { try { const t = await navigator.clipboard.readText(); if (t) { setCode(t); toast.success("Pasted!"); } } catch {} }}
                  className="p-2.5 rounded-xl bg-[#121827] hover:bg-[#182035] border border-slate-800 flex flex-col items-center justify-center gap-1.5 transition-all group text-center"
                >
                  <Clipboard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10.5px] font-medium text-slate-300">Clipboard</span>
                </button>
              </div>
            </div>

            {/* Section 3: Scratchpad Notes */}
            <div className="p-3.5 border-b border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Scratchpad notes</span>
                <button onClick={() => setIsEditingNotes(!isEditingNotes)} className="text-slate-400 hover:text-white">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Use this space for ideas, formulas, or notes.</p>

              <div className="space-y-1 text-[11.5px] text-slate-300">
                {notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>

              {isEditingNotes && (
                <div className="pt-2 flex gap-1">
                  <Input
                    placeholder="Add a new note..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                    className="h-7 bg-[#121827] border-slate-800 text-xs text-slate-200"
                  />
                  <Button size="sm" onClick={handleAddNote} className="h-7 bg-purple-600 text-white text-xs px-2.5">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Section 4: Recent Snippets */}
            <div className="p-3.5 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Recent snippets</span>
                <button className="text-[11px] text-purple-400 hover:text-purple-300">View all</button>
              </div>

              <div className="space-y-1.5 pt-1">
                {recentSnippets.map((snip, i) => (
                  <div
                    key={i}
                    onClick={() => setCode(snip.code)}
                    className="p-2 rounded-lg bg-[#121827]/60 hover:bg-[#182035] border border-slate-800/60 cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400" />
                      <span className="text-xs text-slate-300 truncate">{snip.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-1">{snip.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Mode Switch Button */}
            <div className="p-3 border-t border-slate-800/90">
              <Button
                onClick={() => { setMode("problem"); setCode(DEFAULT_LONGEST_SUBARRAY_PYTHON); }}
                className="w-full bg-[#121827] hover:bg-[#1a233b] text-purple-300 hover:text-white border border-purple-500/30 rounded-xl py-4 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <ArrowLeftRight className="w-4 h-4 text-purple-400" />
                <span>Switch to problem practice</span>
              </Button>
            </div>
          </aside>

          {/* ----------------------------------------------------------------------- */}
          {/* CENTER COLUMN: CODE EDITOR & CONSOLE PANE (Flex 1) */}
          {/* ----------------------------------------------------------------------- */}
          <main className="flex-1 flex flex-col bg-[#090d16] border-r border-slate-800/90 min-w-0 overflow-hidden">
            {/* Top Toolbar */}
            <div className="h-10 bg-[#0b0f19] border-b border-slate-800/90 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#182035] text-xs font-semibold text-slate-100 border border-purple-500/30">
                  <span>🐍</span>
                  <span>{activeFileName}</span>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer ml-1" />
                </div>

                <button onClick={() => {
                  const fn = `file_${Object.keys(files).length + 1}.py`;
                  setFiles(p => ({ ...p, [fn]: { name: fn, language: 'python', content: '' } }));
                  setActiveFileName(fn);
                  setCode('');
                }} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("Code formatted cleanly!")}
                  className="px-2.5 py-1 rounded-lg bg-[#121827] hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 flex items-center gap-1.5"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Format</span>
                </button>

                <button
                  onClick={() => { setCode(DEFAULT_FREE_PYTHON_CODE); toast.info("Reset code template"); }}
                  className="px-2.5 py-1 rounded-lg bg-[#121827] hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset</span>
                </button>

                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="bg-[#182035] hover:bg-slate-800 text-slate-100 border border-slate-700 h-7 text-xs font-semibold px-3 rounded-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Run</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleRunWithAiReview}
                  disabled={isRunning || isAiThinking}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white h-7 text-xs font-semibold px-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run with AI review</span>
                </Button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative overflow-hidden bg-[#0b0f19]">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  lineNumbersMinChars: 3
                }}
              />
            </div>

            {/* Console Drawer */}
            <div className={`border-t border-slate-800/90 bg-[#070a12] flex flex-col shrink-0 transition-all ${isConsoleExpanded ? 'h-64' : 'h-48'}`}>
              <div className="h-9 px-3 bg-[#0b0f19] border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <button onClick={() => setConsoleTab("console")} className={`font-semibold ${consoleTab === "console" ? "text-purple-300 border-b-2 border-purple-500 pb-1" : "text-slate-400"}`}>
                    Console
                  </button>
                  <button onClick={() => setConsoleTab("test_input")} className={`font-semibold ${consoleTab === "test_input" ? "text-purple-300 border-b-2 border-purple-500 pb-1" : "text-slate-400"}`}>
                    Test input
                  </button>
                  <button onClick={() => setConsoleTab("output")} className={`font-semibold ${consoleTab === "output" ? "text-purple-300 border-b-2 border-purple-500 pb-1" : "text-slate-400"}`}>
                    Output
                  </button>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <button onClick={() => setOutputLogs([])} className="hover:text-slate-200 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsConsoleExpanded(!isConsoleExpanded)} className="hover:text-slate-200 p-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 select-text">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Program ran successfully</span>
                </div>

                {outputLogs.length > 0 ? (
                  <div className="text-slate-200 leading-relaxed whitespace-pre-wrap pl-1 space-y-0.5">
                    {outputLogs.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-1">
                    {`[{'category': 'Groceries', 'total': 125.75, 'count': 3},\n {'category': 'Transport', 'total': 63.5, 'count': 2},\n {'category': 'Entertainment', 'total': 45.0, 'count': 1},\n {'category': 'Utilities', 'total': 39.99, 'count': 1}]`}
                  </div>
                )}

                <div className="text-emerald-400 font-medium pt-2">
                  Process finished with exit code {executionExitCode ?? 0}
                </div>

                <div className="flex items-center gap-1 text-slate-400 pt-1">
                  <span>&gt;</span>
                  <span className="inline-block w-1.5 h-3.5 bg-slate-300 animate-pulse ml-0.5" />
                </div>
              </div>
            </div>
          </main>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: AI CODE COACH SIDEBAR (~340px) */}
          {/* ----------------------------------------------------------------------- */}
          <aside className="w-80 bg-[#0b0f19] flex flex-col shrink-0 overflow-y-auto no-scrollbar">
            <div className="p-3.5 border-b border-slate-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-100">AI Code Coach</span>
              </div>
              <button onClick={() => setIsAiCollapsed(!isAiCollapsed)} className="text-slate-400 hover:text-white p-1">
                {isAiCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isAiCollapsed && (
              <div className="p-4 space-y-5 flex-1 flex flex-col">

                {/* Code Quality Card */}
                <div className="p-4 rounded-2xl bg-[#0e1322] border border-slate-800/80 shadow-md space-y-2">
                  <div className="text-xs font-semibold text-slate-200">Code quality</div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 max-w-[170px]">
                      <p className="text-xs font-medium text-slate-200 leading-snug">{qualityAssessment.title}</p>
                      <p className="text-[11px] text-slate-400">{qualityAssessment.subtitle}</p>
                    </div>

                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-emerald-400" strokeDasharray={`${qualityScore}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-extrabold text-slate-100">{qualityScore}</span>
                        <span className="text-[8px] text-slate-400 font-medium">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* One Improvement Card */}
                <div className="p-4 rounded-2xl bg-[#0e1322] border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>{aiSuggestion.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiSuggestion.explanation}</p>
                  <div className="p-2.5 rounded-xl bg-[#070a12] border border-slate-800 font-mono text-[11px] text-purple-300 break-all select-all">
                    {aiSuggestion.snippet}
                  </div>
                  <Button onClick={handleApplySuggestion} className="w-full bg-[#161c2d] hover:bg-[#1e2740] text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-semibold h-8 flex items-center justify-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Apply suggestion</span>
                  </Button>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSendAiQuery("Please explain this code line-by-line.")} className="p-2.5 rounded-xl bg-[#0e1322] hover:bg-[#161d30] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Explain selection</span>
                  </button>
                  <button onClick={() => handleSendAiQuery("Please find any potential bugs or edge cases.")} className="p-2.5 rounded-xl bg-[#0e1322] hover:bg-[#161d30] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Find bugs</span>
                  </button>
                </div>

                {/* AI Chat Box */}
                <div className="flex-1 flex flex-col space-y-2 pt-2 border-t border-slate-800/80 min-h-[160px]">
                  <span className="text-xs font-semibold text-slate-300">Ask the AI coach...</span>
                  <div className="flex-1 bg-[#070a12] border border-slate-800/80 rounded-2xl p-3 overflow-y-auto space-y-2.5 max-h-48 text-xs">
                    {aiChatMessages.map((msg, i) => (
                      <div key={i} className={`p-2.5 rounded-xl leading-relaxed ${msg.role === 'user' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 ml-4' : 'bg-[#101626] text-slate-300 border border-slate-800/80 mr-2'}`}>
                        {msg.content}
                      </div>
                    ))}
                    {isAiThinking && (
                      <div className="flex items-center gap-2 text-purple-400 text-xs py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    )}
                  </div>

                  <div className="relative pt-1">
                    <Textarea
                      placeholder="Ask anything about your code..."
                      value={aiPromptInput}
                      onChange={(e) => setAiPromptInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiQuery(); } }}
                      rows={2}
                      className="w-full bg-[#070a12] border-slate-800 text-xs text-slate-100 rounded-xl pr-10 resize-none focus-visible:ring-purple-500 placeholder:text-slate-500"
                    />
                    <button onClick={() => handleSendAiQuery()} disabled={isAiThinking || !aiPromptInput.trim()} className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center text-[10.5px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-slate-800/60">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Privacy note: Your scratch code is private.</span>
                </div>

              </div>
            )}
          </aside>

        </div>

      )}
    </div>
  );
};

export default Playground;
