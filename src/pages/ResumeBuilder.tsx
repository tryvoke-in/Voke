import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { extractResumeText } from "@/utils/pdfParser";
import {
  User, Briefcase, GraduationCap, Code, FileText,
  Plus, Trash2, Download, Printer, ChevronLeft,
  LayoutTemplate, Globe, Mail, Phone, MapPin, Linkedin, Github, Sparkles, Upload,
  ZoomIn, ZoomOut, RotateCcw, Check, BadgeAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import ResumeAnalysisDisplay from "@/components/ResumeAnalysisDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ADMIN_EMAIL } from "@/config/admin";

// --- Types ---
interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
  coursework: string;
  location: string;
}

interface Leadership {
  id: string;
  type: 'Leadership' | 'Hackathon' | 'Certificate';
  role: string;
  organization: string;
  duration: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
}

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  leetcode: string;
  codeforces: string;
  summary: string;
  skills: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  leadership: Leadership[];
  photo?: string;
}

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [enhancingExpId, setEnhancingExpId] = useState<string | null>(null);
  const [enhancingProjId, setEnhancingProjId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("minimalist");
  const [zoom, setZoom] = useState(0.85);

  // Initial State
  const [data, setData] = useState<ResumeData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    leetcode: "",
    codeforces: "",
    summary: "",
    skills: "",
    experience: [],
    education: [],
    projects: [],
    leadership: []
  });

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [atsProgress, setAtsProgress] = useState(0);
  const [atsTimeElapsed, setAtsTimeElapsed] = useState(0);
  const [makingAtsFriendly, setMakingAtsFriendly] = useState(false);
  const [atsFriendlyProgress, setAtsFriendlyProgress] = useState('');
  const [fetchingRepoId, setFetchingRepoId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculation for completion progress
  const calculateProgress = () => {
    let score = 0;
    if (data.fullName) score += 10;
    if (data.email) score += 10;
    if (data.summary) score += 15;
    if (data.skills) score += 15;
    if (data.experience.length > 0) score += 20;
    if (data.education.length > 0) score += 15;
    if (data.projects.length > 0) score += 10;
    if (data.leadership.length > 0) score += 5;
    return Math.min(100, score);
  };

  const progress = calculateProgress();

  // Handlers
  const handleChange = (field: keyof ResumeData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEnhance = async () => {
    if (!data.summary) {
      toast.error("Please add a basic summary first for AI to enhance.");
      return;
    }
    setIsAiEnhancing(true);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("Missing API Key");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `Rewrite the following resume summary to be highly professional, action-oriented, and bypass AI detectors by sounding very human and authentic. Keep it to 2-3 sentences max. Do NOT use generic AI words like "delve", "testament", or "tapestry". Here is the summary: ${data.summary}` }],
          temperature: 0.7,
        }),
      });
      const resData = await response.json();
      const newSummary = resData.choices?.[0]?.message?.content?.replace(/["']/g, "").trim();
      if (newSummary) {
        setData(prev => ({ ...prev, summary: newSummary }));
        toast.success("Summary enhanced by AI!");
      }
    } catch (error) {
      toast.error("Failed to enhance summary.");
    } finally {
      setIsAiEnhancing(false);
    }
  };

  const handleAiEnhanceExperience = async (id: string, description: string) => {
    if (!description || description.length < 10) {
      toast.error("Please add some basic duties first.");
      return;
    }
    setEnhancingExpId(id);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are an elite executive resume writer for FAANG engineers." }, { role: "user", content: `Rewrite the following job duties into 2-3 elite, metric-driven bullet points. 
          
CRITICAL RULES:
1. Start EVERY bullet point with a powerful action verb (e.g., Spearheaded, Architected, Engineered).
2. Quantify impact organically (e.g., "resulting in a 40% reduction in latency" or "scaling to 10k+ users"). If no metrics are provided, invent highly realistic, contextual metrics that fit the role.
3. Sound strictly human and authentic. DO NOT use generic AI words like "delve", "pivotal", "seamless", "tapestry", or "testament".
4. Format exactly as a markdown list using '-' and nothing else.
5. Focus purely on technical depth and business impact. 

Original Text: ${description}` }],
          temperature: 0.6,
        }),
      });
      const resData = await response.json();
      const newDesc = resData.choices?.[0]?.message?.content?.trim();
      if (newDesc) {
        setData(prev => ({
          ...prev,
          experience: prev.experience.map(exp => exp.id === id ? { ...exp, description: newDesc } : exp)
        }));
        toast.success("Duties enhanced!");
      }
    } catch (error) {
      toast.error("Failed to enhance duties.");
    } finally {
      setEnhancingExpId(null);
    }
  };

  const handleAiEnhanceProject = async (id: string, description: string) => {
    if (!description || description.length < 10) {
      toast.error("Please add a basic project description first.");
      return;
    }
    setEnhancingProjId(id);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are an elite executive resume writer for FAANG engineers." }, { role: "user", content: `Rewrite the following project description into 2-3 elite, metric-driven bullet points. 

CRITICAL RULES:
1. Start EVERY bullet point with a powerful action verb (e.g., Architected, Deployed, Engineered).
2. Explicitly highlight the tech stack organically within the sentence (e.g., "Engineered a React.js front-end backed by Node.js...").
3. Quantify the project's complexity or impact (e.g., "processing 5k+ data points" or "reducing load times by 30%"). If no metrics exist, invent highly realistic ones.
4. Sound strictly human. DO NOT use words like "delve", "seamless", "testament", or "cutting-edge".
5. Format exactly as a markdown list using '-' and nothing else.

Original Text: ${description}` }],
          temperature: 0.6,
        }),
      });
      const resData = await response.json();
      const newDesc = resData.choices?.[0]?.message?.content?.trim();
      if (newDesc) {
        setData(prev => ({
          ...prev,
          projects: prev.projects.map(proj => proj.id === id ? { ...proj, description: newDesc } : proj)
        }));
        toast.success("Project enhanced!");
      }
    } catch (error) {
      toast.error("Failed to enhance project.");
    } finally {
      setEnhancingProjId(null);
    }
  };

  const handleFetchGitHubProject = async (id: string, urlLink: string) => {
    if (!urlLink || urlLink.trim() === "") {
      toast.error("Please add a GitHub URL link first.");
      return;
    }

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      toast.error("VITE_GROQ_API_KEY not configured.");
      return;
    }

    // Try parsing owner and repo name from urlLink
    const cleanedUrl = urlLink.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const parts = cleanedUrl.split('/');
    let owner = '';
    let repo = '';

    // E.g. github.com/owner/repo
    if (parts[0].toLowerCase().includes('github.com')) {
      owner = parts[1] || '';
      repo = parts[2] || '';
    } else {
      // E.g. owner/repo
      owner = parts[0] || '';
      repo = parts[1] || '';
    }

    // Clean repo name from hash/query parameters
    if (repo) {
      repo = repo.split('?')[0].split('#')[0].replace(/\.git$/i, '');
    }

    if (!owner || !repo) {
      toast.error("Could not parse owner and repository name from the link. Make sure it is in the format github.com/owner/repo or owner/repo.");
      return;
    }

    setFetchingRepoId(id);
    try {
      // Fetch repo metadata
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoRes.ok) {
        throw new Error(`Failed to fetch repo: ${repoRes.statusText}`);
      }
      const repoData = await repoRes.json();
      if (!repoData) {
        throw new Error("Could not retrieve repository information.");
      }

      // Fetch README content
      let readmeText = "";
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
        if (readmeRes.ok) {
          const readmeJson = await readmeRes.json();
          if (readmeJson.content) {
            const base64Str = readmeJson.content.replace(/\s/g, '');
            let decoded = "";
            try {
              decoded = decodeURIComponent(escape(atob(base64Str)));
            } catch (err) {
              decoded = atob(base64Str);
            }
            readmeText = decoded.substring(0, 2500);
          }
        }
      } catch (e) {
        console.log("No readme or parsing issue", e);
      }

      // Construct Prompt
      const prompt = `You are an elite, senior software engineer and professional resume builder. We fetched the following info from the GitHub repository of this project:
Project Name: ${repoData.name}
Description: ${repoData.description || 'N/A'}
Primary Language: ${repoData.language || 'N/A'}
Topics: ${repoData.topics?.join(', ') || 'N/A'}
${readmeText ? `README content excerpt:\n${readmeText}` : ''}

Write exactly 2 elite, professional, fully humanized resume bullet points (prefixed with "- ") detailing the design, architecture, key implementation features, and impact.

CRITICAL RULES:
1. Start every bullet with a strong action verb (e.g. Architected, Engineered, Developed, Deployed, Optimized, Designed).
2. Embed the key technologies used organically inside the bullets.
3. Quantify everything with realistic impact metrics (e.g. latency, user count, accuracy, bundle size, uptime). If none are in the readme, invent contextually appropriate metrics.
4. Ensure the output feels 100% human-written and passes all AI detectors. DO NOT use generic buzzwords ("leveraged", "robust", "seamless", "tapestry", "delve").
5. Output ONLY the 2 bullets. No introduction, no markdown backticks block, no outro.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description with AI.");
      }

      const resData = await response.json();
      const generatedDesc = resData.choices?.[0]?.message?.content?.trim();
      if (!generatedDesc) {
        throw new Error("Empty description returned from AI.");
      }

      // Update state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(proj => {
          if (proj.id === id) {
            return {
              ...proj,
              name: proj.name && proj.name.trim() !== "" ? proj.name : repoData.name,
              description: generatedDesc
            };
          }
          return proj;
        })
      }));

      toast.success("Project details imported and optimized from GitHub!");
    } catch (error: any) {
      toast.error(`GitHub import failed: ${error.message}`);
    } finally {
      setFetchingRepoId(null);
    }
  };

  // === Make ATS Friendly: full resume auto-optimize ===
  const handleMakeAtsFriendly = async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) { toast.error("GROQ_API_KEY not configured."); return; }
    setMakingAtsFriendly(true);

    const groqRewrite = async (systemMsg: string, userMsg: string): Promise<string> => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }],
          temperature: 0.4,
        }),
      });
      const d = await res.json();
      return d.choices?.[0]?.message?.content?.trim() ?? '';
    };

    // Extract recommendations from the most recent ATS audit
    const missingKeywords = analysisResult?.keywords?.missing || [];
    const improvements = analysisResult?.improvements || [];

    const missingKeywordsInstruction = missingKeywords.length > 0
      ? `\nCRITICAL KEYWORDS TO INJECT (integrate naturally where relevant):\n${missingKeywords.map((k: string) => `- ${k}`).join('\n')}`
      : '';

    const improvementsInstruction = improvements.length > 0
      ? `\nCRITICAL FEEDBACK TO INCORPORATE (apply these recommendations):\n${improvements.map((i: string) => `- ${i}`).join('\n')}`
      : '';

    try {
      // Step 1: Rewrite Summary
      if (data.summary) {
        setAtsFriendlyProgress('Optimizing Professional Summary...');
        const newSummary = await groqRewrite(
          "You are an elite ATS resume optimizer with deep expertise in how modern NLP-based ATS parsers evaluate professional summaries. Output only the rewritten text, nothing else.",
          `Rewrite this professional summary to score 90+ on ALL modern ATS systems (Workday, Greenhouse, Lever, Eightfold).

APPLY ALL THESE ATS RULES:
1. RESULTS-FIRST: Start with what you deliver/have achieved, not who you are. (e.g., "Full-stack engineer with a proven record of..." not "I am a developer who...")
2. ATS KEYWORD DENSITY: Naturally embed high-frequency ATS keywords: full-stack development, scalable systems, agile methodology, cross-functional collaboration, end-to-end delivery, software engineering, version control, API integration.
3. SPELL OUT ACRONYMS at least once inline (e.g., "Representational State Transfer (REST) APIs" then "REST APIs" after).
4. QUANTIFY if possible: Include a realistic metric or scope (e.g., "3+ years of experience", "2+ production applications", "team of 5").
5. Max 2-3 sentences. Read naturally — zero AI buzzwords: 'delve', 'synergize', 'tapestry', 'testament', 'pivotal', 'seamless', 'innovative', 'passionate'.
6. Output ONLY the plain rewritten text. No quotes, no labels, no explanation.${missingKeywordsInstruction}${improvementsInstruction}

Original Summary: ${data.summary}`
        );
        if (newSummary) setData(prev => ({ ...prev, summary: newSummary }));
      }

      // Step 2: Rewrite each Experience entry
      for (let i = 0; i < data.experience.length; i++) {
        const exp = data.experience[i];
        if (!exp.description) continue;
        setAtsFriendlyProgress(`Optimizing Work Experience: ${exp.role || 'Role ' + (i + 1)}...`);
        const newDesc = await groqRewrite(
          "You are an elite ATS resume optimizer and FAANG-level resume writer. You understand exactly how NLP-based ATS parsers calculate experience scores. Output ONLY the bullet points, nothing else.",
          `Rewrite these job duties into exactly 3 ATS-optimized bullet points for role: "${exp.role} at ${exp.company}" (Period: ${exp.duration || 'not specified'}).

APPLY ALL OF THESE DEEP ATS RULES:
1. XYZ FORMULA (MANDATORY): Every bullet follows "Accomplished [X] as measured by [Y], by doing [Z]".
   Good example: "Engineered a React.js and Node.js dashboard that reduced average page load time by 37%, serving 12,000+ monthly active users."
2. ACTION VERBS: Start every bullet with a strong verb (Architected, Engineered, Deployed, Optimized, Delivered, Implemented, Automated, Streamlined).
3. CONTEXTUALIZE SKILLS INSIDE THE BULLET: Embed the exact technology name inside the sentence. This lets the ATS tie the skill to this job's dates and calculate years of experience with that specific tool.
4. SPELL OUT ACRONYMS ONCE: Write the full term followed by the abbreviation (e.g., "Continuous Integration/Continuous Deployment (CI/CD)", "RESTful Application Programming Interface (API)").
5. REALISTIC METRICS: If not present, add contextually realistic numbers — percentage improvements, user counts, latency reductions, data volumes, team size.
6. NEVER USE: 'leveraged', 'utilized', 'synergized', 'robust', 'seamless', 'cutting-edge', 'innovative', 'passionate'.
7. Output ONLY the 3 bullets with "- " prefix. No intro, no outro, no explanation.${missingKeywordsInstruction}${improvementsInstruction}

Original duties: ${exp.description}`
        );
        if (newDesc) {
          const id = exp.id;
          setData(prev => ({
            ...prev,
            experience: prev.experience.map(e => e.id === id ? { ...e, description: newDesc } : e)
          }));
        }
      }

      // Step 3: Rewrite each Project entry
      for (let i = 0; i < data.projects.length; i++) {
        const proj = data.projects[i];
        if (!proj.description) continue;
        setAtsFriendlyProgress(`Optimizing Project: ${proj.name || 'Project ' + (i + 1)}...`);
        const newDesc = await groqRewrite(
          "You are an elite ATS resume optimizer and FAANG-level resume writer. You understand exactly how NLP-based ATS parsers evaluate project descriptions. Output ONLY the bullet points, nothing else.",
          `Rewrite this project description into exactly 2 ATS-optimized bullet points for project: "${proj.name}".

APPLY ALL OF THESE DEEP ATS RULES:
1. XYZ FORMULA (MANDATORY): Every bullet follows "Accomplished [X] as measured by [Y], by doing [Z]".
   Good example: "Architected a Python and TensorFlow-based plant disease detection system achieving 94.2% model accuracy, reducing diagnosis time by 45% for 2,000+ registered users."
2. ACTION VERBS: Start every bullet with a strong verb (Architected, Built, Deployed, Designed, Implemented, Developed, Engineered).
3. EMBED TECH STACK ORGANICALLY: Name the exact technologies inside the sentence, not as a separate list. This ties skills to the project timeframe for ATS experience calculation.
4. SPELL OUT ACRONYMS ONCE: Write the full term first (e.g., "Artificial Intelligence (AI)", "Machine Learning (ML)", "Application Programming Interface (API)").
5. ADD REALISTIC PROJECT METRICS: domain-specific numbers (e.g., model accuracy %, user count, data records processed, performance improvements, uptime %). Make them contextually appropriate.
6. NEVER USE: 'innovative', 'cutting-edge', 'seamless', 'robust', 'state-of-the-art', 'leverage', 'passionate'.
7. Output ONLY the 2 bullets with "- " prefix. No intro, no outro, no explanation.${missingKeywordsInstruction}${improvementsInstruction}

Original description: ${proj.description}`
        );
        if (newDesc) {
          const id = proj.id;
          setData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === id ? { ...p, description: newDesc } : p)
          }));
        }
      }

      toast.success('Resume fully ATS-optimized! Re-run the ATS Audit to see your new score.');
      setAnalysisResult(null);
      setAnalysisOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'ATS optimization failed. Please try again.');
    } finally {
      setMakingAtsFriendly(false);
      setAtsFriendlyProgress('');
    }
  };

  // Array Handlers (Experience)
  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now().toString(), role: "", company: "", duration: "", description: "" }]
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeExperience = (id: string) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  // Array Handlers (Education)
  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: "", school: "", year: "", coursework: "", location: "" }]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeEducation = (id: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  // Array Handlers (Projects)
  const addProject = () => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), name: "", description: "", link: "" }]
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeProject = (id: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(item => item.id !== id)
    }));
  };

  // Array Handlers (Leadership)
  const addLeadership = () => {
    setData(prev => ({
      ...prev,
      leadership: [...prev.leadership, { id: Date.now().toString(), type: 'Leadership', role: "", organization: "", duration: "", description: "" }]
    }));
  };

  const updateLeadership = (id: string, field: keyof Leadership, value: string) => {
    setData(prev => ({
      ...prev,
      leadership: prev.leadership.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeLeadership = (id: string) => {
    setData(prev => ({
      ...prev,
      leadership: prev.leadership.filter(item => item.id !== id)
    }));
  };

  const handleAnalyzeResume = async () => {
    setAnalyzing(true);
    setAnalysisOpen(true);
    setAtsProgress(0);
    setAtsTimeElapsed(0);
    setAnalysisResult(null);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setAtsTimeElapsed(elapsed);
      setAtsProgress(p => {
        if (p < 30) return p + 3;
        if (p < 60) return p + 2;
        if (p < 95) return p + 0.5;
        return p;
      });
    }, 500);

    try {
      let resumeText = `Name: ${data.fullName}\nEmail: ${data.email}\nSummary: ${data.summary}\n\n`;

      if (data.skills) resumeText += `Skills: ${data.skills}\n\n`;

      if (data.experience.length > 0) {
        resumeText += "Experience:\n";
        data.experience.forEach(exp => {
          resumeText += `${exp.role} at ${exp.company} (${exp.duration})\n${exp.description}\n\n`;
        });
      }

      if (data.education.length > 0) {
        resumeText += "Education:\n";
        data.education.forEach(edu => {
          resumeText += `${edu.degree} from ${edu.school} (${edu.year})${edu.location ? `, ${edu.location}` : ''}\nCoursework: ${edu.coursework}\n\n`;
        });
      }

      if (data.projects.length > 0) {
        resumeText += "Projects:\n";
        data.projects.forEach(proj => {
          resumeText += `${proj.name}: ${proj.description}\n${proj.link}\n\n`;
        });
      }

      if (resumeText.length < 50) {
        toast.error("Resume content is too short for analysis. Please add more details.");
        clearInterval(interval);
        setAnalyzing(false);
        setAnalysisOpen(false);
        return;
      }

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured in this environment.");
      }

      const analysisPrompt = `You are an elite ATS engine AND a senior FAANG technical recruiter performing a comprehensive technical ATS audit of a software engineering resume.

You know exactly how modern ATS systems work:
- They use NLP + Named Entity Recognition to parse data into structured database fields.
- Scoring weights: Keyword Match (40-50%), Experience Depth & Timeline (30%), Structure & Readability (20-30%).
- They PENALIZE: skills listed without context, ambiguous dates, missing metrics, keyword stuffing.
- They REWARD: XYZ formula bullets, skills tied to specific experience blocks, spelled-out acronyms.

**SCORING BREAKDOWN:**

Keyword Match (0-50 pts):
- Are critical SW engineering keywords present? (REST API, CI/CD, Docker, AWS, Agile, system design, microservices)
- Are skills contextualized inside experience bullets, or only listed standalone in a Skills section? (context = full points, standalone only = half points)
- Are acronyms spelled out at least once? (e.g., "CI/CD" vs "Continuous Integration/Continuous Deployment (CI/CD)")
- Are tech names spelled correctly and fully? (MongoDB, Node.js, not "mongo" or "node")

Experience Depth (0-30 pts):
- Do bullets use the XYZ formula? ("Accomplished X, resulting in Y improvement, using Z technology")
- Are there quantifiable metrics? (percentages, user counts, latency numbers, data volumes)
- Dates in Month Year - Month Year format? (ambiguous dates like "2024-2025" = deductions)
- Skills tied to specific dated experience blocks (allows ATS to calculate years of experience)?

Structure & Readability (0-20 pts):
- Professional Summary present?
- Standard section headers used? (Professional Experience, Education, Technical Skills, Projects)
- Bullets start with action verbs?
- Contact info complete? (Email, Phone, LinkedIn, GitHub)

**OUTPUT FORMAT - Return STRICTLY this JSON:**
{
  "ats_score": number (0-100, be HIGHLY granular like 67, 73, 84 - NEVER round to 70, 80, etc.),
  "score_breakdown": {
    "keyword_match": number (0-50),
    "experience_depth": number (0-30),
    "structure_readability": number (0-20)
  },
  "keywords": {
    "present": ["array of found technical keywords"],
    "missing": ["array of highly specific missing keywords that would boost ATS score"]
  },
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": [
    "Specific actionable tip 1 with example rewrite",
    "Specific tip 2",
    "Specific tip 3",
    "Specific tip 4"
  ],
  "date_format_issues": "Assessment of date formats. Month Year - Month Year is ideal. List any problems found.",
  "skills_context_check": "Are skills mentioned inside experience bullets (good) or only in a standalone Skills section (bad)? Be specific.",
  "xyz_formula_check": "Do bullets use Accomplished X as measured by Y by doing Z? Provide one concrete example rewrite using XYZ format based on the actual resume content.",
  "structure_feedback": "Critique of section headers, ordering, and completeness.",
  "content_feedback": "Critique of bullet point quality - action verbs, metrics, and depth.",
  "overall_summary": "2-3 sentence professional summary of ATS standing and the single most impactful improvement."
}

**RESUME TO ANALYZE:**
${resumeText}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch analysis from AI.");

      const resData = await response.json();
      const aiContent = resData.choices?.[0]?.message?.content;
      if (!aiContent) throw new Error("Empty response from AI.");

      const analysisData = JSON.parse(aiContent.replace(/```json/g, "").replace(/```/g, "").trim());

      clearInterval(interval);
      setAtsProgress(100);
      setAnalysisResult(analysisData);
      toast.success("Analysis complete!");
    } catch (error: any) {
      clearInterval(interval);
      console.error("Analysis failed:", error);
      toast.error(error.message || "Failed to analyze resume. Please try again.");
      setAnalysisOpen(false);
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await extractResumeText(file);

      toast.info("Parsing resume data...");
      const { data: parsedData, error } = await supabase.functions.invoke("parse-resume", {
        body: { resumeText: text }
      });

      if (error) throw error;

      setData(prev => ({
        ...prev,
        ...parsedData,
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        leadership: parsedData.leadership || [],
        photo: prev.photo
      }));

      toast.success("Resume imported successfully!");
    } catch (error: any) {
      console.error("Import failed:", error);
      toast.error(error.message || "Failed to import resume");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Sidebar navigation list ---
  const sections = [
    { id: "personal", label: "Personal Info", desc: "Contact details & summary", icon: User, isComplete: !!data.fullName && !!data.email },
    { id: "experience", label: "Work History", desc: "Your experience list", icon: Briefcase, isComplete: data.experience.length > 0 },
    { id: "education", label: "Education", desc: "Degrees & school info", icon: GraduationCap, isComplete: data.education.length > 0 },
    { id: "projects", label: "Projects", desc: "Best work showcase", icon: LayoutTemplate, isComplete: data.projects.length > 0 },
    { id: "skills", label: "Skills", desc: "Tech stacks & tools", icon: Code, isComplete: !!data.skills },
    { id: "leadership", label: "Leadership & Extra", desc: "Activities & certificates", icon: Sparkles, isComplete: data.leadership.length > 0 }
  ];

  // --- Resume Document Templates Renderers ---

  // Template 1: Minimalist ATS (Standard Black & White)
  const renderMinimalist = () => {
    return (
      <div className="font-sans text-gray-900 leading-snug">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-black">{data.fullName || "YOUR NAME"}</h1>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[9pt] text-gray-600 mt-1">
            {data.location && <span>{data.location}</span>}
            {data.phone && <span>• {data.phone}</span>}
            {data.email && <span>• {data.email}</span>}
            {data.website && <span>• {data.website.replace(/^https?:\/\//, '')}</span>}
            {data.linkedin && <span>• {data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>}
            {data.github && <span>• {data.github.replace(/^https?:\/\/(www\.)?/, '')}</span>}
          </div>
        </div>

        {data.summary && (
          <div className="mb-4">
            <h2 className="text-[10.5pt] font-bold uppercase border-b border-gray-300 pb-0.5 mb-1.5 text-black">Profile</h2>
            <p className="text-[9.5pt] text-gray-700 leading-normal text-justify">{data.summary}</p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10.5pt] font-bold uppercase border-b border-gray-300 pb-0.5 mb-2 text-black">Experience</h2>
            <div className="space-y-3">
              {data.experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-[9.5pt] font-bold">
                    <span className="text-gray-900">{exp.company}</span>
                    <span className="font-normal italic text-gray-500 text-[9pt]">{exp.duration}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[9pt] italic text-gray-700 mb-1">
                    <span>{exp.role}</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-0.5 text-[9pt] text-gray-600 leading-normal">
                    {exp.description.split('\n').map((line, i) => line.trim() && (
                      <li key={i}>{line.trim().replace(/^[-•]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10.5pt] font-bold uppercase border-b border-gray-300 pb-0.5 mb-2 text-black">Projects</h2>
            <div className="space-y-3">
              {data.projects.map(proj => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-[9.5pt] font-bold">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900">{proj.name}</span>
                      {proj.link && <span className="text-[8.5pt] font-normal text-gray-500 font-sans">({proj.link.replace(/^https?:\/\//, '')})</span>}
                    </div>
                  </div>
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[9pt] text-gray-600 leading-normal">
                    {proj.description.split('\n').map((line, i) => line.trim() && (
                      <li key={i}>{line.trim().replace(/^[-•]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10.5pt] font-bold uppercase border-b border-gray-300 pb-0.5 mb-2 text-black">Education</h2>
            <div className="space-y-2">
              {data.education.map(edu => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline text-[9.5pt] font-bold">
                    <span className="text-gray-900">{edu.school}</span>
                    <span className="font-normal italic text-gray-500 text-[9pt]">{edu.year}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[9pt] text-gray-700 italic">
                    <span>{edu.degree}</span>
                    {edu.location && <span>{edu.location}</span>}
                  </div>
                  {edu.coursework && (
                    <p className="text-[8.5pt] text-gray-500 mt-0.5"><span className="font-bold text-gray-600">Coursework:</span> {edu.coursework}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.skills && (
          <div className="mb-4">
            <h2 className="text-[10.5pt] font-bold uppercase border-b border-gray-300 pb-0.5 mb-1.5 text-black">Technical Skills</h2>
            <p className="text-[9.5pt] text-gray-700 leading-normal">{data.skills}</p>
          </div>
        )}

        {data.leadership.length > 0 && (
          <div>
            <h2 className="text-[10.5pt] font-bold uppercase border-b border-gray-300 pb-0.5 mb-2 text-black">Activities & Certs</h2>
            <div className="space-y-2.5">
              {data.leadership.map(item => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline text-[9.5pt] font-bold">
                    <span className="text-gray-900">{item.organization} -- {item.role}</span>
                    <span className="font-normal italic text-gray-500 text-[9pt]">{item.duration}</span>
                  </div>
                  {item.description && (
                    <p className="text-[8.5pt] text-gray-600 mt-0.5 leading-normal">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Template 2: Modern Slate (Sidebar Layout)
  const renderSlate = () => {
    return (
      <div className="font-sans text-slate-800 leading-snug grid grid-cols-[1fr_1.8fr] gap-5 min-h-[277mm] -m-[10mm]">
        {/* Left Column (Sidebar tint) */}
        <div className="bg-slate-50 border-r border-slate-200/60 p-5 flex flex-col gap-5 -my-[10mm] -ml-[10mm] min-h-[297mm]">
          {/* Profile Photo */}
          {data.photo && (
            <div className="flex justify-center mt-3">
              <img src={data.photo} alt={data.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
            </div>
          )}
          
          {/* Contact Details */}
          <div>
            <h3 className="text-[9pt] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 border-b border-slate-200 pb-1">Contact</h3>
            <div className="space-y-2 text-[8.5pt] text-slate-600">
              {data.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="break-all">{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{data.phone}</span>
                </div>
              )}
              {data.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{data.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Profiles */}
          {(data.linkedin || data.github || data.website || data.leetcode || data.codeforces) && (
            <div>
              <h3 className="text-[9pt] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 border-b border-slate-200 pb-1">Profiles</h3>
              <div className="space-y-2 text-[8.5pt] text-slate-600">
                {data.linkedin && (
                  <div className="flex items-center gap-1.5">
                    <Linkedin className="w-3 h-3 text-[#0077b5] shrink-0" />
                    <span className="truncate">{data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </div>
                )}
                {data.github && (
                  <div className="flex items-center gap-1.5">
                    <Github className="w-3 h-3 text-slate-800 shrink-0" />
                    <span className="truncate">{data.github.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </div>
                )}
                {data.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{data.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
                {data.leetcode && (
                  <div className="flex items-center gap-1.5">
                    <Code className="w-3 h-3 text-yellow-600 shrink-0" />
                    <span>LeetCode</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills && (
            <div>
              <h3 className="text-[9pt] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 border-b border-slate-200 pb-1">Skills</h3>
              <div className="flex flex-wrap gap-1">
                {data.skills.split(',').map((skill, index) => (
                  <span key={index} className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[8.5pt] font-medium leading-tight">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div>
              <h3 className="text-[9pt] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 border-b border-slate-200 pb-1">Education</h3>
              <div className="space-y-3 text-[8.5pt]">
                {data.education.map(edu => (
                  <div key={edu.id} className="text-slate-600">
                    <div className="font-bold text-slate-800 leading-tight">{edu.school}</div>
                    <div className="mt-0.5">{edu.degree}</div>
                    <div className="text-[8pt] text-slate-400 font-medium mt-0.5">{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Main Content) */}
        <div className="py-4 pr-3">
          <div className="mb-5">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{data.fullName || "YOUR NAME"}</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wider">{data.experience[0]?.role || "Professional Resume"}</p>
          </div>

          {/* Profile Summary */}
          {data.summary && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">Profile</h2>
              <p className="text-[9pt] text-slate-600 leading-relaxed text-justify">{data.summary}</p>
            </div>
          )}

          {/* Work Experience */}
          {data.experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2.5">Experience</h2>
              <div className="space-y-3">
                {data.experience.map(exp => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-800 text-[9.5pt]">{exp.company}</h3>
                      <span className="text-[8.5pt] text-slate-400 italic">{exp.duration}</span>
                    </div>
                    <div className="text-[9pt] text-slate-500 font-semibold italic mt-0.5 mb-1">{exp.role}</div>
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-[8.5pt] text-slate-600 leading-relaxed">
                      {exp.description.split('\n').map((line, i) => line.trim() && (
                        <li key={i}>{line.trim().replace(/^[-•]\s*/, '')}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2.5">Projects</h2>
              <div className="space-y-3">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-800 text-[9.5pt]">{proj.name}</h3>
                      {proj.link && <span className="text-[8.5pt] text-blue-500 font-medium truncate max-w-xs">{proj.link.replace(/^https?:\/\//, '')}</span>}
                    </div>
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[8.5pt] text-slate-600 leading-relaxed">
                      {proj.description.split('\n').map((line, i) => line.trim() && (
                        <li key={i}>{line.trim().replace(/^[-•]\s*/, '')}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leadership */}
          {data.leadership.length > 0 && (
            <div>
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2.5">Activities & Leadership</h2>
              <div className="space-y-2">
                {data.leadership.map(item => (
                  <div key={item.id} className="text-[8.5pt] text-slate-600">
                    <div className="flex justify-between items-baseline font-bold text-slate-700">
                      <span>{item.organization} - {item.role}</span>
                      <span className="text-[8pt] text-slate-400 italic font-normal">{item.duration}</span>
                    </div>
                    {item.description && <p className="text-[8.5pt] text-slate-500 mt-0.5 leading-normal">{item.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Template 3: Executive Indigo (Royal Blue Banner)
  const renderExecutive = () => {
    return (
      <div className="font-serif text-zinc-900 leading-snug">
        {/* Top Indigo Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 -mx-[10mm] -mt-[10mm] mb-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">{data.fullName || "YOUR NAME"}</h1>
            <p className="text-[9.5pt] font-medium uppercase tracking-widest text-indigo-300 mt-1 font-sans">{data.experience[0]?.role || "Executive Professional"}</p>
          </div>
          <div className="text-[8.5pt] text-indigo-100 flex flex-col items-end gap-0.5 font-sans">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>{data.location}</span>}
            <div className="flex gap-2.5 mt-1 text-indigo-200">
              {data.linkedin && <span className="underline">LinkedIn</span>}
              {data.github && <span className="underline">GitHub</span>}
            </div>
          </div>
        </div>

        {data.summary && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-widest text-indigo-950 border-b border-indigo-200 pb-0.5 mb-1.5">Executive Summary</h2>
            <p className="text-[9pt] text-zinc-700 leading-normal text-justify font-sans">{data.summary}</p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-widest text-indigo-950 border-b border-indigo-200 pb-0.5 mb-2">Professional History</h2>
            <div className="space-y-3">
              {data.experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-[9.5pt] text-zinc-900">
                    <span>{exp.company}</span>
                    <span className="font-normal italic text-zinc-500 font-sans text-[8.5pt]">{exp.duration}</span>
                  </div>
                  <div className="text-[9pt] text-indigo-700 italic mt-0.5 mb-1 font-sans">{exp.role}</div>
                  <ul className="list-disc list-outside ml-4 space-y-0.5 text-[8.5pt] text-zinc-600 leading-normal font-sans">
                    {exp.description.split('\n').map((line, i) => line.trim() && (
                      <li key={i}>{line.trim().replace(/^[-•]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-widest text-indigo-950 border-b border-indigo-200 pb-0.5 mb-2">Notable Work</h2>
            <div className="space-y-3">
              {data.projects.map(proj => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline font-bold text-[9.5pt] text-zinc-900">
                    <span>{proj.name}</span>
                    {proj.link && <span className="font-normal text-[8.5pt] text-indigo-600 font-sans underline">{proj.link.replace(/^https?:\/\//, '')}</span>}
                  </div>
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-[8.5pt] text-zinc-600 leading-normal font-sans">
                    {proj.description.split('\n').map((line, i) => line.trim() && (
                      <li key={i}>{line.trim().replace(/^[-•]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-widest text-indigo-950 border-b border-indigo-200 pb-0.5 mb-2">Education & Credentials</h2>
            <div className="space-y-2">
              {data.education.map(edu => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline font-bold text-[9.5pt] text-zinc-900">
                    <span>{edu.school}</span>
                    <span className="font-normal italic text-zinc-500 font-sans text-[8.5pt]">{edu.year}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[9pt] text-zinc-600 italic font-sans">
                    <span>{edu.degree}</span>
                    {edu.location && <span>{edu.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.skills && (
          <div className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-widest text-indigo-950 border-b border-indigo-200 pb-0.5 mb-1 text-black">Areas of Expertise</h2>
            <p className="text-[9pt] text-zinc-700 leading-normal font-sans">{data.skills}</p>
          </div>
        )}
      </div>
    );
  };

  // Template 4: Developer Tech (Console / Monospace Style)
  const renderTech = () => {
    return (
      <div className="font-mono text-zinc-800 leading-relaxed text-[8.5pt]">
        {/* Terminal Header */}
        <div className="border-2 border-zinc-900 p-4 rounded-xl mb-4 bg-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl font-black text-zinc-950">&lt;{data.fullName || "DEV_NODE"}&gt;</h1>
            <p className="text-[7.5pt] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">console.log("Senior Developer")</p>
          </div>
          <div className="text-[7.5pt] text-zinc-600 space-y-0.5">
            {data.email && <div>$ mail: {data.email}</div>}
            {data.phone && <div>$ cell: {data.phone}</div>}
            {data.location && <div>$ loc:  {data.location}</div>}
            <div className="flex gap-2 mt-1.5 font-bold text-zinc-950">
              {data.linkedin && <span className="underline">/linkedin</span>}
              {data.github && <span className="underline">/github</span>}
            </div>
          </div>
        </div>

        {data.summary && (
          <div className="mb-4">
            <h2 className="text-[9pt] font-black uppercase text-zinc-900 border-b border-zinc-300 pb-0.5 mb-1.5">// Profile Summary</h2>
            <p className="text-[8.5pt] text-zinc-700 font-sans leading-normal text-justify">{data.summary}</p>
          </div>
        )}

        {data.skills && (
          <div className="mb-4">
            <h2 className="text-[9pt] font-black uppercase text-zinc-900 border-b border-zinc-300 pb-0.5 mb-2">// Tech Stack</h2>
            <div className="flex flex-wrap gap-1">
              {data.skills.split(',').map((skill, index) => (
                <span key={index} className="bg-zinc-950 text-white font-bold px-2 py-0.5 rounded text-[8pt] border border-zinc-800">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[9pt] font-black uppercase text-zinc-900 border-b border-zinc-300 pb-0.5 mb-3">// Experience.log</h2>
            <div className="relative pl-3 border-l border-zinc-300 space-y-4">
              {data.experience.map(exp => (
                <div key={exp.id} className="relative">
                  <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 bg-zinc-950 rounded-full border border-zinc-300" />
                  <div className="flex justify-between items-baseline font-black text-zinc-950 text-[8.5pt]">
                    <span>{exp.company} -- {exp.role}</span>
                    <span className="font-normal text-[8pt] text-zinc-500 italic">{exp.duration}</span>
                  </div>
                  <ul className="list-none space-y-0.5 mt-1 pl-0 text-[8pt] text-zinc-700 font-sans">
                    {exp.description.split('\n').map((line, i) => line.trim() && (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-zinc-400 select-none">▶</span>
                        <span>{line.trim().replace(/^[-•]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[9pt] font-black uppercase text-zinc-900 border-b border-zinc-300 pb-0.5 mb-2">// Projects.md</h2>
            <div className="space-y-3">
              {data.projects.map(proj => (
                <div key={proj.id} className="border border-zinc-200 p-2.5 rounded-lg bg-zinc-50/50">
                  <div className="flex justify-between items-baseline font-black text-zinc-950 text-[8.5pt]">
                    <span>{proj.name}</span>
                    {proj.link && <span className="font-normal text-[7.5pt] text-zinc-500 underline">{proj.link.replace(/^https?:\/\//, '')}</span>}
                  </div>
                  <ul className="list-none space-y-0.5 mt-1 text-[8pt] text-zinc-700 font-sans">
                    {proj.description.split('\n').map((line, i) => line.trim() && (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-zinc-400 select-none">::</span>
                        <span>{line.trim().replace(/^[-•]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div>
            <h2 className="text-[9pt] font-black uppercase text-zinc-900 border-b border-zinc-300 pb-0.5 mb-2">// Academic.edu</h2>
            <div className="space-y-2">
              {data.education.map(edu => (
                <div key={edu.id} className="text-[8pt] text-zinc-700">
                  <div className="flex justify-between items-baseline font-bold text-zinc-900">
                    <span>{edu.school}</span>
                    <span className="font-normal text-[7.5pt] text-zinc-500">{edu.year}</span>
                  </div>
                  <div className="mt-0.5">{edu.degree} {edu.location && `[${edu.location}]`}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030303] text-foreground flex flex-col font-sans selection:bg-violet-500/30 overflow-hidden relative">
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white; color: black; }
            .print-container {
              padding: 0;
              margin: 0;
              width: 100%;
              max-width: none;
              box-shadow: none;
              border: none;
              transform: none !important;
            }
            @page { margin: 0.5cm; }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.16);
          }
        `}
      </style>

      {/* Decorative Background Pulsing Glows - Violet/Fuchsia Voke Signature theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden no-print z-0 bg-[#030303]">
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-violet-600/15 via-purple-600/5 to-transparent rounded-full blur-[140px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-tl from-fuchsia-600/10 via-pink-600/5 to-transparent rounded-full blur-[140px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[35%] left-[20%] w-[450px] h-[450px] bg-indigo-600/5 rounded-full blur-[130px]" />
      </div>

      {/* Voke Themed Header */}
      <header className="h-16 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl flex items-center justify-between px-6 z-20 no-print sticky top-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')} 
            className="hover:bg-white/5 text-zinc-400 hover:text-white transition-all rounded-xl h-9 w-9"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 p-2 rounded-xl border border-violet-500/20 shadow-md shadow-violet-500/5">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Resume Workspace
              </h1>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">AI Copilot Active</p>
            </div>
          </div>
        </div>

        {/* Strength Progress Area - Violet/Fuchsia Gradient */}
        <div className="hidden md:flex items-center gap-4 w-1/4">
          <div className="flex-1">
            <div className="flex justify-between text-[11px] mb-1 font-semibold text-zinc-400">
              <span>Builder Progress</span>
              <span className={progress === 100 ? "text-emerald-400" : "text-violet-400"}>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-500 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            onChange={handleImportResume}
          />
          <Button
            onClick={handleImportClick}
            disabled={importing}
            className="bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition-all text-xs h-9 rounded-xl"
          >
            {importing ? <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
            Import PDF
          </Button>

          <Button
            onClick={handleAnalyzeResume}
            disabled={analyzing}
            className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-violet-200 border border-violet-500/20 transition-all text-xs h-9 rounded-xl font-semibold"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${analyzing ? 'animate-spin' : ''}`} />
            ATS Audit
          </Button>

          <Button 
            variant="ghost" 
            onClick={handlePrint} 
            className="text-zinc-400 hover:text-white hover:bg-white/5 text-xs h-9 rounded-xl transition-all"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>

          <Button 
            onClick={handlePrint} 
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs h-9 rounded-xl shadow-lg shadow-violet-500/10 transition-all hover:scale-[1.02] border-0"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </header>

      {/* Main Split Layout Workspace */}
      <main className="flex-1 flex overflow-hidden z-10 relative">

        {/* LEFT PANEL: Sidebar Tab workflow and Editor Content */}
        <div className="w-[45%] border-r border-white/5 bg-zinc-950/20 backdrop-blur-md flex no-print">
          {/* Vertical Form Sections Sidebar - Violet active accents */}
          <div className="w-52 border-r border-white/5 bg-zinc-950/40 flex flex-col p-3 gap-1.5 shrink-0 justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 px-3.5 py-2 tracking-wider">Sections</span>
              {sections.map((sec) => {
                const Icon = sec.icon;
                const active = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between gap-3 group transition-all duration-300 ${
                      active 
                        ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border-l-2 border-violet-500 text-white bg-zinc-900/60' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">{sec.label}</div>
                        <div className="text-[9px] text-zinc-500 truncate leading-tight group-hover:text-zinc-400 transition-colors mt-0.5">{sec.desc}</div>
                      </div>
                    </div>
                    {sec.isComplete ? (
                      <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 shrink-0 group-hover:bg-zinc-500 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Status / Developer Card */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                <BadgeAlert className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>ATS Quality Standard</span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-normal">Your draft complies with single-page layout standards.</p>
            </div>
          </div>

          {/* Form Content Scroll Pane - Violet focus accents */}
          <ScrollArea className="flex-1 custom-scrollbar bg-black/10">
            <div className="p-6 max-w-xl mx-auto space-y-6 pb-24">
              
              {/* Personal Information form fields */}
              {activeTab === "personal" && (
                <Card className="bg-zinc-900/40 border border-white/10 text-white backdrop-blur-xl shadow-[0_8px_32px_0_rgba(124,58,237,0.02)] rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                      <User className="w-4 h-4 text-violet-400" />
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">Manage your brand info and contact channels.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-medium">Full Name</Label>
                        <Input 
                          placeholder="e.g. John Doe" 
                          value={data.fullName} 
                          onChange={(e) => handleChange('fullName', e.target.value)} 
                          className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-medium">Profile Image (Optional)</Label>
                        <div className="flex items-center gap-2">
                          {data.photo && <img src={data.photo} alt="Preview" className="w-7 h-7 rounded-full object-cover border border-white/10" />}
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                            className="bg-white/5 border border-white/10 text-xs file:text-white file:bg-white/10 file:border-0 file:rounded-lg file:px-2 file:py-1 file:mr-2 text-zinc-500 h-9 p-1 rounded-xl focus:border-violet-500/40 transition-all duration-300" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-medium">Email Address</Label>
                        <Input 
                          placeholder="john@example.com" 
                          value={data.email} 
                          onChange={(e) => handleChange('email', e.target.value)} 
                          className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-medium">Phone Number</Label>
                        <Input 
                          placeholder="+1 234 567 890" 
                          value={data.phone} 
                          onChange={(e) => handleChange('phone', e.target.value)} 
                          className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs font-medium">Location</Label>
                      <Input 
                        placeholder="e.g. San Francisco, CA" 
                        value={data.location} 
                        onChange={(e) => handleChange('location', e.target.value)} 
                        className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="text-zinc-400 text-xs font-medium block">Social Links & Portfolios</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                          <Input 
                            placeholder="LinkedIn URL" 
                            value={data.linkedin} 
                            onChange={(e) => handleChange('linkedin', e.target.value)} 
                            className="pl-9 bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                          />
                        </div>
                        <div className="relative">
                          <Github className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                          <Input 
                            placeholder="GitHub URL" 
                            value={data.github} 
                            onChange={(e) => handleChange('github', e.target.value)} 
                            className="pl-9 bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                          />
                        </div>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                          <Input 
                            placeholder="Portfolio URL" 
                            value={data.website} 
                            onChange={(e) => handleChange('website', e.target.value)} 
                            className="pl-9 bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                          />
                        </div>
                        <div className="relative">
                          <Code className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                          <Input 
                            placeholder="LeetCode URL" 
                            value={data.leetcode} 
                            onChange={(e) => handleChange('leetcode', e.target.value)} 
                            className="pl-9 bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 placeholder:text-white/10 transition-all duration-300" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <Label className="text-zinc-400 text-xs font-semibold">Professional Bio Summary</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2.5 text-[10px] font-bold transition-all rounded-lg ${isAiEnhancing ? 'bg-violet-500/20 text-violet-400' : 'text-violet-400 hover:bg-violet-500/10'}`}
                          onClick={handleAiEnhance}
                          disabled={isAiEnhancing}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          {isAiEnhancing ? "Refining..." : "AI Enhance"}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Briefly state your core background accomplishments..."
                        className="h-28 resize-none bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl placeholder:text-white/10 leading-relaxed custom-scrollbar transition-all duration-300"
                        value={data.summary}
                        onChange={(e) => handleChange('summary', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Work Experience Tab Form */}
              {activeTab === "experience" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-white">Work History</h3>
                      <p className="text-[11px] text-zinc-500">Record your timeline of roles.</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={addExperience} 
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs h-8 rounded-xl transition-all duration-300"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Role
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.experience.map((exp) => (
                      <Card key={exp.id} className="relative group bg-zinc-900/30 border border-white/10 text-white rounded-2xl overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            onClick={() => removeExperience(exp.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <CardContent className="pt-5 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Company</Label>
                              <Input 
                                placeholder="e.g. Microsoft" 
                                value={exp.company} 
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Job Role Title</Label>
                              <Input 
                                placeholder="e.g. Software Engineer" 
                                value={exp.role} 
                                onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Employment Period</Label>
                            <Input 
                              placeholder="e.g. Jun 2021 - Present" 
                              value={exp.duration} 
                              onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)} 
                              className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between mb-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Key Duties & Accomplishments</Label>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleAiEnhanceExperience(exp.id, exp.description)}
                                disabled={enhancingExpId === exp.id}
                                className="h-5 px-1.5 text-[9px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-1 rounded-md transition-all font-semibold"
                              >
                                <Sparkles className={`w-2.5 h-2.5 ${enhancingExpId === exp.id ? 'animate-spin' : ''}`} />
                                {enhancingExpId === exp.id ? 'Enhancing...' : 'AI Enhance'}
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Describe your achievements (each starting on a new line)..."
                              className="h-24 resize-none bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl custom-scrollbar transition-all duration-300"
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {data.experience.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-zinc-500 flex flex-col items-center justify-center gap-2">
                      <Briefcase className="w-8 h-8 opacity-25" />
                      <span className="text-xs">No experience added yet. Add your positions above.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Education Tab Form */}
              {activeTab === "education" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-white">Education History</h3>
                      <p className="text-[11px] text-zinc-500">Record your academic credentials.</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={addEducation} 
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs h-8 rounded-xl transition-all duration-300"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add School
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.education.map((edu) => (
                      <Card key={edu.id} className="relative group bg-zinc-900/30 border border-white/10 text-white rounded-2xl overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            onClick={() => removeEducation(edu.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <CardContent className="pt-5 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Institution / School</Label>
                              <Input 
                                placeholder="e.g. Stanford University" 
                                value={edu.school} 
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Degree / Major</Label>
                              <Input 
                                placeholder="e.g. BS Computer Science" 
                                value={edu.degree} 
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Year of Graduation</Label>
                              <Input 
                                placeholder="e.g. 2018 - 2022" 
                                value={edu.year} 
                                onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Location</Label>
                              <Input 
                                placeholder="e.g. Stanford, CA" 
                                value={edu.location} 
                                onChange={(e) => updateEducation(edu.id, 'location', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Coursework (Optional)</Label>
                            <Textarea
                              placeholder="Describe relevant study areas..."
                              className="h-16 resize-none bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl custom-scrollbar transition-all duration-300"
                              value={edu.coursework || ""}
                              onChange={(e) => updateEducation(edu.id, 'coursework', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {data.education.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-zinc-500 flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="w-8 h-8 opacity-25" />
                      <span className="text-xs">No educational items logged. Add one above.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Projects Tab Form */}
              {activeTab === "projects" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-white">Projects</h3>
                      <p className="text-[11px] text-zinc-500">Exhibit your development projects.</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={addProject} 
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs h-8 rounded-xl transition-all duration-300"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.projects.map((proj) => (
                      <Card key={proj.id} className="relative group bg-zinc-900/30 border border-white/10 text-white rounded-2xl overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            onClick={() => removeProject(proj.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <CardContent className="pt-5 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Project Name</Label>
                              <Input 
                                placeholder="e.g. AI Portfolio Suite" 
                                value={proj.name} 
                                onChange={(e) => updateProject(proj.id, 'name', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Project URL Link</Label>
                                {proj.link && (proj.link.toLowerCase().includes('github.com') || (proj.link.split('/').length === 2 && !proj.link.includes('.'))) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleFetchGitHubProject(proj.id, proj.link)}
                                    disabled={fetchingRepoId === proj.id}
                                    className="h-5 px-1.5 text-[9px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1 rounded-md transition-all font-semibold"
                                  >
                                    <Github className={`w-2.5 h-2.5 ${fetchingRepoId === proj.id ? 'animate-spin' : ''}`} />
                                    {fetchingRepoId === proj.id ? 'Importing...' : 'Fetch & Write with AI'}
                                  </Button>
                                )}
                              </div>
                              <Input 
                                placeholder="e.g. github.com/owner/repo" 
                                value={proj.link} 
                                onChange={(e) => updateProject(proj.id, 'link', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between mb-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Project Details / Stack</Label>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleAiEnhanceProject(proj.id, proj.description)}
                                disabled={enhancingProjId === proj.id}
                                className="h-5 px-1.5 text-[9px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-1 rounded-md transition-all font-semibold"
                              >
                                <Sparkles className={`w-2.5 h-2.5 ${enhancingProjId === proj.id ? 'animate-spin' : ''}`} />
                                {enhancingProjId === proj.id ? 'Enhancing...' : 'AI Enhance'}
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Describe implementation details & key results..."
                              className="h-20 resize-none bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl custom-scrollbar transition-all duration-300"
                              value={proj.description}
                              onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {data.projects.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-zinc-500 flex flex-col items-center justify-center gap-2">
                      <LayoutTemplate className="w-8 h-8 opacity-25" />
                      <span className="text-xs">No projects added yet. Click the button to add.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Skills Tab Form */}
              {activeTab === "skills" && (
                <Card className="bg-zinc-900/40 border border-white/10 text-white backdrop-blur-xl shadow-[0_8px_32px_0_rgba(124,58,237,0.02)] rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Code className="w-4 h-4 text-violet-400" />
                      Skills & Tech Stack
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">Separate skills with commas to create tag badges.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs font-semibold">Technical / Professional Skills</Label>
                      <Textarea
                        placeholder="e.g. React, Node.js, Python, PostgreSQL, AWS, Docker, Kubernetes..."
                        className="h-32 bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl placeholder:text-white/10 custom-scrollbar leading-relaxed transition-all duration-300"
                        value={data.skills}
                        onChange={(e) => handleChange('skills', e.target.value)}
                      />
                    </div>
                    <div className="pt-2">
                      <Label className="mb-2 block text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Live Badges Preview</Label>
                      <div className="flex flex-wrap gap-1.5 p-3.5 bg-zinc-950/40 rounded-xl border border-white/5 min-h-[4rem]">
                        {data.skills.split(',').filter(s => s.trim()).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border-violet-500/10 text-xs px-2.5 py-0.5 rounded-lg">
                            {skill.trim()}
                          </Badge>
                        ))}
                        {data.skills.split(',').filter(s => s.trim()).length === 0 && (
                          <span className="text-zinc-600 text-xs italic">Type skills above to view tags preview...</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leadership & Activities Form */}
              {activeTab === "leadership" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-white">Activities / Honors / Certs</h3>
                      <p className="text-[11px] text-zinc-500">Add extracurricular achievements.</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={addLeadership} 
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs h-8 rounded-xl transition-all duration-300"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.leadership.map((item) => (
                      <Card key={item.id} className="relative group bg-zinc-900/30 border border-white/10 text-white rounded-2xl overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            onClick={() => removeLeadership(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <CardContent className="pt-5 space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Item Type</Label>
                            <Select value={item.type} onValueChange={(value: any) => updateLeadership(item.id, 'type', value)}>
                              <SelectTrigger className="bg-white/5 border border-white/10 text-white text-xs h-9 rounded-xl focus:border-violet-500/40 focus:ring-violet-500/10 transition-all duration-300">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border border-white/10 text-white text-xs">
                                <SelectItem value="Leadership">Leadership & Volunteering</SelectItem>
                                <SelectItem value="Hackathon">Hackathon & Contest</SelectItem>
                                <SelectItem value="Certificate">Professional Certificate</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                                {item.type === 'Hackathon' ? 'Role / Placement' :
                                  item.type === 'Certificate' ? 'Certificate Name' : 'Role Title'}
                              </Label>
                              <Input
                                placeholder={
                                  item.type === 'Hackathon' ? "e.g. Winner (1st/500)" :
                                    item.type === 'Certificate' ? "e.g. AWS Certified Developer" : "e.g. Project Lead"
                                }
                                value={item.role}
                                onChange={(e) => updateLeadership(item.id, 'role', e.target.value)}
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                                {item.type === 'Hackathon' ? 'Contest / Organizer' :
                                  item.type === 'Certificate' ? 'Issuer Organization' : 'Organization'}
                              </Label>
                              <Input
                                placeholder={
                                  item.type === 'Hackathon' ? "e.g. Stanford Hackathon" :
                                    item.type === 'Certificate' ? "e.g. Amazon Web Services" : "e.g. Open Source Club"
                                }
                                value={item.organization}
                                onChange={(e) => updateLeadership(item.id, 'organization', e.target.value)}
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Period / Date Achieved</Label>
                              <Input 
                                placeholder="e.g. 2021 - 2022" 
                                value={item.duration} 
                                onChange={(e) => updateLeadership(item.id, 'duration', e.target.value)} 
                                className="bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl h-9 transition-all duration-300" 
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Short Details (Optional)</Label>
                            <Textarea
                              placeholder="Brief description..."
                              className="h-16 resize-none bg-white/5 border border-white/10 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 text-xs rounded-xl custom-scrollbar transition-all duration-300"
                              value={item.description}
                              onChange={(e) => updateLeadership(item.id, 'description', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {data.leadership.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-zinc-500 flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-8 h-8 opacity-25" />
                      <span className="text-xs">No leadership or extracurricular credits logged.</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </ScrollArea>
        </div>

        {/* RIGHT PANEL: Live Interactive Resume Preview (Canvas) */}
        <div className="flex-1 bg-[#09090b] flex flex-col relative overflow-hidden h-[calc(100vh-4rem)] select-none">
          {/* Subtle grid mesh overlay for canvas preview */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none z-0" />

          {/* Premium Floating Template Bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-full flex gap-1.5 shadow-xl shadow-black/40">
            {[
              { id: 'minimalist', label: 'ATS Clean' },
              { id: 'slate', label: 'Modern Slate' },
              { id: 'executive', label: 'Executive' },
              { id: 'tech', label: 'Tech Console' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  selectedTemplate === t.id 
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20 scale-105' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Document container inside scroll view - with glowing Violet drop shadow around the paper */}
          <ScrollArea className="flex-1 custom-scrollbar relative z-10 w-full">
            <div 
              className="w-full flex justify-center py-20 transition-all duration-300"
              style={{ height: `${297 * zoom + 120}mm` }}
            >
              <div 
                className="print-container bg-white shadow-[0_20px_50px_rgba(139,92,246,0.15)] border border-gray-100/60 w-[210mm] min-h-[297mm] p-[10mm] text-left relative transition-all duration-300 ease-in-out origin-top text-gray-900"
                style={{ transform: `scale(${zoom})` }}
              >
                {selectedTemplate === 'minimalist' && renderMinimalist()}
                {selectedTemplate === 'slate' && renderSlate()}
                {selectedTemplate === 'executive' && renderExecutive()}
                {selectedTemplate === 'tech' && renderTech()}
              </div>
            </div>
          </ScrollArea>

          {/* Floating Zoom Action Toolbar */}
          <div className="absolute bottom-4 right-4 z-20 bg-zinc-900/90 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xl shadow-black/40">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.05))} 
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg shrink-0"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold font-mono text-zinc-300 w-11 text-center select-none shrink-0">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setZoom(prev => Math.min(1.25, prev + 0.05))} 
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg shrink-0"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-3.5 bg-white/10 shrink-0" />
            <Button 
              variant="ghost" 
              onClick={() => setZoom(0.85)} 
              className="h-7 px-2 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-1 shrink-0"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>

      </main >

      {/* ATS Evaluation Audit Dialog */}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-white/10 text-white rounded-3xl custom-scrollbar no-print">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              Resume ATS score and audit results
            </DialogTitle>
          </DialogHeader>
          {analysisResult ? (
            <div className="space-y-4">
              <ResumeAnalysisDisplay analysis={analysisResult} />

              {/* ─── Make ATS Friendly CTA ─── */}
              <div className="p-4 bg-gradient-to-br from-violet-950/60 to-fuchsia-950/40 border border-violet-500/20 rounded-2xl flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Auto-Optimize Your Entire Resume for ATS</p>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      One click — AI rewrites your summary, every work experience bullet, and every project 
                      description to be fully ATS-optimized with power verbs, metrics, and high-value keywords.
                    </p>
                  </div>
                </div>

                {makingAtsFriendly && atsFriendlyProgress && (
                  <div className="flex items-center gap-2 text-xs text-violet-300 bg-violet-500/10 rounded-xl px-3 py-2 border border-violet-500/20">
                    <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>{atsFriendlyProgress}</span>
                  </div>
                )}

                <Button
                  onClick={handleMakeAtsFriendly}
                  disabled={makingAtsFriendly}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl h-10 text-sm shadow-lg shadow-violet-500/20 transition-all disabled:opacity-60"
                >
                  {makingAtsFriendly ? (
                    <><Sparkles className="w-4 h-4 mr-2 animate-spin" />{atsFriendlyProgress || 'Optimizing...'}</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Make My Resume ATS Friendly</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-6 w-full max-w-md mx-auto">
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-12 h-12 animate-spin text-violet-500 opacity-60 absolute" />
                <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              </div>
              <div className="text-center space-y-2 w-full px-6">
                <p className="text-sm font-semibold text-white">Running ATS Diagnostics...</p>
                <p className="text-xs text-zinc-400">Parsing structure, evaluating keywords, and grading impact.</p>
                
                <div className="w-full bg-zinc-900 rounded-full h-2 mt-4 overflow-hidden border border-white/5 relative">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-500 h-full rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${Math.round(atsProgress)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-2 px-1">
                  <span>{atsTimeElapsed}s elapsed</span>
                  <span className="text-violet-400 font-bold">{Math.round(atsProgress)}%</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeBuilder;
