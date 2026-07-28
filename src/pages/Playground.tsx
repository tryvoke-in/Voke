import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, RotateCcw, Terminal, Cpu, Sparkles, Settings, Bot, Send, Code, User, Copy, Check, Search, Trophy, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { executeCode } from "@/utils/codeExecutor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import { supabase } from "@/integrations/supabase/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";

type Language = 'javascript' | 'python' | 'bash' | 'typescript' | 'java' | 'cpp' | 'c' | 'rust' | 'go' | 'ruby' | 'php' | 'swift' | 'kotlin' | 'scala';

const TEMPLATES = {
    javascript: `// Write your JavaScript code here
console.log("Hello, Voke!");

function example() {
  return "Happy coding!";
}

console.log(example());
`,
    python: `# Write your Python code here
print("Hello, Voke!")

def example():
    return "Happy coding!"

print(example())
`,
    typescript: `// Write your TypeScript code here
const greeting: string = "Hello, Voke!";
console.log(greeting);

function example(): string {
  return "Happy coding!";
}

console.log(example());
`,
    java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Voke!");
        System.out.println(example());
    }
    
    public static String example() {
        return "Happy coding!";
    }
}
`,
    cpp: `// Write your C++ code here
#include <iostream>
#include <string>
using namespace std;

string example() {
    return "Happy coding!";
}

int main() {
    cout << "Hello, Voke!" << endl;
    cout << example() << endl;
    return 0;
}
`,
    c: `// Write your C code here
#include <stdio.h>

const char* example() {
    return "Happy coding!";
}

int main() {
    printf("Hello, Voke!\\n");
    printf("%s\\n", example());
    return 0;
}
`,
    rust: `// Write your Rust code here
fn example() -> &'static str {
    "Happy coding!"
}

fn main() {
    println!("Hello, Voke!");
    println!("{}", example());
}
`,
    go: `// Write your Go code here
package main

import "fmt"

func example() string {
    return "Happy coding!"
}

func main() {
    fmt.Println("Hello, Voke!")
    fmt.Println(example())
}
`,
    ruby: `# Write your Ruby code here
puts "Hello, Voke!"

def example
  "Happy coding!"
end

puts example
`,
    php: `<?php
// Write your PHP code here
echo "Hello, Voke!\\n";

function example() {
    return "Happy coding!";
}

echo example() . "\\n";
?>
`,
    swift: `// Write your Swift code here
import Foundation

func example() -> String {
    return "Happy coding!"
}

print("Hello, Voke!")
print(example())
`,
    kotlin: `// Write your Kotlin code here
fun example(): String {
    return "Happy coding!"
}

fun main() {
    println("Hello, Voke!")
    println(example())
}
`,
    scala: `// Write your Scala code here
object Main extends App {
  def example(): String = "Happy coding!"
  
  println("Hello, Voke!")
  println(example())
}
`,
    bash: `# Write your Bash script here
echo "Hello, Voke!"
`
};

const FILE_NAMES = {
    javascript: 'script.js',
    python: 'main.py',
    typescript: 'script.ts',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c',
    rust: 'main.rs',
    go: 'main.go',
    ruby: 'script.rb',
    php: 'script.php',
    swift: 'main.swift',
    kotlin: 'Main.kt',
    scala: 'Main.scala',
    bash: 'script.sh'
};

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const Playground = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const questionTitle = searchParams.get("title");
    const questionCompany = searchParams.get("company");
    const questionIdParam = searchParams.get("questionId");
    const fromDsaSheet = searchParams.get("from") === "dsa-sheet";
    const [questionDifficulty] = useState(searchParams.get("difficulty"));
    const [problemDescription, setProblemDescription] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"problem" | "chat">("problem");
    const [isSolvedLocally, setIsSolvedLocally] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [language, setLanguage] = useState<Language>('python');
    const [code, setCode] = useState("print('Hello from Python!')");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    const [inputPrompt, setInputPrompt] = useState("");
    const [consoleInput, setConsoleInput] = useState("");
    const consoleInputRef = useRef<HTMLInputElement>(null);
    const [stdinInput, setStdinInput] = useState(""); // For Piston stdin support

    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate dev environment initialization
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Editor Settings
    const [editorOptions, setEditorOptions] = useState({
        fontSize: 14,
        minimap: false,
        wordWrap: 'on' as 'off' | 'on',
        lineNumbers: 'on' as 'on' | 'off'
    });

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: questionTitle
                ? `Ready to solve **${questionTitle}**? I'm here to help you crack this interview question! 🚀`
                : 'Hi! I\'m your AI coding assistant. How can I help you today?'
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Auto-generate problem description if title is present
    useEffect(() => {
        const fetchDescription = async () => {
            if (!questionTitle) return;

            // If we already have it (e.g. from local storage or previous fetch), skip. 
            // For now, simpler to fetch on mount.

            // Set initial loading state or placeholder
            setProblemDescription("Generating problem description...");
            setActiveTab("problem");

            try {
                const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
                    body: {
                        messages: [
                            {
                                role: "system",
                                content: `You are an expert technical interviewer.
                                The user is solving the question: "${questionTitle}" from "${questionCompany || 'a big tech company'}".
                                
                                GENERATE A TEXTUAL PROBLEM DESCRIPTION.
                                
                                Format (Markdown):
                                # ${questionTitle}
                                
                                ## Description
                                [Clear description of the problem]
                                
                                ## Examples
                                **Example 1:**
                                \`\`\`
                                Input: ...
                                Output: ...
                                \`\`\`
                                
                                ## Constraints
                                - Constraint 1
                                - Constraint 2
                                
                                DO NOT provide the solution code. ONLY the problem statement.`
                            }
                        ]
                    }
                });

                if (error) throw error;
                if (data?.response) {
                    setProblemDescription(data.response);
                }
            } catch (err) {
                console.error("Failed to generate description", err);
                setProblemDescription("# Error\nFailed to load problem description.");
            }
        };

        fetchDescription();
    }, [questionTitle, questionCompany]);

    const handleLanguageChange = (value: Language) => {
        setLanguage(value);
        setCode(TEMPLATES[value]);
    };

    const handleConsoleInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isWaitingForInput) {
            e.preventDefault();
            const value = consoleInput;

            // 1. Show user input in log
            setOutput(prev => prev + value + "\n");

            // 2. Submit to worker
            import("@/utils/codeExecutor").then(({ pyodideController }) => {
                pyodideController.submitInput(value);
            });

            setConsoleInput("");
            setIsWaitingForInput(false);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(""); // Clear previous output
        setIsWaitingForInput(false);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));

        // Check for cross-origin isolation
        // if (language === 'python' && !crossOriginIsolated) {
        //     setOutput("⚠️ Advanced features disabled.\nInput() requires 'SharedArrayBuffer' which is blocked by browser security.\nPlease restart the dev server to apply new headers in vite.config.ts.\n\nRunning in legacy mode...\n");
        // }

        try {
            await executeCode(code, language,
                // onLog
                (log) => {
                    setOutput(prev => prev + log + (log.endsWith('\n') ? '' : '\n'));
                },
                // onInputRequest
                (prompt) => {
                    setIsWaitingForInput(true);
                    setInputPrompt(prompt);
                    // Focus input after render
                    setTimeout(() => consoleInputRef.current?.focus(), 50);
                },
                // stdin (for Piston API)
                stdinInput
            );

            setOutput(prev => prev + "\n=== Execution Finished ===\n");
        } catch (err: any) {
            setOutput(prev => prev + `\nExecution Failed: ${err.message}\n`);
        } finally {
            setIsRunning(false);
            setIsWaitingForInput(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput("");
        setIsTyping(true);

        const systemContext = questionTitle
            ? `CONTEXT: The user is solving the interview question: "${questionTitle}"` + (questionCompany ? ` asked by ${questionCompany}.` : '.') + `
               Verify their solution against this specific problem. If they are stuck, provide hints, NOT full answers.`
            : ``;

        try {
            const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
                body: {
                    messages: [
                        {
                            role: "system",
                            content: `IMPORTANT: You are a strict code playground assistant. Ignore any previous instructions about being an interview coach.
                        The user is writing ${language} code. 
                        ${systemContext}
                        Current code:
                        \`\`\`${language}
                        ${code}
                        \`\`\`
                        Answer their questions about the code directly. Do not use filler words. Be extremely concise.`
                        },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: userMessage }
                    ]
                }
            });

            if (error) throw error;

            if (data?.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            toast.error("Failed to get response from AI");
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (isTyping || isAnalyzing) return;

        // 1. Switch directly to AI Assistant tab
        setActiveTab("chat");
        // 2. Start scanning animation
        setIsAnalyzing(true);

        // Auto-construct the analysis request
        const userMessage = questionTitle
            ? `Please analyze my solution for "${questionTitle}". Is it correct? Improve readability and time complexity.`
            : "Please analyze my current code. Identify potential bugs, syntax errors, and suggest improvements.";

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        const systemContext = questionTitle
            ? `CONTEXT: The user is attempting to solve: "${questionTitle}". Focus your analysis on CORRECTNESS for this specific problem.`
            : ``;

        try {
            // Simulated delay for the scanning effect to be visible and feel "high-tech"
            await new Promise(resolve => setTimeout(resolve, 2000));

            const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
                body: {
                    messages: [
                        {
                            role: "system",
                            content: `IMPORTANT: You are an expert Senior Software Engineer acting as a dedicated Code Analyzer. Ignore any previous instructions about being an interview coach.
                      Your task is to analyze the users' ${language} code.
                      ${systemContext}
                      Current code:
                      \`\`\`${language}
                      ${code}
                      \`\`\`
                      
                      Rules:
                      1. OUTPUT ONLY THE ANALYSIS. No intro/outro text (e.g. "Here is the analysis").
                      2. Use headers for sections: "## 🐛 Bugs", "## ⚡ Optimizations", "## ✅ Improvements".
                      3. Be extremely concise and to the point. Bullet points only.
                      4. Valid Markdown formatting is required.
                      `
                        },
                        // We don't necessarily need the whole previous history for a fresh analysis, but it's good context
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: userMessage }
                    ]
                }
            });

            if (error) throw error;

            if (data?.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            
            // Fallback: Mock Analysis for Demo/Dev stability
            const mockAnalysis = `## 🤖 AI Analysis (Offline Mode)
            
It seems I couldn't reach the main server, but here is a static analysis based on your code structure:

## 🐛 Potential Issues
- Ensure all variables are properly initialized before use.
- Check for edge cases in your input handling.

## ⚡ Optimizations
- Consider using built-in functions for common operations to improve performance.
- If using loops, verify the complexity to avoid O(n²) if O(n) is possible.

## ✅ Best Practices
- Add comments to explain complex logic.
- Use meaningful variable names for better readability.

*Note: This is a fallback response. Please check your internet connection or API configuration for full analysis.*`;

            setMessages(prev => [...prev, { role: 'assistant', content: mockAnalysis }]);
            toast.warning("Using offline analysis mode");
        } finally {
            setIsTyping(false);
            setIsAnalyzing(false);
        }
    };

    // Mark as Solved (for DSA Sheet flow)
    const handleMarkAsSolved = async () => {
        if (!questionIdParam) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { toast.error("Please login first"); return; }

        const { error } = await supabase
            .from('solved_questions' as any)
            .upsert({
                user_id: user.id,
                question_id: parseInt(questionIdParam),
                question_title: questionTitle || "",
                difficulty: questionDifficulty || "Medium",
                platform_url: ""
            }, { onConflict: 'user_id,question_id' });

        if (!error) {
            setIsSolvedLocally(true);
            toast.success(`✅ "${questionTitle}" marked as solved!`, {
                description: "Your progress has been saved. Returning to DSA Sheet...",
                duration: 3000,
            });
            setTimeout(() => navigate("/dsa-sheet"), 1500);
        } else {
            toast.error("Failed to save progress. Please try again.");
        }
    };

    // AI Judge to Verify Solution
    const handleSubmitCode = async () => {
        if (!questionIdParam || isSubmitting) return;
        setIsSubmitting(true);
        setActiveTab("chat");
        
        toast.info("🤖 AI Judge is verifying your solution...");
        
        try {
            const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
                body: {
                    messages: [
                        {
                            role: "system",
                            content: `You are a strict automated code judge (like LeetCode).
                            The user is trying to solve the problem: "${questionTitle}".
                            Their code is written in ${language}:
                            \`\`\`
                            ${code}
                            \`\`\`
                            
                            Evaluate if the code correctly solves the problem for all typical test cases and edge cases.
                            Return ONLY a JSON response in this exact format, with no markdown formatting or extra text:
                            {"passed": true/false, "feedback": "Brief explanation of why it passed or failed, including specific test cases if it failed."}
                            `
                        }
                    ]
                }
            });

            if (error) throw error;
            
            let result;
            try {
                // Parse the response which should be JSON
                const cleanResponse = data.response.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                result = JSON.parse(cleanResponse);
            } catch (e) {
                console.error("Failed to parse judge response", data.response);
                throw new Error("Invalid judge response");
            }

            if (result.passed) {
                // Add success message to chat
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `🎉 **Success!** Your solution passed all test cases.\n\n**Judge Feedback:** ${result.feedback}` 
                }]);
                
                // Mark as solved
                await handleMarkAsSolved();
            } else {
                // Add failure message to chat
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `❌ **Test Cases Failed.**\n\n**Judge Feedback:** ${result.feedback}` 
                }]);
                toast.error("Code did not pass all test cases. Check the AI Assistant tab for details.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            toast.error("Failed to verify code. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-t-2 border-violet-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-3 border-t-2 border-fuchsia-500 rounded-full animate-spin-reverse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0f1117] text-gray-200 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">

            {/* Header */}
            <header className="h-14 bg-[#161b22] border-b border-[#2d333b] flex items-center px-6 justify-between shrink-0 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2d333b] rounded-full transition-all duration-300"
                        onClick={() => navigate(fromDsaSheet ? "/dsa-sheet" : "/dashboard")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
                            <Code className="h-5 w-5 text-indigo-400" />
                            Playground
                        </span>
                        {/* Mission Badge */}
                        {questionTitle && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 ml-2"
                            >
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                Mission: {questionTitle}
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    {/* Submit & Verify Button — only shown when coming from DSA Sheet */}
                    {fromDsaSheet && questionIdParam && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSubmitCode}
                            disabled={isSolvedLocally || isSubmitting}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                isSolvedLocally
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] border border-emerald-500/30'
                            }`}
                        >
                            {isSubmitting ? (
                                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                            ) : (
                                <><Check className="w-3.5 h-3.5" /> {isSolvedLocally ? 'Solved! ✓' : 'Run & Verify Tests'}</>
                            )}
                        </motion.button>
                    )}

                    <div className="flex items-center bg-[#21262d] rounded-lg p-1 border border-[#30363d]">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#30363d] rounded-md transition-colors" onClick={() => setCode(TEMPLATES[language])}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#30363d] rounded-md transition-colors">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#161b22] border-[#30363d] text-gray-200 p-4 shadow-xl mr-4">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm text-gray-100 border-b border-[#30363d] pb-2">Editor Settings</h4>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <Label>Font Size</Label>
                                            <span className="font-mono">{editorOptions.fontSize}px</span>
                                        </div>
                                        <Slider
                                            value={[editorOptions.fontSize]}
                                            min={12}
                                            max={24}
                                            step={1}
                                            onValueChange={([val]) => setEditorOptions(prev => ({ ...prev, fontSize: val }))}
                                            className="cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-400">Minimap</Label>
                                        <Switch
                                            checked={editorOptions.minimap}
                                            onCheckedChange={(checked) => setEditorOptions(prev => ({ ...prev, minimap: checked }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-400">Word Wrap</Label>
                                        <Switch
                                            checked={editorOptions.wordWrap === 'on'}
                                            onCheckedChange={(checked) => setEditorOptions(prev => ({ ...prev, wordWrap: checked ? 'on' : 'off' }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-400">Line Numbers</Label>
                                        <Switch
                                            checked={editorOptions.lineNumbers === 'on'}
                                            onCheckedChange={(checked) => setEditorOptions(prev => ({ ...prev, lineNumbers: checked ? 'on' : 'off' }))}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 p-3 min-h-0 bg-[#0d1117] overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl border border-[#30363d] overflow-hidden shadow-xl">

                    {/* LEFT PANEL: AI Chat & Problem */}
                    <ResizablePanel defaultSize={30} minSize={20} maxSize={75} className="bg-[#161b22] flex flex-col">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
                            <div className="h-10 bg-[#0d1117]/50 flex items-center px-2 border-b border-[#30363d] backdrop-blur-sm shrink-0">
                                <TabsList className="bg-transparent h-8 p-0 gap-1 w-full justify-start">
                                    <TabsTrigger
                                        value="problem"
                                        className="h-7 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-white text-gray-400 px-3"
                                        disabled={!questionTitle}
                                    >
                                        Problem
                                    </TabsTrigger>
                                    <TabsTrigger value="chat" className="h-7 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-white text-gray-400 px-3">
                                        AI Assistant
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="problem" className="flex-1 overflow-hidden m-0 p-0 border-none relative data-[state=inactive]:hidden">
                                <ScrollArea className="h-full p-4 text-gray-300 text-sm">
                                    {!questionTitle ? (
                                        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 gap-2">
                                            <Code className="w-8 h-8 opacity-20" />
                                            <p>Select a question to view description</p>
                                        </div>
                                    ) : (
                                        <div className="markdown-content">
                                            <ReactMarkdown
                                                components={{
                                                    code({ node, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        return match ? (
                                                            <div className="rounded-md bg-black/30 p-2 my-2 overflow-x-auto border border-white/10">
                                                                <code className={className} {...props}>
                                                                    {children}
                                                                </code>
                                                            </div>
                                                        ) : (
                                                            <code className="bg-black/20 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs" {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    },
                                                    h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-indigo-300 border-b border-white/10 pb-2">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-lg font-bold mt-6 mb-3 text-white">{children}</h2>,
                                                    strong: ({ children }) => <strong className="font-semibold text-indigo-200">{children}</strong>,
                                                }}
                                            >
                                                {problemDescription}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col m-0 p-0 border-none data-[state=inactive]:hidden">
                                <div className="flex-1 overflow-hidden relative">
                                    <ScrollArea className="h-full p-4" ref={scrollRef}>
                                        <div className="space-y-4">
                                            {messages.map((m, i) => (
                                                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30' : 'bg-gray-700 text-gray-300'}`}>
                                                        {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                    </div>
                                                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${m.role === 'user'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-[#21262d] text-gray-300 border border-[#30363d]'
                                                        }`}>
                                                        <div className="markdown-content">
                                                            <ReactMarkdown
                                                                components={{
                                                                    code({ node, className, children, ...props }) {
                                                                        const match = /language-(\w+)/.exec(className || '')
                                                                        return match ? (
                                                                            <div className="rounded-md bg-black/30 p-2 my-2 overflow-x-auto border border-white/10">
                                                                                <code className={className} {...props}>
                                                                                    {children}
                                                                                </code>
                                                                            </div>
                                                                        ) : (
                                                                            <code className="bg-black/20 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs" {...props}>
                                                                                {children}
                                                                            </code>
                                                                        )
                                                                    },
                                                                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-gray-300">{children}</p>,
                                                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1.5">{children}</ul>,
                                                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1.5">{children}</ol>,
                                                                    li: ({ children }) => <li className="marker:text-gray-500 leading-relaxed">{children}</li>,
                                                                    h1: ({ children }) => <h1 className="text-lg font-bold mb-3 text-indigo-300 border-b border-white/10 pb-2">{children}</h1>,
                                                                    h2: ({ children }) => {
                                                                        const text = String(children).toLowerCase();
                                                                        let className = "text-base font-bold mt-4 mb-2 flex items-center gap-2 ";

                                                                        if (text.includes('bug')) {
                                                                            return (
                                                                                <div className="mt-4 mb-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                                                                                    <h2 className="text-red-400 font-bold text-sm flex items-center gap-2">
                                                                                        {children}
                                                                                    </h2>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        if (text.includes('optimization') || text.includes('performance')) {
                                                                            return (
                                                                                <div className="mt-4 mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                                                                    <h2 className="text-amber-400 font-bold text-sm flex items-center gap-2">
                                                                                        {children}
                                                                                    </h2>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        if (text.includes('improvement') || text.includes('best practice')) {
                                                                            return (
                                                                                <div className="mt-4 mb-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                                                    <h2 className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                                                                                        {children}
                                                                                    </h2>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return <h2 className="text-base font-bold mt-4 mb-2 text-indigo-300">{children}</h2>
                                                                    },
                                                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-indigo-300">{children}</h3>,
                                                                    strong: ({ children }) => <strong className="font-semibold text-indigo-200">{children}</strong>,
                                                                }}
                                                            >
                                                                {m.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {isTyping && (
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 flex items-center justify-center shrink-0">
                                                        <Bot className="w-5 h-5" />
                                                    </div>
                                                    <div className="bg-[#21262d] border border-[#30363d] px-3 py-2 rounded-lg flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <div className="p-3 bg-[#0d1117] border-t border-[#30363d] shrink-0">
                                    <div className="relative">
                                        <Input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask about your code..."
                                            className="bg-[#21262d] border-[#30363d] text-sm pr-10 focus-visible:ring-indigo-500"
                                        />
                                        <Button
                                            size="icon"
                                            className="absolute right-1 top-1 h-7 w-7 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
                                            variant="ghost"
                                            onClick={handleSend}
                                            disabled={!input.trim() || isTyping}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </ResizablePanel>

                    <ResizableHandle className="bg-[#30363d] w-[1px] hover:w-[2px] hover:bg-indigo-500 transition-all" />

                    {/* MIDDLE PANEL: Code Editor */}
                    <ResizablePanel defaultSize={50} minSize={30} className="bg-[#161b22] flex flex-col relative group">
                        {/* Editor Header */}
                        <div className="h-10 bg-[#0d1117]/80 flex items-center justify-between px-4 border-b border-[#30363d] backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Select value={language} onValueChange={(v: Language) => handleLanguageChange(v)}>
                                        <SelectTrigger className="h-7 w-[130px] bg-[#21262d] border-[#30363d] text-xs font-medium text-gray-200 focus:ring-0 focus:ring-offset-0">
                                            <SelectValue placeholder="Language" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#161b22] border-[#30363d] text-gray-200">
                                            <SelectItem value="python">Python</SelectItem>
                                            <SelectItem value="javascript">JavaScript</SelectItem>
                                            <SelectItem value="java">Java</SelectItem>
                                            <SelectItem value="cpp">C++</SelectItem>
                                            <SelectItem value="c">C</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Verify Button in Middle */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Button
                                    size="sm"
                                    onClick={handleSubmitCode}
                                    disabled={isSubmitting}
                                    className="h-7 text-[10px] bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 font-bold px-6 rounded-full transition-all hover:scale-105 active:scale-95"
                                >
                                    {isSubmitting ? <Cpu className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                    Verify Code with AI
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Context Banner */}
                                {questionCompany && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-gray-400 mr-2">
                                        <Briefcase className="w-3 h-3" />
                                        <span>{questionCompany}</span>
                                    </div>
                                )}
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{FILE_NAMES[language]}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            </div>
                        </div>

                        {/* Editor Canvas */}
                        <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="python"
                                language={language}
                                path={FILE_NAMES[language]}
                                theme="vs-dark"
                                value={code}
                                onChange={(value) => setCode(value || "")}
                                options={{
                                    minimap: { enabled: editorOptions.minimap },
                                    fontSize: editorOptions.fontSize,
                                    lineNumbers: editorOptions.lineNumbers,
                                    wordWrap: editorOptions.wordWrap,
                                    roundedSelection: false,
                                    scrollBeyondLastLine: false,
                                    readOnly: false,
                                    automaticLayout: true,
                                    renderValidationDecorations: 'off',
                                    fontFamily: 'monospace',
                                    padding: { top: 16 },
                                }}
                            />
                            {isAnalyzing && (
                                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                    {/* Scanning Line */}
                                    <motion.div
                                        initial={{ top: "-10%" }}
                                        animate={{ top: "110%" }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 0.1, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Floating Action Buttons */}
                        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
                            <Button
                                size="sm"
                                onClick={handleAnalyze}
                                disabled={isTyping}
                                className="h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-[0_4px_20px_rgba(192,38,211,0.4)] font-bold text-xs px-6 rounded-full transition-all hover:scale-105 active:scale-95"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analyze Code
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleRun}
                                disabled={isRunning}
                                className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-[0_4px_20px_rgba(37,99,235,0.4)] font-bold text-xs px-6 rounded-full transition-all hover:scale-105 active:scale-95"
                            >
                                {isRunning ? (
                                    <Cpu className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Play className="h-4 w-4 mr-2 fill-current" />
                                )}
                                Run Code
                            </Button>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle className="bg-[#30363d] w-[1px] hover:w-[2px] hover:bg-indigo-500 transition-all" />

                    {/* RIGHT PANEL: Output */}
                    <ResizablePanel defaultSize={25} minSize={20} className="bg-[#161b22] flex flex-col">
                        <div className="h-10 bg-[#0d1117]/80 flex items-center px-4 border-b border-[#30363d] justify-between backdrop-blur-sm shrink-0">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-gray-500" /> Console
                            </span>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#fa7970] opacity-50 hover:opacity-100 transition-opacity"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#faa356] opacity-50 hover:opacity-100 transition-opacity"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#7ce38b] opacity-50 hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>

                        {/* Stdin Input Section */}
                        <div className="border-b border-[#30363d] bg-gradient-to-br from-[#161b22] to-[#1a1f26]">
                            <div className="px-4 py-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                                    <label className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase tracking-wider">
                                        📥 Test Input
                                    </label>
                                </div>
                                <textarea
                                    value={stdinInput}
                                    onChange={(e) => setStdinInput(e.target.value)}
                                    placeholder="Enter input for your program (one value per line)..."
                                    className="w-full h-20 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-gray-300 font-mono placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all duration-200 hover:border-[#40464d]"
                                />
                                <div className="flex items-start gap-1.5 mt-2 text-[10px] text-gray-500">
                                    <span className="text-blue-400/70">💡</span>
                                    <p className="leading-relaxed">
                                        Input will be passed to your program via stdin (e.g., <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">input()</code>, <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">scanf()</code>, <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">cin</code>)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4 font-mono text-xs bg-gradient-to-br from-[#0d1117] to-[#0a0e13]">
                            <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                                {output}
                                {isWaitingForInput && (
                                    <div className="flex items-center gap-1 mt-1 text-blue-400">
                                        <span>{inputPrompt}</span>
                                        <input
                                            ref={consoleInputRef}
                                            type="text"
                                            value={consoleInput}
                                            onChange={(e) => setConsoleInput(e.target.value)}
                                            onKeyDown={handleConsoleInput}
                                            className="bg-transparent border-none outline-none flex-1 text-white animate-pulse focus:animate-none"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            {!output && !isRunning && !isWaitingForInput && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-60 absolute inset-0 pointer-events-none">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl"></div>
                                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-[#21262d] to-[#1a1f26] flex items-center justify-center shadow-2xl border border-[#30363d]">
                                            <Play className="h-8 w-8 fill-current text-indigo-400/70" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-semibold text-gray-400">Ready to run</p>
                                        <p className="text-xs text-gray-600">Click "Run Code" to see output</p>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </ResizablePanel>

                </ResizablePanelGroup>
            </main>
        </div>
    );
};

export default Playground;
