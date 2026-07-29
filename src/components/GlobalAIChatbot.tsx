import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  X,
  MessageSquare,
  Sparkles,
  Zap,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Compass,
  Briefcase,
  Layers,
  Award,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: {
    label: string;
    path: string;
  };
  followUps?: string[];
  timestamp: string;
}

type PersonaMode = "coach" | "dsa" | "system" | "resume";

const CHAT_STORAGE_KEY = "voke_assistant_chat_history_v2";

// Platform Navigation Mapping
const PLATFORM_NAV_MAP = [
  {
    keywords: ["profile", "account", "user details", "change details", "edit profile", "my details", "personal info", "change name", "settings", "avatar"],
    path: "/profile",
    label: "Go to Profile Settings"
  },
  {
    keywords: ["dashboard", "home", "overview", "my dashboard"],
    path: "/dashboard",
    label: "Go to Main Dashboard"
  },
  {
    keywords: ["dsa", "data structure", "algorithm", "leetcode", "striver", "blind 75", "code practice"],
    path: "/dsa-sheet",
    label: "Explore DSA Sheet & Topics"
  },
  {
    keywords: ["voice interview", "mock interview", "ai interview", "speak", "voice assistant", "verbal", "video interview"],
    path: "/voice-assistant",
    label: "Start AI Voice Interview"
  },
  {
    keywords: ["resume", "cv", "ats", "build resume", "resume builder"],
    path: "/resume-builder",
    label: "Open AI Resume Builder"
  },
  {
    keywords: ["peer", "practice with friend", "collaborate", "peer interview", "mock with peer", "partner"],
    path: "/peer-interviews",
    label: "Go to Peer Interview Rooms"
  },
  {
    keywords: ["company", "companies", "google", "amazon", "meta", "microsoft", "apple", "tcs", "infosys", "company questions"],
    path: "/companies",
    label: "View Company Kits"
  },
  {
    keywords: ["playground", "code editor", "ide", "compile", "run code"],
    path: "/playground",
    label: "Open Code Playground"
  },
  {
    keywords: ["analytics", "progress", "score", "performance", "report", "stats", "chart"],
    path: "/progress-analytics",
    label: "View Your Analytics & Stats"
  },
  {
    keywords: ["daily challenge", "streak", "daily problem", "daily question"],
    path: "/daily-challenge",
    label: "Solve Today's Challenge"
  },
  {
    keywords: ["leaderboard", "ranking", "top users", "rank"],
    path: "/leaderboard",
    label: "View Global Leaderboard"
  },
  {
    keywords: ["elite", "pro", "premium", "mentorship", "elite prep", "career roadmap"],
    path: "/elite-prep",
    label: "Explore Elite Prep Program"
  },
  {
    keywords: ["job", "jobs", "hiring", "careers", "openings", "job matches", "recommendations"],
    path: "/job-recommendations",
    label: "View Job Recommendations"
  },
  {
    keywords: ["pricing", "price", "plan", "subscription", "cost", "upgrade", "free tier", "pro tier"],
    path: "/pricing",
    label: "View Pricing & Upgrade"
  },
  {
    keywords: ["community", "forum", "discussion", "members"],
    path: "/community",
    label: "Join Community Forum"
  },
  {
    keywords: ["help", "support", "faq", "contact", "guide"],
    path: "/help",
    label: "Open Help & Support"
  }
];

const findMatchingNavAction = (userPrompt: string, assistantText: string): { label: string; path: string } | undefined => {
  const promptLower = userPrompt.toLowerCase().trim();
  const textLower = assistantText.toLowerCase().trim();

  // Priority 1: Direct match in user's prompt (e.g. user asked for "profile" or "change details")
  for (const nav of PLATFORM_NAV_MAP) {
    if (nav.keywords.some(k => promptLower.includes(k))) {
      return { label: nav.label, path: nav.path };
    }
  }

  // Priority 2: Direct match in assistant's generated text
  for (const nav of PLATFORM_NAV_MAP) {
    if (nav.keywords.some(k => textLower.includes(k))) {
      return { label: nav.label, path: nav.path };
    }
  }

  return undefined;
};

const VOKE_MASTER_SYSTEM_PROMPT = `You are Voke Assistant, the official AI assistant built exclusively for the Voke platform (an AI-powered tech career & interview preparation platform).

### CRITICAL RULES & GUARDRAILS:
1. **STRICT VOKE GROUNDING**: You must ONLY answer questions using knowledge about Voke, its features, practice modules, sheets, pricing, profile settings, and how to prepare for tech interviews on Voke.
2. **NO EXTERNAL / GENERAL KNOWLEDGE ANSWERS**: If a user asks a question unrelated to Voke or tech interview prep on Voke (e.g. general news, weather, cooking recipes, sports, history, movies, or non-Voke trivia), you MUST strictly decline to answer with this exact response:
   "I am Voke Assistant, specialized strictly in the Voke platform. I can only answer questions related to Voke, our features, and how to use Voke to prepare for tech interviews!"
3. **EXTREMELY CONCISE & SHORT RESPONSES**:
   - Keep EVERY response short, crisp, and directly to the point.
   - Maximum 2 to 4 brief bullet points OR maximum 2 short paragraphs (under 100 words total).
   - NEVER output long essays, giant walls of text, or verbose introductions.

### COMPLETE VOKE PLATFORM KNOWLEDGE BASE:
- **Overview**: Voke is an all-in-one AI platform helping software engineers, developers, and students crack tech interviews at top product companies (FAANG, MNCs, startups).
- **Profile & Account Settings** (/profile): Update personal profile details, full name, target tech role, experience level, avatar, email, and account settings.
- **AI Voice & Video Mock Interviews** (/voice-assistant, /interview/new): Real-time interactive voice dialogue with an AI interviewer, live code editor during interview, speech analysis, and instant scorecards (Delivery, Body Language, Technical depth, Confidence, Overall score).
- **Striver's A2Z & Blind 75 DSA Sheets** (/dsa-sheet): Curated problem sets (Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming, Sliding Window), built-in multi-language code runner, and AI hint assistant.
- **AI Resume Builder & ATS Optimizer** (/resume-builder): ATS keyword match score against job descriptions, STAR method bullet point improver with quantitative metrics, clean tech templates, and PDF export.
- **Company-Specific Question Kits** (/companies): Actual recent interview questions and architectural breakdowns for Google, Amazon, Meta, Microsoft, Apple, TCS, Infosys, etc.
- **Peer-to-Peer Mock Interviews** (/peer-interviews): Practice live mock interviews with peers in video rooms with a shared IDE and structured rubric scorecards.
- **Code Playground & Compiler** (/playground): Multi-language browser code compiler (C++, Java, Python, JS, TS, Go, Rust), AI code debugger, test case execution.
- **System Design Architect** (/playground, /elite-prep): High-level system design blueprints (Microservices, Load Balancers, Redis Caching, DB Sharding, Rate Limiters).
- **Progress Analytics** (/progress-analytics): Detailed performance breakdown, speech fluency, coding speed, and overall interview readiness score.
- **Daily Challenges & Streaks** (/daily-challenge, /leaderboard): Daily problem solving, streak counters, badges, and global community leaderboard.
- **Elite Prep & Career Roadmap** (/elite-prep): 1-on-1 AI mentorship, custom career roadmaps tailored to target roles and experience.
- **Job Recommendations** (/job-recommendations): AI-matched tech job openings based on interview performance.
- **Pricing & Plans** (/pricing): Free Starter Tier for basic practice; Elite Pro Tier for unlimited voice mocks, premium company kits, and deep analytics.`;

const NON_VOKE_INDICATORS = [
  "recipe", "cook", "pizza", "burger", "weather", "temperature", "rain", "president", "prime minister",
  "movie", "film", "song", "actor", "actress", "cricket", "football", "soccer", "nba",
  "capital of", "who is the president", "where is", "game", "horoscope", "astrology", "joke",
  "cat", "dog", "pet", "car", "flight", "hotel", "travel to", "history of"
];

const generateIntelligentFallbackResponse = (
  userPrompt: string,
  persona: PersonaMode
): { text: string; action?: { label: string; path: string }; followUps?: string[] } => {
  const query = userPrompt.toLowerCase().trim();

  // Guardrail check: Refuse external non-Voke questions
  const isOffTopic = NON_VOKE_INDICATORS.some(term => query.includes(term));
  if (isOffTopic) {
    return {
      text: "I am Voke Assistant, specialized strictly in the Voke platform. I can only answer questions related to Voke, our features, and how to use Voke to prepare for tech interviews!",
      followUps: ["Tell me about Voke features", "How do AI Voice Interviews work?", "Where is the DSA Sheet?"]
    };
  }

  // Priority Matched Nav Action
  const matchedNav = findMatchingNavAction(query, "");

  // 1. Navigation & Platform Specific Queries
  if (query.includes("profile") || query.includes("account") || query.includes("change details") || query.includes("my details") || query.includes("user details") || query.includes("settings") || query.includes("edit profile")) {
    return {
      text: "**Profile & Account Settings (`/profile`):**\n\n" +
        "- **Personal Details:** Update your full name, target tech role, experience level & avatar.\n" +
        "- **Account Settings:** Manage email preferences, authentication & subscription status.",
      action: { label: "Go to Profile Settings", path: "/profile" },
      followUps: ["Update target role", "How to change email?", "View my subscription"]
    };
  }

  if (query.includes("dsa") || query.includes("data structure") || query.includes("algorithm")) {
    return {
      text: "**DSA on Voke (`/dsa-sheet`):**\n\n" +
        "- **Curated Sheets:** Striver's A2Z & Blind 75 organized by difficulty & topic.\n" +
        "- **Interactive Runner:** Code & execute solutions directly in your browser.\n" +
        "- **AI Guidance:** Get instant hints without spoiling full solutions.",
      action: { label: "Go to DSA Sheet", path: "/dsa-sheet" },
      followUps: ["What topics are in Striver sheet?", "How to use Code Playground?", "Practice Array problems"]
    };
  }

  if (query.includes("voice") || query.includes("mock interview") || query.includes("ai interview")) {
    return {
      text: "**AI Voice Mocks on Voke (`/voice-assistant`):**\n\n" +
        "- **Real-Time Dialogue:** Interactive verbal tech & behavioral rounds.\n" +
        "- **Live Code Editor:** Code live while the AI evaluates your logic.\n" +
        "- **Instant Scorecard:** Feedback on technical depth, speech clarity & confidence.",
      action: { label: "Start AI Voice Interview", path: "/voice-assistant" },
      followUps: ["How are scores calculated?", "What companies are supported?", "Behavioral interview tips"]
    };
  }

  if (query.includes("resume") || query.includes("cv") || query.includes("ats")) {
    return {
      text: "**AI Resume Builder on Voke (`/resume-builder`):**\n\n" +
        "- **ATS Match Score:** Compare your CV against tech job descriptions.\n" +
        "- **STAR Enhancer:** AI turns descriptions into metric-driven achievements.\n" +
        "- **Clean Export:** Download modern tech PDF templates.",
      action: { label: "Open Resume Builder", path: "/resume-builder" },
      followUps: ["How to improve ATS score?", "STAR format example", "Export resume PDF"]
    };
  }

  if (query.includes("peer") || query.includes("friend") || query.includes("partner")) {
    return {
      text: "**Peer Interviews on Voke (`/peer-interviews`):**\n\n" +
        "- **Shared Rooms:** Video call + live collaborative code editor.\n" +
        "- **FAANG Rubrics:** Rate each other using structured candidate scorecards.",
      action: { label: "Join Peer Interview Room", path: "/peer-interviews" },
      followUps: ["Create a private room", "Peer interview guidelines"]
    };
  }

  if (query.includes("company") || query.includes("companies") || query.includes("google") || query.includes("amazon") || query.includes("meta")) {
    return {
      text: "**Company Kits on Voke (`/companies`):**\n\n" +
        "- **Curated Archives:** Recent coding & system design questions from Google, Amazon, Meta, etc.\n" +
        "- **Detailed Blueprints:** Architectures and leadership principle prep.",
      action: { label: "Explore Company Kits", path: "/companies" },
      followUps: ["Google interview questions", "Amazon Leadership Principles", "System design topics"]
    };
  }

  if (query.includes("price") || query.includes("pricing") || query.includes("plan") || query.includes("cost") || query.includes("pro") || query.includes("free")) {
    return {
      text: "**Voke Pricing & Plans (`/pricing`):**\n\n" +
        "- **Free Starter:** Basic practice, DSA sheets, code runner & community.\n" +
        "- **Elite Pro:** Unlimited AI voice mocks, ATS resume scans & company kits.",
      action: { label: "View Pricing Plans", path: "/pricing" },
      followUps: ["Explore Elite Prep", "What is included in Free tier?"]
    };
  }

  // 2. Persona-Specific Short Answers
  if (persona === "dsa") {
    return {
      text: "**Voke DSA Mentor:**\n\n" +
        "- **Approach:** 1. State constraints. 2. Give brute force ($O(N^2)$). 3. Optimize with HashMap/Two Pointers ($O(N)$).\n" +
        "- **Practice:** Solve this topic on Voke's DSA Sheet with instant AI hints.",
      action: matchedNav ? { label: matchedNav.label, path: matchedNav.path } : { label: "Open Code Playground", path: "/playground" },
      followUps: ["DSA Sheet topics", "Space-time complexity tips"]
    };
  }

  if (persona === "system") {
    return {
      text: "**Voke System Design Mentor:**\n\n" +
        "- **Blueprint:** 1. Requirements & SLA. 2. Load Balancer ➔ Microservices ➔ Redis Cache ➔ DB.\n" +
        "- **Practice:** Use Voke's System Design module in Elite Prep for company architectural rounds.",
      action: { label: "Open System Design Playground", path: "/playground" },
      followUps: ["SQL vs NoSQL trade-offs", "Caching strategies"]
    };
  }

  if (persona === "resume") {
    return {
      text: "**Voke Resume Specialist:**\n\n" +
        "- **ATS Formula:** *[Action Verb] + [Tech Tool] + [Measurable Result]*\n" +
        "- **Optimizer:** Use Voke's Resume Builder (`/resume-builder`) to score and rewrite bullet points.",
      action: { label: "Open Resume Builder", path: "/resume-builder" },
      followUps: ["ATS score scanner", "Top tech action verbs"]
    };
  }

  // Default Voke Coach Persona
  return {
    text: "**Voke Assistant:**\n\n" +
      "- **Voke Prep:** Practice technical coding on DSA Sheets (`/dsa-sheet`) or take an AI Voice Mock Interview (`/voice-assistant`).\n" +
      "- Ask me any question about Voke features, pricing, or prep modules!",
    action: matchedNav ? { label: matchedNav.label, path: matchedNav.path } : { label: "Start AI Voice Interview", path: "/voice-assistant" },
    followUps: ["What features does Voke have?", "How do AI Voice Interviews work?", "How to prepare DSA?"]
  };
};

const GlobalAIChatbot = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [persona, setPersona] = useState<PersonaMode>("coach");
  const [userName, setUserName] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load chat history", e);
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-25)));
    }
  }, [messages]);

  // Load user profile name
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.user.id)
            .maybeSingle();
          if (profile?.full_name) {
            setUserName(profile.full_name.split(" ")[0]);
          }
        }
      } catch (e) {
        console.warn("Profile fetch error:", e);
      }
    };
    fetchUser();
  }, []);

  // Keyboard shortcut: Ctrl + K or Cmd + K to toggle chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-ai-coach", handleOpenChat);
    return () => window.removeEventListener("open-ai-coach", handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Text-To-Speech
  const toggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech not supported on this browser.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`$]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text Dictation
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak now.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Could not capture audio.");
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error", e);
      setIsListening(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
    toast.info("Conversation cleared");
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 1. Primary AI Engine: Direct Gemini REST API
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let assistantText = "";
      let actionObj: { label: string; path: string } | undefined = undefined;

      const personaInstruction = {
        coach: "Mode: General Voke Assistant Coach.",
        dsa: "Mode: Voke DSA Mentor.",
        system: "Mode: Voke System Design Mentor.",
        resume: "Mode: Voke Resume & ATS Specialist."
      }[persona];

      if (geminiApiKey && geminiApiKey !== "YOUR_GEMINI_API_KEY") {
        try {
          const contents = messages.slice(-6).map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }));
          contents.push({ role: "user", parts: [{ text }] });

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                systemInstruction: {
                  parts: [{ text: `${VOKE_MASTER_SYSTEM_PROMPT}\n${personaInstruction}\n\nSTRICT REQUIREMENT: Answer ONLY about Voke. Decline non-Voke topics politely. Keep response short (under 100 words, max 2-4 bullets).` }]
                },
                generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
              })
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply && reply.trim()) {
              assistantText = reply.trim();
            }
          }
        } catch (e) {
          console.warn("Direct Gemini API attempt failed:", e);
        }
      }

      // 2. Secondary AI Engine: Supabase Edge Function
      if (!assistantText) {
        try {
          const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
            body: {
              messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }],
              userContext: `${VOKE_MASTER_SYSTEM_PROMPT}\n${personaInstruction}`
            }
          });
          if (!error && data?.response) {
            assistantText = data.response;
          }
        } catch (e) {
          console.warn("Supabase edge function failed:", e);
        }
      }

      // 3. Fallback Smart Knowledge Base Engine
      let followUpChips: string[] | undefined = undefined;
      if (!assistantText) {
        const fallback = generateIntelligentFallbackResponse(text, persona);
        assistantText = fallback.text;
        actionObj = fallback.action;
        followUpChips = fallback.followUps;
      } else {
        const matched = findMatchingNavAction(text, assistantText);
        if (matched) {
          actionObj = { label: matched.label, path: matched.path };
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantText,
        action: actionObj,
        followUps: followUpChips,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Voke Assistant error:", err);
      const fallback = generateIntelligentFallbackResponse(text, persona);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallback.text,
          action: fallback.action,
          followUps: fallback.followUps,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { label: "🎙️ Voice Mock Interview", text: "How do I take an AI Voice Mock Interview?" },
    { label: "🧩 Striver & Blind 75 DSA", text: "Where can I practice DSA questions?" },
    { label: "📄 ATS Resume Scoring", text: "How can I improve my tech resume for ATS?" },
    { label: "🏗️ System Design Checklist", text: "Give me a System Design interview checklist." }
  ];

  // Hide assistant on Landing Page ("/")
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`mb-4 transition-all duration-300 pointer-events-auto ${
              isExpanded
                ? "w-[90vw] max-w-[840px] h-[85vh]"
                : "w-[380px] sm:w-[440px] h-[630px]"
            }`}
          >
            {/* Window Frame */}
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/90 backdrop-blur-2xl shadow-2xl flex flex-col h-full text-white">
              {/* Decorative Ambient Gradients */}
              <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-violet-600/30 via-indigo-600/10 to-transparent pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-black"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base tracking-tight">Voke Assistant</h3>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Ctrl+K
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                      {userName ? `Assisting ${userName}` : "Always ready to assist you"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={isExpanded ? "Collapse View" : "Expand View"}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 transition-colors"
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>

                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Clear Conversation"
                      onClick={clearChat}
                      className="text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-full h-8 w-8 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Persona Selector Toolbar */}
              <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs overflow-x-hidden">
                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">Mode:</span>
                <div className="flex items-center gap-1 w-full sm:w-auto justify-around">
                  {[
                    { id: "coach", label: "Coach", icon: Brain },
                    { id: "dsa", label: "DSA", icon: Code2 },
                    { id: "system", label: "Architecture", icon: Layers },
                    { id: "resume", label: "Resume", icon: FileText }
                  ].map(p => {
                    const Icon = p.icon;
                    const isActive = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPersona(p.id as PersonaMode)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                          isActive
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Scroll Container */}
              <ScrollArea className="flex-1 p-4 overflow-x-hidden" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 py-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-purple-600/20 flex items-center justify-center mb-4 border border-violet-500/30 shadow-inner">
                      <Brain className="w-8 h-8 text-violet-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      {userName ? `Welcome back, ${userName}!` : "How can I help your career today?"}
                    </h4>
                    <p className="text-xs text-gray-400 mb-6 max-w-[300px]">
                      Ask about interview prep, DSA problems, resume reviews, or platform navigation.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[480px]">
                      {samplePrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(prompt.text)}
                          className="text-xs text-left px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-gray-300 hover:text-white transition-all flex items-center justify-between group"
                        >
                          <span className="font-medium leading-snug">{prompt.label}</span>
                          <Zap className="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-2">
                    {messages.map(message => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/30 shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-violet-400" />
                          </div>
                        )}

                        <div className="max-w-[88%] group relative overflow-x-hidden">
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm shadow-md break-words ${
                              message.role === "user"
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                                : "bg-white/10 border border-white/10 text-gray-100 rounded-tl-sm backdrop-blur-md"
                            }`}
                          >
                            {message.role === "assistant" ? (
                              <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-hidden prose-p:leading-relaxed prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:overflow-x-auto prose-pre:[scrollbar-width:none] prose-pre:[-ms-overflow-style:none] prose-pre:[&::-webkit-scrollbar]:hidden">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <span>{message.content}</span>
                            )}

                            {/* Embedded Action Navigation Button */}
                            {message.action && (
                              <div className="mt-3 pt-2 border-t border-white/10">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setIsOpen(false);
                                    navigate(message.action!.path);
                                  }}
                                  className="w-full h-8 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-lg flex items-center justify-center gap-1.5 shadow-md"
                                >
                                  {message.action.label}
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Dynamic Follow-up Suggestions */}
                          {message.role === "assistant" && message.followUps && message.followUps.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {message.followUps.map((chip, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => sendMessage(chip)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-violet-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
                                >
                                  <ChevronRight className="w-3 h-3 text-amber-400" />
                                  {chip}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Message Metadata & Action Controls */}
                          <div
                            className={`flex items-center gap-2.5 text-[10px] text-gray-400 mt-1 px-1 ${
                              message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>{message.timestamp}</span>
                            {message.role === "assistant" && (
                              <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleSpeech(message.id, message.content)}
                                  className="hover:text-white transition-colors"
                                  title={speakingId === message.id ? "Stop Reading" : "Read Aloud"}
                                >
                                  {speakingId === message.id ? (
                                    <VolumeX className="w-3 h-3 text-amber-400 animate-pulse" />
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(message.id, message.content)}
                                  className="hover:text-white transition-colors"
                                  title="Copy Message"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 shrink-0 mt-1">
                            <User className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {loading && (
                      <div className="flex gap-3 justify-start items-center">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/30 shrink-0">
                          <Bot className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-xs text-gray-300">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                          </span>
                          <span className="text-gray-400">Voke AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Quick Navigation Toolbar */}
              <div className="px-3.5 py-2 bg-white/5 border-t border-white/5 flex items-center flex-wrap gap-1.5 text-xs overflow-x-hidden">
                <span className="text-[10px] text-gray-400 font-medium shrink-0 flex items-center gap-1 mr-0.5">
                  <Compass className="w-3 h-3 text-violet-400" /> Quick Jump:
                </span>
                {[
                  { label: "DSA", path: "/dsa-sheet" },
                  { label: "Voice Interview", path: "/voice-assistant" },
                  { label: "Resume", path: "/resume-builder" },
                  { label: "Peer Rooms", path: "/peer-interviews" },
                  { label: "Companies", path: "/companies" }
                ].map((link, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(link.path);
                    }}
                    className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/5 transition-colors text-[11px]"
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              {/* Form Input Box */}
              <div className="p-3.5 bg-black/60 backdrop-blur-md border-t border-white/10 relative z-10">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="relative flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={
                      isListening
                        ? "Listening to voice input..."
                        : `Ask ${persona === "coach" ? "Voke Assistant" : persona.toUpperCase() + " Mentor"}...`
                    }
                    disabled={loading}
                    className={`flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-violet-500/60 focus:ring-violet-500/30 transition-all pl-4 pr-20 text-sm ${
                      isListening ? "border-red-500/60 ring-2 ring-red-500/30" : ""
                    }`}
                  />

                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleVoiceInput}
                      title={isListening ? "Stop Listening" : "Voice Dictation"}
                      className={`h-8 w-8 rounded-lg transition-colors ${
                        isListening
                          ? "bg-red-500/30 text-red-400 animate-pulse"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading || !input.trim()}
                      size="icon"
                      className="h-8 w-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity rounded-lg text-white shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Assistant Trigger Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative group"
        title="Voke AI Assistant (Ctrl + K)"
      >
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${
            isOpen ? "bg-red-500/30" : "bg-violet-600/40 group-hover:bg-violet-600/70 animate-pulse"
          }`}
        />
        <div
          className={`
          relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl border border-white/20 backdrop-blur-md transition-all duration-300
          ${
            isOpen
              ? "bg-black text-red-400 rotate-90 border-red-500/40"
              : "bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 text-white shadow-violet-500/30"
          }
        `}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="relative"
              >
                <MessageSquare className="w-6 h-6 fill-white/20 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
};

export default GlobalAIChatbot;
