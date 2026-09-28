import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Copy,
  AlignLeft,
  Sparkles,
  Terminal,
  Columns,
  Rows,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Search,
  Check,
  Send,
  Code2
} from "lucide-react";
import { toast } from "sonner";
import { executeCode, SupportedLanguage } from "@/utils/codeExecutor";
import { supabase } from "@/integrations/supabase/client";
import { QUESTIONS, Question } from "@/data/questions";

// Supported Languages and Starter Templates
export type Language = 'python' | 'javascript' | 'typescript' | 'cpp' | 'java' | 'go' | 'rust';

interface LanguageConfig {
  id: Language;
  name: string;
  icon: string;
  fileName: string;
  monacoLang: string;
  starterCode: string;
}

const LANGUAGES: Record<Language, LanguageConfig> = {
  python: {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    fileName: 'main.py',
    monacoLang: 'python',
    starterCode: `# Python 3
def main():
    print("Hello, Voke Playground!")

if __name__ == "__main__":
    main()
`
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    icon: '⚡',
    fileName: 'index.js',
    monacoLang: 'javascript',
    starterCode: `// JavaScript
function main() {
    console.log("Hello, Voke Playground!");
}

main();
`
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    icon: '📘',
    fileName: 'index.ts',
    monacoLang: 'typescript',
    starterCode: `// TypeScript
interface Message {
    text: string;
    timestamp: Date;
}

const msg: Message = {
    text: "Hello, Voke Playground!",
    timestamp: new Date()
};

console.log(msg.text);
`
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    icon: '⚙️',
    fileName: 'main.cpp',
    monacoLang: 'cpp',
    starterCode: `// C++
#include <iostream>

int main() {
    std::cout << "Hello, Voke Playground!" << std::endl;
    return 0;
}
`
  },
  java: {
    id: 'java',
    name: 'Java',
    icon: '☕',
    fileName: 'Main.java',
    monacoLang: 'java',
    starterCode: `// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Voke Playground!");
    }
}
`
  },
  go: {
    id: 'go',
    name: 'Go',
    icon: '🐹',
    fileName: 'main.go',
    monacoLang: 'go',
    starterCode: `// Go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Voke Playground!")
}
`
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    icon: '🦀',
    fileName: 'main.rs',
    monacoLang: 'rust',
    starterCode: `// Rust
fn main() {
    println!("Hello, Voke Playground!");
}
`
  }
};

const getProblemStarterCode = (questionTitle: string, lang: Language): string => {
  const cleanTitle = questionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
  switch (lang) {
    case 'python':
      return `# Solution for: ${questionTitle}
from typing import List, Optional

class Solution:
    def solve(self, *args):
        # Write your solution here
        pass

# Example run
s = Solution()
print("Solution initialized for: ${questionTitle}")
`;
    case 'javascript':
      return `/**
 * Solution for: ${questionTitle}
 */
function solve(...args) {
    // Write your solution here
    return null;
}

console.log("Solution initialized for: ${questionTitle}");
`;
    case 'typescript':
      return `/**
 * Solution for: ${questionTitle}
 */
function solve(...args: any[]): any {
    // Write your solution here
    return null;
}

console.log("Solution initialized for: ${questionTitle}");
`;
    case 'cpp':
      return `// Solution for: ${questionTitle}
#include <iostream>
#include <vector>

using namespace std;

class Solution {
public:
    void solve() {
        // Write your solution here
    }
};

int main() {
    Solution s;
    cout << "Solution initialized for: ${questionTitle}" << endl;
    return 0;
}
`;
    case 'java':
      return `// Solution for: ${questionTitle}
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Solution initialized for: ${questionTitle}");
    }
}
`;
    default:
      return LANGUAGES[lang]?.starterCode || "";
  }
};

const Playground = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: "free" or "problem"
  const initialMode = searchParams.get("mode") === "problem" || searchParams.get("title") || searchParams.get("questionId") ? "problem" : "free";
  const [mode, setMode] = useState<"free" | "problem">(initialMode);

  // Selected Problem State (if in problem mode)
  const questionIdParam = searchParams.get("questionId");
  const titleParam = searchParams.get("title");

  const [selectedQuestion, setSelectedQuestion] = useState<Question>(() => {
    if (questionIdParam) {
      const found = QUESTIONS.find(q => q.id === Number(questionIdParam));
      if (found) return found;
    }
    if (titleParam) {
      const found = QUESTIONS.find(q => q.title.toLowerCase() === titleParam.toLowerCase());
      if (found) return found;
    }
    return QUESTIONS[0] || {
      id: 1,
      title: "Rotate Image",
      difficulty: "Medium",
      companies: ["Google", "Meta", "Amazon"],
      platform: "LeetCode",
      url: "https://leetcode.com/problems/rotate-image",
      tags: ["Array", "Math", "Matrix"]
    };
  });

  const [questionSearchOpen, setQuestionSearchOpen] = useState(false);

  // Language & Code State
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState<string>(() => {
    if (initialMode === "problem") {
      return getProblemStarterCode(selectedQuestion.title, "python");
    }
    return LANGUAGES.python.starterCode;
  });

  // Stdin & Output Console State
  const [activeConsoleTab, setActiveConsoleTab] = useState<"output" | "stdin">("output");
  const [stdinValue, setStdinValue] = useState("");
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [executionExitCode, setExecutionExitCode] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  // Layout Split: horizontal (side by side) or vertical (stacked)
  const [layoutDirection, setLayoutDirection] = useState<"horizontal" | "vertical">("horizontal");

  // User profile
  const [userProfile, setUserProfile] = useState<any>(null);

  // AI Assistant Drawer State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiChat, setAiChat] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Monaco Editor Ref
  const editorRef = useRef<any>(null);

  // Dynamic Dark/Light Theme tracking for Monaco
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => observer.disconnect();
  }, []);

  // Sync user profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setUserProfile(data);
          });
      }
    });
  }, []);

  // Update query params when question or mode changes
  const handleSelectQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setQuestionSearchOpen(false);
    setSearchParams({
      mode: "problem",
      title: q.title,
      difficulty: q.difficulty,
      questionId: String(q.id)
    });
    setCode(getProblemStarterCode(q.title, language));
    setOutputLogs([]);
    setExecutionTime(null);
    setExecutionExitCode(null);
  };

  const handleModeChange = (newMode: "free" | "problem") => {
    setMode(newMode);
    if (newMode === "free") {
      setSearchParams({ mode: "free" });
      setCode(LANGUAGES[language].starterCode);
    } else {
      setSearchParams({
        mode: "problem",
        title: selectedQuestion.title,
        difficulty: selectedQuestion.difficulty,
        questionId: String(selectedQuestion.id)
      });
      setCode(getProblemStarterCode(selectedQuestion.title, language));
    }
    setOutputLogs([]);
    setExecutionTime(null);
    setExecutionExitCode(null);
  };

  // Change Language
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (mode === "problem") {
      setCode(getProblemStarterCode(selectedQuestion.title, newLang));
    } else {
      setCode(LANGUAGES[newLang].starterCode);
    }
    toast.info(`Switched to ${LANGUAGES[newLang].name}`);
  };

  // Reset Code
  const handleResetCode = () => {
    if (mode === "problem") {
      setCode(getProblemStarterCode(selectedQuestion.title, language));
    } else {
      setCode(LANGUAGES[language].starterCode);
    }
    toast.info("Code reset to default");
  };

  // Format Code
  const handleFormatCode = () => {
    if (editorRef.current) {
      try {
        editorRef.current.getAction("editor.action.formatDocument")?.run();
        toast.success("Code formatted");
      } catch {
        toast.info("Formatting not available for this language");
      }
    }
  };

  // Copy Code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  // Copy Output
  const handleCopyOutput = async () => {
    if (outputLogs.length === 0) return;
    try {
      await navigator.clipboard.writeText(outputLogs.join("\n"));
      toast.success("Output copied to clipboard");
    } catch {
      toast.error("Failed to copy output");
    }
  };

  // Run Code
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutputLogs([]);
    setHasError(false);
    setActiveConsoleTab("output");
    const startTime = performance.now();

    const captured: string[] = [];
    const onLog = (msg: string) => {
      captured.push(msg);
      setOutputLogs([...captured]);
    };

    try {
      const result = await executeCode(
        code,
        language as SupportedLanguage,
        onLog,
        undefined,
        stdinValue
      );

      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));

      if (result.error) {
        setHasError(true);
        setExecutionExitCode(1);
        if (!captured.includes(result.error)) {
          captured.push(result.error);
          setOutputLogs([...captured]);
        }
      } else {
        setHasError(false);
        setExecutionExitCode(0);
        if (captured.length === 0 && result.logs && result.logs.length > 0) {
          setOutputLogs(result.logs);
        }
      }
    } catch (err: any) {
      setHasError(true);
      setExecutionExitCode(1);
      const msg = err?.message || "Execution failed";
      setOutputLogs(prev => [...prev, `Execution error: ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution in Problem Mode
  const handleSubmit = async () => {
    await handleRun();
    if (!hasError) {
      toast.success("Solution executed successfully!");
    }
  };

  // Global Keyboard Shortcuts (Cmd+Enter or Ctrl+Enter to run)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, language, stdinValue]);

  // AI Prompt Execution
  const handleSendAiPrompt = async (customText?: string) => {
    const text = customText || aiPrompt.trim();
    if (!text || isAiThinking) return;

    const newChat = [...aiChat, { role: 'user' as const, text }];
    setAiChat(newChat);
    if (!customText) setAiPrompt("");
    setIsAiThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are an expert technical interviewer and coding mentor. The user is writing ${language} code. Be concise, direct, helpful, and insightful. Current code:\n\`\`\`${language}\n${code}\n\`\`\``
            },
            ...newChat.map(m => ({ role: m.role, content: m.text }))
          ]
        }
      });

      if (error) throw error;
      if (data?.response) {
        setAiChat(prev => [...prev, { role: 'assistant', text: data.response }]);
      } else {
        setAiChat(prev => [
          ...prev,
          { role: 'assistant', text: `Your ${LANGUAGES[language].name} code looks clean! You can ask me to analyze time complexity, suggest optimizations, or spot edge cases.` }
        ]);
      }
    } catch (e: any) {
      setAiChat(prev => [
        ...prev,
        { role: 'assistant', text: `I reviewed your code. Key advice: Ensure base conditions and boundary checks are handled properly.` }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Difficulty badge styling
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "Easy":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">Easy</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15">Medium</Badge>;
      case "Hard":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/15">Hard</Badge>;
      default:
        return <Badge variant="secondary">{diff}</Badge>;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans select-none">
        {/* ========================================================================= */}
        {/* TOP NAVBAR: CLEAN, MINIMAL & MATCHING VOKE DESIGN SYSTEM */}
        {/* ========================================================================= */}
        <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img
                src="/images/voke_logo.png"
                alt="Voke"
                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-base tracking-tight text-foreground">Voke</span>
            </div>

            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-xs font-semibold text-muted-foreground">Playground</span>
          </div>

          {/* Center: Clean Segmented Mode Selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => handleModeChange("free")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mode === "free"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Free Code
            </button>
            <button
              onClick={() => handleModeChange("problem")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mode === "problem"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Problem Practice
            </button>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select
              value={language}
              onValueChange={(val) => handleLanguageChange(val as Language)}
            >
              <SelectTrigger className="h-8 w-32 bg-card border-border text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {Object.values(LANGUAGES).map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-xs">
                    <span className="mr-1.5">{l.icon}</span>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Layout Toggle (Free Code Mode) */}
            {mode === "free" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setLayoutDirection(d => d === "horizontal" ? "vertical" : "horizontal")}
                  >
                    {layoutDirection === "horizontal" ? <Rows className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Switch to {layoutDirection === "horizontal" ? "vertical" : "horizontal"} layout
                </TooltipContent>
              </Tooltip>
            )}

            {/* Reset Code */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleResetCode}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Reset code template
              </TooltipContent>
            </Tooltip>

            {/* AI Assistant Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border hover:bg-muted"
              onClick={() => setIsAiOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>AI Assistant</span>
            </Button>

            {/* Run Button */}
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="h-8 px-3.5 gap-1.5 text-xs font-semibold shadow-sm"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Run</span>
              <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-primary-foreground/20 text-primary-foreground rounded text-[10px] font-mono">
                ⌘↵
              </kbd>
            </Button>

            {/* Submit Button (Problem Mode) */}
            {mode === "problem" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSubmit}
                disabled={isRunning}
                className="h-8 px-3 text-xs font-semibold"
              >
                Submit
              </Button>
            )}

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <Avatar
              onClick={() => navigate("/profile")}
              className="w-8 h-8 border border-border cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
            >
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {userProfile?.full_name ? userProfile.full_name.slice(0, 2).toUpperCase() : "VK"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN PLAYGROUND BODY */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-hidden">
          {mode === "free" ? (
            /* --------------------------------------------------------------------- */
            /* FREE CODE MODE: CLEAN SPLIT EDITOR + CONSOLE */
            /* --------------------------------------------------------------------- */
            <ResizablePanelGroup direction={layoutDirection} className="h-full w-full">
              {/* Editor Panel */}
              <ResizablePanel orientation={layoutDirection} defaultSize={layoutDirection === "horizontal" ? 60 : 65} minSize={30}>
                <div className="h-full flex flex-col bg-card overflow-hidden">
                  {/* Editor Top Bar */}
                  <div className="h-9 px-3 border-b border-border bg-card flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted/60 border border-border text-xs font-medium text-foreground">
                        <span>{LANGUAGES[language].icon}</span>
                        <span>{LANGUAGES[language].fileName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleFormatCode}
                            className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors text-xs flex items-center gap-1"
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Format</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Format Document</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleCopyCode}
                            className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors text-xs flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Copy</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Copy Code</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Monaco Code Editor */}
                  <div className="flex-1 relative overflow-hidden">
                    <Editor
                      height="100%"
                      language={LANGUAGES[language].monacoLang}
                      value={code}
                      onChange={(val) => setCode(val || "")}
                      onMount={(editor) => {
                        editorRef.current = editor;
                      }}
                      theme={isDark ? "vs-dark" : "vs"}
                      options={{
                        fontSize: 13.5,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                        lineNumbers: "on",
                        lineNumbersMinChars: 3,
                        tabSize: 4,
                        padding: { top: 12, bottom: 12 },
                        renderLineHighlight: "all",
                        smoothScrolling: true
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Console / Output Panel */}
              <ResizablePanel orientation={layoutDirection} defaultSize={layoutDirection === "horizontal" ? 40 : 35} minSize={20}>
                <div className="h-full flex flex-col bg-card overflow-hidden">
                  {/* Console Header Bar */}
                  <div className="h-9 px-3 border-b border-border bg-card flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
                        <button
                          onClick={() => setActiveConsoleTab("output")}
                          className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
                            activeConsoleTab === "output"
                              ? "bg-card text-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Output
                        </button>
                        <button
                          onClick={() => setActiveConsoleTab("stdin")}
                          className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
                            activeConsoleTab === "stdin"
                              ? "bg-card text-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Input (stdin)
                        </button>
                      </div>

                      {/* Execution Status Badge */}
                      {executionTime !== null && (
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${hasError ? "text-rose-500" : "text-emerald-500"}`}>
                          {hasError ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{executionTime}ms (exit {executionExitCode ?? 0})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      {activeConsoleTab === "output" && outputLogs.length > 0 && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={handleCopyOutput}
                                className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Copy output</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setOutputLogs([])}
                                className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Clear output</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Console Body */}
                  <div className="flex-1 overflow-hidden flex flex-col bg-muted/20 dark:bg-black/25">
                    {activeConsoleTab === "output" ? (
                      outputLogs.length === 0 && !isRunning ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2 p-6 text-center select-none">
                          <Terminal className="w-7 h-7 opacity-30 stroke-[1.5]" />
                          <p>Run your code with <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[11px] font-mono">⌘+Enter</kbd> or click <strong>Run</strong> to see execution output.</p>
                        </div>
                      ) : (
                        <div className="flex-1 p-3.5 font-mono text-xs overflow-y-auto space-y-1 select-text">
                          {outputLogs.map((line, idx) => (
                            <div
                              key={idx}
                              className={`leading-relaxed whitespace-pre-wrap ${
                                line.toLowerCase().includes("error") || line.toLowerCase().includes("traceback") || line.startsWith("[stderr]")
                                  ? "text-rose-500 font-semibold"
                                  : "text-foreground"
                              }`}
                            >
                              {line}
                            </div>
                          ))}
                          {isRunning && (
                            <div className="flex items-center gap-2 text-primary font-sans text-xs py-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Executing program...</span>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="h-full p-3 flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground">Standard input passed to program via stdin:</span>
                        <Textarea
                          placeholder="Type input data here (each line passed to input() / stdin)..."
                          value={stdinValue}
                          onChange={(e) => setStdinValue(e.target.value)}
                          className="flex-1 bg-card border-border font-mono text-xs resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            /* --------------------------------------------------------------------- */
            /* PROBLEM PRACTICE MODE: PROBLEM DESCRIPTION + EDITOR + CONSOLE */
            /* --------------------------------------------------------------------- */
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              {/* Left Column: Problem Statement */}
              <ResizablePanel defaultSize={38} minSize={25}>
                <div className="h-full flex flex-col bg-card border-r border-border overflow-y-auto">
                  {/* Problem Top Header & Selector */}
                  <div className="p-4 border-b border-border space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {/* Search / Select Question Popover */}
                      <Popover open={questionSearchOpen} onOpenChange={setQuestionSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 text-xs font-semibold border-border max-w-[240px] justify-between"
                          >
                            <span className="truncate">{selectedQuestion.title}</span>
                            <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 bg-popover border-border" align="start">
                          <Command>
                            <CommandInput placeholder="Search 200+ DSA problems..." className="h-9 text-xs" />
                            <CommandList className="max-h-64">
                              <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">No problem found.</CommandEmpty>
                              <CommandGroup heading="Questions">
                                {QUESTIONS.slice(0, 40).map((q) => (
                                  <CommandItem
                                    key={q.id}
                                    value={q.title}
                                    onSelect={() => handleSelectQuestion(q)}
                                    className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {selectedQuestion.id === q.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                      <span className="truncate">{q.title}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{q.difficulty}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="flex items-center gap-2">
                        {getDifficultyBadge(selectedQuestion.difficulty)}
                        {selectedQuestion.url && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={selectedQuestion.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">View on {selectedQuestion.platform}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <h1 className="text-lg font-bold text-foreground tracking-tight">
                      {selectedQuestion.title}
                    </h1>

                    {/* Tags & Companies */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedQuestion.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-muted/80 border border-border text-[11px] font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {selectedQuestion.companies?.slice(0, 3).map((comp, idx) => (
                        <span
                          key={`c-${idx}`}
                          className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Problem Description Details */}
                  <div className="p-4 space-y-4 text-xs leading-relaxed text-foreground/90">
                    <div className="space-y-2">
                      <h2 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">Description</h2>
                      <p>
                        Solve the algorithm problem for <strong className="text-foreground">{selectedQuestion.title}</strong>. Write an optimal solution handling all edge cases.
                      </p>
                    </div>

                    {/* Example block */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-xs text-foreground">Example 1:</span>
                      <div className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-[11.5px] space-y-1">
                        <div><strong className="text-foreground">Input:</strong> [Sample test case input]</div>
                        <div><strong className="text-foreground">Output:</strong> [Expected output result]</div>
                      </div>
                    </div>

                    {/* Constraints */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-xs text-foreground">Constraints:</span>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Time Complexity: Optimal O(N) or O(N log N)</li>
                        <li>Space Complexity: O(1) auxiliary or O(N)</li>
                        <li>Inputs contain valid non-null structures unless specified.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right Column: Code Editor + Test Output */}
              <ResizablePanel defaultSize={62} minSize={30}>
                <ResizablePanelGroup direction="vertical" className="h-full w-full">
                  {/* Editor */}
                  <ResizablePanel defaultSize={65} minSize={25}>
                    <div className="h-full flex flex-col bg-card overflow-hidden">
                      <div className="h-9 px-3 border-b border-border bg-card flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted/60 border border-border text-xs font-medium text-foreground">
                            <span>{LANGUAGES[language].icon}</span>
                            <span>solution.{LANGUAGES[language].fileName.split('.').pop()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={handleFormatCode}
                                className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors text-xs flex items-center gap-1"
                              >
                                <AlignLeft className="w-3.5 h-3.5" />
                                <span className="hidden md:inline text-[11px]">Format</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Format Document</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={handleCopyCode}
                                className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors text-xs flex items-center gap-1"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden md:inline text-[11px]">Copy</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Copy Code</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex-1 relative overflow-hidden">
                        <Editor
                          height="100%"
                          language={LANGUAGES[language].monacoLang}
                          value={code}
                          onChange={(val) => setCode(val || "")}
                          onMount={(editor) => {
                            editorRef.current = editor;
                          }}
                          theme={isDark ? "vs-dark" : "vs"}
                          options={{
                            fontSize: 13.5,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                            lineNumbers: "on",
                            tabSize: 4,
                            padding: { top: 12, bottom: 12 },
                            renderLineHighlight: "all"
                          }}
                        />
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Test Results / Console */}
                  <ResizablePanel defaultSize={35} minSize={20}>
                    <div className="h-full flex flex-col bg-card overflow-hidden">
                      <div className="h-9 px-3 border-b border-border bg-card flex items-center justify-between shrink-0">
                        <span className="text-xs font-semibold text-foreground">Console & Test Output</span>
                        {executionTime !== null && (
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${hasError ? "text-rose-500" : "text-emerald-500"}`}>
                            {hasError ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>{executionTime}ms (exit {executionExitCode ?? 0})</span>
                          </span>
                        )}
                      </div>

                      <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-muted/20 dark:bg-black/25">
                        {outputLogs.length === 0 && !isRunning ? (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1.5 p-4 text-center select-none">
                            <Code2 className="w-6 h-6 opacity-30 stroke-[1.5]" />
                            <span>Click 'Run' or press ⌘+Enter to execute solution.</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {outputLogs.map((log, idx) => (
                              <div key={idx} className={`leading-relaxed whitespace-pre-wrap ${log.includes("Error") ? "text-rose-500 font-semibold" : "text-foreground"}`}>
                                {log}
                              </div>
                            ))}
                            {isRunning && (
                              <div className="flex items-center gap-2 text-primary font-sans text-xs py-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Running solution against inputs...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>

        {/* ========================================================================= */}
        {/* OPTIONAL AI ASSISTANT SLIDE-OVER SHEET (DISTRACTION-FREE) */}
        {/* ========================================================================= */}
        <Sheet open={isAiOpen} onOpenChange={setIsAiOpen}>
          <SheetContent className="w-full sm:max-w-md bg-card border-border flex flex-col p-0">
            <SheetHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <SheetTitle className="text-base font-bold text-foreground">AI Code Assistant</SheetTitle>
              </div>
              <SheetDescription className="text-xs text-muted-foreground">
                Ask questions, review logic, or analyze complexity for your code.
              </SheetDescription>
            </SheetHeader>

            {/* Quick Prompt Chips */}
            <div className="p-3 border-b border-border flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendAiPrompt("Explain this code step-by-step and summarize how it works.")}
                className="px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border"
              >
                Explain Code
              </button>
              <button
                onClick={() => handleSendAiPrompt("What is the time and space complexity of this code?")}
                className="px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border"
              >
                Complexity Analysis
              </button>
              <button
                onClick={() => handleSendAiPrompt("Are there any edge cases or potential bugs in this code?")}
                className="px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border"
              >
                Find Bugs & Edge Cases
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {aiChat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6 gap-2">
                  <Sparkles className="w-8 h-8 opacity-30 text-primary" />
                  <p>Click a quick prompt above or type a question about your code below.</p>
                </div>
              ) : (
                aiChat.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-6 shadow-sm"
                        : "bg-muted/70 text-foreground mr-4 border border-border"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))
              )}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-primary text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <Textarea
                placeholder="Ask anything about your code..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAiPrompt();
                  }
                }}
                rows={2}
                className="resize-none bg-background border-border text-xs"
              />
              <Button
                size="icon"
                disabled={isAiThinking || !aiPrompt.trim()}
                onClick={() => handleSendAiPrompt()}
                className="h-full px-3 self-stretch"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
};

export default Playground;
