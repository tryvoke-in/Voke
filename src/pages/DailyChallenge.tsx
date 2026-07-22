import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, CheckCircle2, Timer, RotateCcw, Code2, Terminal, Cpu, Sparkles, Trophy, Settings, Brain } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import Confetti from "react-confetti";

import { getDailyQuestion } from "@/data/questions";

type Language = 'javascript' | 'python' | 'bash';

const dailyQuestion = getDailyQuestion();

const TEMPLATES = {
  javascript: `/**
 * Daily Challenge: ${dailyQuestion.title}
 * Platform: ${dailyQuestion.platform}
 * 
 * Write your solution here.
 * Note: This is a sandbox environment. Run tests on the official platform.
 */

function solution() {
  // Your code here
  
}`,
  python: `# Daily Challenge: ${dailyQuestion.title}
# Platform: ${dailyQuestion.platform}
#
# Write your solution here.
# Note: This is a sandbox environment. Run tests on the official platform.

def solution():
    # Your code here
    pass`,
  bash: `# Daily Challenge: ${dailyQuestion.title}
# Platform: ${dailyQuestion.platform}
#
# Write your solution here.
`
};

const FILE_NAMES = {
  javascript: 'Solution.js',
  python: 'solution.py',
  bash: 'solution.sh'
};

import { supabase } from "@/integrations/supabase/client";
import { executeCode } from "@/utils/codeExecutor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState(TEMPLATES.javascript);
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds (mock)
  const [activeTab, setActiveTab] = useState("description");
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // AI Hints State
  const [hints, setHints] = useState<string[]>([]);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  // Editor Settings State
  const [editorOptions, setEditorOptions] = useState({
    fontSize: 14,
    minimap: false,
    wordWrap: 'off' as 'off' | 'on',
    lineNumbers: 'on' as 'on' | 'off'
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    setCode(TEMPLATES[value]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Running tests...\n");
    setTestResults([]);

    // Small delay to let UI show loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await executeCode(code, language);
    
    // Format output
    let outputText = "";
    
    if (result.logs.length > 0) {
        outputText += "Console Output:\n" + result.logs.map(l => `> ${l}`).join('\n') + "\n\n";
    }

    if (result.error) {
        outputText += `Error:\n${result.error}\n`;
    } else {
        result.results.forEach(res => {
            outputText += `> Test Case ${res.caseId}: ${res.input} -> ${res.passed ? 'Passed' : 'Failed'}\n`;
            if (!res.passed) {
                outputText += `  Expected: ${res.expected}\n  Actual:   ${res.actual}\n`;
            }
        });
        
        if (result.passed && language === 'javascript') {
            outputText += "\nAll test cases passed! Ready to submit.";
        } else if (language !== 'javascript') {
            outputText += "\n(Note: Non-JS execution is simulated)";
        }
    }

    setOutput(outputText);
    setTestResults(result.results);
    setIsRunning(false);
  };

  const handleSubmit = () => {
    if (!output.includes("All test cases passed")) {
      toast.error("Please run your code and pass all tests first!");
      return;
    }
    
    setIsSubmitted(true);
    toast.success("Challenge Completed! +50 XP");
  };

  const handleGenerateHint = async () => {
    if (isGeneratingHint) return;
    
    setIsGeneratingHint(true);
    try {
        const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
            body: {
                messages: [
                    {
                        role: "user",
                        content: `I am solving the "${dailyQuestion.title}" problem. 
                        My current code in ${language} is:
                        ${code}
                        
                        Please give me a small, conceptual hint to help me move forward. Do NOT give me the full solution code. Keep it brief and encouraging.`
                    }
                ],
                userContext: "You are a helpful coding tutor. Provide hints, not solutions."
            }
        });

        if (error) throw error;
        
        if (data?.response) {
            setHints(prev => [...prev, data.response]);
            toast.success("New hint generated!");
        }
    } catch (error) {
        console.error("Error generating hint:", error);
        toast.error("Failed to generate hint. Please try again.");
    } finally {
        setIsGeneratingHint(false);
    }
  };

  return (
    <div className="h-screen bg-[#0f1117] text-gray-200 flex flex-col overflow-hidden font-sans selection:bg-purple-500/30">
      {isSubmitted && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      {/* Vibrant Header */}
      <header className="h-14 bg-[#161b22] border-b border-[#2d333b] flex items-center px-6 justify-between shrink-0 shadow-md relative overflow-hidden">
        {/* Top glowing line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

        <div className="flex items-center gap-6 relative z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2d333b] rounded-full transition-all duration-300" 
            onClick={() => navigate("/daily-challenge")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent line-clamp-1 max-w-[300px]" title={dailyQuestion.title}>{dailyQuestion.title}</span>
                <Badge className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.1)] ${
                    dailyQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    dailyQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {dailyQuestion.difficulty}
                </Badge>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
           <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0d1117] rounded-full border border-[#30363d] shadow-inner">
              <Timer className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-mono font-medium text-gray-300">{formatTime(timeLeft)}</span>
           </div>
           
           <div className="flex items-center gap-3">
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
                            
                            {/* Font Size */}
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

                            {/* Switches */}
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

              <Button 
                size="sm" 
                className="h-9 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs rounded-lg border-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                onClick={handleSubmit}
                disabled={isSubmitted}
              >
                {isSubmitted ? (
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Submitted</span>
                ) : (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Submit</span>
                )}
              </Button>
           </div>
        </div>
      </header>

      {/* Main Workspace - 3 Column Layout */}
      <main className="flex-1 p-3 min-h-0 bg-[#0d1117]">
        <div className="h-full grid grid-cols-12 gap-3">
          
          {/* LEFT PANEL: Description (30%) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden shadow-xl">
             {/* Panel Tabs */}
             <div className="h-10 bg-[#0d1117]/50 flex items-center px-1 border-b border-[#30363d] backdrop-blur-sm">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`px-4 h-full text-xs font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 ${activeTab === 'description' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'}`}
                >
                  <Code2 className="h-4 w-4" />
                  Problem
                </button>
                <button 
                  onClick={() => setActiveTab('hints')}
                  className={`px-4 h-full text-xs font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 ${activeTab === 'hints' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'}`}
                >
                  <Sparkles className="h-4 w-4" />
                  Hints
                </button>
                <button 
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 h-full text-xs font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 ${activeTab === 'submissions' ? 'border-green-500 text-green-400 bg-green-500/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'}`}
                >
                  <Trophy className="h-4 w-4" />
                  <span className="hidden xl:inline">Submissions</span>
                </button>
             </div>

             <ScrollArea className="flex-1 bg-[#161b22]">
                {activeTab === 'description' && (
                  <div className="p-5 space-y-6 text-[#c9d1d9] text-sm">
                    <div>
                      <h2 className="text-xl font-bold mb-4 text-white">{dailyQuestion.title}</h2>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                         {dailyQuestion.companies.slice(0, 5).map(company => (
                             <Badge key={company} variant="secondary" className="bg-[#21262d] text-gray-400 hover:text-white transition-colors">{company}</Badge>
                         ))}
                         {dailyQuestion.companies.length > 5 && (
                             <Badge variant="secondary" className="bg-[#21262d] text-gray-400">+{dailyQuestion.companies.length - 5}</Badge>
                         )}
                      </div>

                      <div className="p-6 rounded-xl bg-[#0d1117] border border-[#30363d] text-center space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full bg-[#161b22] flex items-center justify-center border border-[#30363d]">
                             <Code2 className="h-8 w-8 text-purple-500" />
                          </div>
                          <div>
                              <h3 className="text-base font-semibold text-white mb-2">External Challenge</h3>
                              <p className="text-gray-400 max-w-xs mx-auto mb-4">
                                  This Daily Challenge is hosted on {dailyQuestion.platform}. Solve it there and track your progress here.
                              </p>
                              <Button 
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => window.open(dailyQuestion.url, '_blank')}
                              >
                                  Open in {dailyQuestion.platform} <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                              </Button>
                          </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" /> Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {dailyQuestion.tags.map(tag => (
                                <Badge key={tag} className="bg-purple-500/10 text-purple-400 border border-purple-500/20">{tag}</Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'hints' && (
                  <div className="p-5 space-y-4">
                     <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-lg text-sm text-blue-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Sparkles className="h-20 w-20 text-blue-500" />
                        </div>
                        <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Assistance</h4>
                        <p className="relative z-10">Need a hint? Use the "Get AI Hint" button below. Make sure to paste your work-in-progress code in the editor first!</p>
                     </div>
                     
                     {hints.map((hint, i) => (
                        <div key={i} className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg text-sm text-purple-200 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                             <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2"><Brain className="h-4 w-4" /> AI Hint {i + 2}</h4>
                             <p className="relative z-10">{hint}</p>
                        </div>
                     ))}
                     
                     <Button 
                        onClick={handleGenerateHint} 
                        disabled={isGeneratingHint}
                        className="w-full bg-[#21262d] hover:bg-[#30363d] text-blue-400 border border-blue-500/30 gap-2"
                     >
                        {isGeneratingHint ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin"></span>
                                Asking AI...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Get AI Hint
                            </>
                        )}
                     </Button>
                  </div>
                )}

                {activeTab === 'submissions' && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                     <div className="h-16 w-16 bg-[#21262d] rounded-full flex items-center justify-center mb-4 ring-1 ring-[#30363d]">
                        <Trophy className="h-8 w-8 opacity-50 text-yellow-500" />
                     </div>
                     <p className="text-sm font-medium text-gray-400">No submissions yet</p>
                     <p className="text-xs text-gray-600 mt-1">Solve the problem to see your history</p>
                  </div>
                )}
             </ScrollArea>
          </div>

          {/* MIDDLE PANEL: Code Editor (6/12) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden relative shadow-xl ring-1 ring-white/5">
             {/* Editor Header */}
             <div className="h-10 bg-[#0d1117]/80 flex items-center justify-between px-4 border-b border-[#30363d] backdrop-blur-md">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                        <Select value={language} onValueChange={(v: Language) => handleLanguageChange(v)}>
                          <SelectTrigger className="h-7 w-[130px] bg-[#21262d] border-[#30363d] text-xs font-medium text-gray-200 focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#161b22] border-[#30363d] text-gray-200">
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="bash">Bash</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{FILE_NAMES[language]}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
             </div>
             
             {/* Editor Canvas */}
             <div className="flex-1 relative group bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  language={language}
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
                    fontFamily: 'monospace',
                    padding: { top: 16 },
                  }}
                />
             </div>
             
             {/* Floating Run Button */}
             <div className="absolute bottom-6 right-6 z-20">
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
          </div>

          {/* RIGHT PANEL: Output (3/12) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full">
             {/* Output Section */}
             <div className="flex-1 flex flex-col bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden shadow-xl">
                 <div className="h-10 bg-[#0d1117]/80 flex items-center px-4 border-b border-[#30363d] justify-between backdrop-blur-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-gray-500" /> Console
                    </span>
                    <div className="flex gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#fa7970] opacity-50 hover:opacity-100 transition-opacity"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-[#faa356] opacity-50 hover:opacity-100 transition-opacity"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-[#7ce38b] opacity-50 hover:opacity-100 transition-opacity"></div>
                    </div>
                 </div>

                 <ScrollArea className="flex-1 p-4 font-mono text-xs bg-[#0d1117]">
                    {output ? (
                        <div className="space-y-1">
                             {output.split('\n').map((line, i) => (
                                 <div key={i} className={`p-2 rounded border-l-2 ${line.includes('Passed') ? 'bg-green-500/5 text-green-400 border-green-500' : line.includes('Error') ? 'bg-red-500/5 text-red-400 border-red-500' : 'text-gray-400 border-transparent'}`}>
                                     {line}
                                 </div>
                             ))}
                             {output.includes('All test cases passed') && (
                                 <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-lg text-emerald-400 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                     <div className="p-2 bg-emerald-500/20 rounded-full">
                                         <CheckCircle2 className="h-4 w-4" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm">All Tests Passed!</p>
                                         <p className="text-[10px] text-emerald-400/70">You are ready to submit.</p>
                                     </div>
                                 </div>
                             )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3">
                            <div className="h-12 w-12 rounded-xl bg-[#21262d] flex items-center justify-center shadow-lg border border-[#30363d] group-hover:border-blue-500/50 transition-colors">
                                <Play className="h-6 w-6 fill-current text-gray-500" />
                            </div>
                            <p className="text-center text-xs font-medium">Run code to see output</p>
                        </div>
                    )}
                 </ScrollArea>
             </div>
             
             {/* Test Cases / Info */}
             <div className="h-1/3 bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden flex flex-col shadow-xl">
                 <div className="h-9 bg-[#0d1117]/80 flex items-center px-4 border-b border-[#30363d]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Test Cases</span>
                 </div>
                 <div className="flex-1 p-4 bg-[#161b22]">
                     <div className="flex gap-2 mb-3">
                         <div className="px-3 py-1 bg-[#238636]/20 text-[#3fb950] border border-[#238636]/50 rounded text-xs font-medium cursor-pointer transition-all hover:bg-[#238636]/30">Case 1</div>
                         <div className="px-3 py-1 bg-[#21262d] text-gray-400 border border-[#30363d] rounded text-xs font-medium cursor-pointer transition-all hover:text-gray-200 hover:border-gray-500">Case 2</div>
                         <div className="px-3 py-1 bg-[#21262d] text-gray-400 border border-[#30363d] rounded text-xs font-medium cursor-pointer transition-all hover:text-gray-200 hover:border-gray-500">Case 3</div>
                     </div>
                     <div className="space-y-2 font-mono text-xs text-gray-400 bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                         <div className="flex gap-2">
                            <span className="text-blue-400 select-none">Input:</span> 
                            <span className="text-gray-300">[1,2,3,4,5]</span>
                         </div>
                         <div className="flex gap-2">
                             <span className="text-green-400 select-none">Output:</span> 
                             <span className="text-gray-300">[5,4,3,2,1]</span>
                         </div>
                     </div>
                 </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};


export default DailyChallenge;
