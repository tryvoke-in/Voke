import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Brain, LogOut, Upload, FileText, TrendingUp, Target, Award, Calendar,
  User, Briefcase, Activity, Sparkles, MessageSquare, BarChart3,
  Github, Code, Terminal, Zap, Shield, Crown, ChevronRight, Settings, Camera, Check,
  Loader2, Mic, ArrowRight, GraduationCap, Plus, Trash2, Globe, Mail, Phone, MapPin,
  Linkedin, CheckCircle2, AlertCircle, Save, ExternalLink, BookOpen, Layers
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import InterviewAnalytics from "@/components/InterviewAnalytics";
import AICoachChat from "@/components/AICoachChat";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { loadUserProfileContext } from "@/utils/profileContext";

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

interface EducationItem {
  id: string;
  degree: string;
  school: string;
  year: string;
  coursework?: string;
  location?: string;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link: string;
}

interface ResumeDataState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingResume, setSavingResume] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [diagLog, setDiagLog] = useState<string[]>([]);
  
  const logDiag = (msg: string) => {
    setDiagLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };
  const [formData, setFormData] = useState({
    full_name: "",
    codeforces_id: "",
    leetcode_id: "",
    github_url: "",
  });
  const [userRepos, setUserRepos] = useState<{ name: string; description: string; language: string; summary: string }[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const [resumeData, setResumeData] = useState<ResumeDataState>(() => {
    try {
      const saved = localStorage.getItem('voke_resume_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fullName: parsed.fullName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          targetRole: parsed.targetRole || parsed.role || "",
          linkedin: parsed.linkedin || "",
          github: parsed.github || "",
          website: parsed.website || "",
          summary: parsed.summary || "",
          skills: parsed.skills || "",
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          education: Array.isArray(parsed.education) ? parsed.education : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        };
      }
    } catch (e) {
      console.error("Failed to parse saved resume data", e);
    }
    return {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      targetRole: "",
      linkedin: "",
      github: "",
      website: "",
      summary: "",
      skills: "",
      experience: [
        {
          id: "exp-1",
          role: "",
          company: "",
          duration: "",
          description: "",
        }
      ],
      education: [
        {
          id: "edu-1",
          degree: "",
          school: "",
          year: "",
          coursework: "",
          location: "",
        }
      ],
      projects: [
        {
          id: "proj-1",
          name: "",
          description: "",
          link: "",
        }
      ],
    };
  });

  const suggestedSkills = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
    "Java", "C++", "Go", "PostgreSQL", "MongoDB", "Redis", "Docker",
    "Kubernetes", "AWS", "GraphQL", "Tailwind CSS", "System Design", "Git", "REST APIs"
  ];

  const handleAddSkillTag = (skillName: string) => {
    const rawSkills = resumeData.skills ? resumeData.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    if (!rawSkills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
      const nextSkills = [...rawSkills, skillName].join(", ");
      setResumeData(prev => ({ ...prev, skills: nextSkills }));
    }
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    const rawSkills = resumeData.skills ? resumeData.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const nextSkills = rawSkills.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase()).join(", ");
    setResumeData(prev => ({ ...prev, skills: nextSkills }));
  };

  const handleAddExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now().toString(),
          role: "",
          company: "",
          duration: "",
          description: "",
        }
      ]
    }));
  };

  const handleRemoveExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof ExperienceItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const handleAddEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: Date.now().toString(),
          degree: "",
          school: "",
          year: "",
          coursework: "",
          location: "",
        }
      ]
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const handleAddProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: Date.now().toString(),
          name: "",
          description: "",
          link: "",
        }
      ]
    }));
  };

  const handleRemoveProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  const handleUpdateProject = (id: string, field: keyof ProjectItem, value: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj)
    }));
  };

  const getResumeReadiness = () => {
    const checks = [
      { id: "contact", label: "Contact Info", isDone: Boolean(resumeData.fullName && resumeData.email && (resumeData.phone || resumeData.location)) },
      { id: "role", label: "Target Role", isDone: Boolean(resumeData.targetRole) },
      { id: "summary", label: "Summary", isDone: Boolean(resumeData.summary && resumeData.summary.trim().length >= 20) },
      { id: "skills", label: "Core Skills", isDone: Boolean(resumeData.skills && resumeData.skills.trim().length >= 3) },
      { id: "experience", label: "Experience", isDone: resumeData.experience.some(exp => Boolean(exp.role && exp.company)) },
      { id: "education", label: "Education", isDone: resumeData.education.some(edu => Boolean(edu.degree && edu.school)) },
      { id: "projects", label: "Projects", isDone: resumeData.projects.some(proj => Boolean(proj.name)) },
    ];

    const completed = checks.filter(c => c.isDone).length;
    const percentage = Math.round((completed / checks.length) * 100);
    return { checks, completed, total: checks.length, percentage };
  };

  const handleSaveResumeData = async () => {
    setSavingResume(true);
    try {
      // 1. Sync to local storage for ResumeBuilder
      let existingMerged: any = {};
      try {
        const existing = localStorage.getItem('voke_resume_data');
        if (existing) existingMerged = JSON.parse(existing);
      } catch (e) {}

      const updatedResume = {
        ...existingMerged,
        ...resumeData,
        fullName: resumeData.fullName || formData.full_name,
        email: resumeData.email || profile?.email,
        github: resumeData.github || formData.github_url,
        linkedin: resumeData.linkedin,
        leetcode: formData.leetcode_id,
        codeforces: formData.codeforces_id,
      };

      localStorage.setItem('voke_resume_data', JSON.stringify(updatedResume));

      // 2. Update Supabase profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            full_name: resumeData.fullName || formData.full_name,
            target_role: resumeData.targetRole,
            linkedin_url: resumeData.linkedin,
            github_url: resumeData.github || formData.github_url,
          })
          .eq("id", user.id);

        setProfile((prev: any) => ({
          ...prev,
          full_name: resumeData.fullName || formData.full_name,
          target_role: resumeData.targetRole,
          linkedin_url: resumeData.linkedin,
          github_url: resumeData.github || formData.github_url,
        }));
        setFormData(prev => ({
          ...prev,
          full_name: resumeData.fullName || prev.full_name,
          github_url: resumeData.github || prev.github_url,
        }));
      }

      toast.success("Resume details saved & synchronized!");
    } catch (error: any) {
      console.error("Error saving resume details:", error);
      toast.error("Failed to save resume details");
    } finally {
      setSavingResume(false);
    }
  };

  useEffect(() => {
    if (formData.github_url || profile?.github_url) {
      setLoadingRepos(true);
      loadUserProfileContext().then(ctx => {
        if (ctx.githubRepos) {
          setUserRepos(ctx.githubRepos);
        }
        setLoadingRepos(false);
      });
    }
  }, [formData.github_url, profile?.github_url]);
  const [codingStats, setCodingStats] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedSessions: 0,
    averageScore: 0,
    peerSessions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [skillGaps, setSkillGaps] = useState<any[]>([]);


  useEffect(() => {
    // Safety watchdog: force-disable loading screen after 1.5 seconds if auth or query hangs
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const initialize = async () => {
      try {
        logDiag("Starting init...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          logDiag("No session found, redirecting to /auth...");
          navigate("/auth");
          return;
        }
        
        const userId = session.user.id;
        logDiag(`Session verified for user ID: ${userId}`);

        logDiag("Loading profile...");
        await loadProfile(userId, session.user);
        logDiag("Profile loaded successfully!");

        logDiag("Loading stats...");
        await loadStats(userId);
        logDiag("Stats loaded successfully!");

        logDiag("Loading recent activity...");
        await loadRecentActivity(userId);
        logDiag("Recent activity loaded successfully!");

        logDiag("Loading skill gaps...");
        await loadSkillGaps(userId);
        logDiag("Skill gaps loaded successfully!");

      } catch (err: any) {
        logDiag(`Init error: ${err.message || String(err)}`);
        console.error("[Profile Init] Error initializing profile page:", err);
        setInitError(err.message || String(err));
      } finally {
        logDiag("Init finished!");
        setLoading(false);
      }
    };

    initialize();

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const loadProfile = async (userId?: string, user?: any) => {
    try {
      let activeUserId = userId;
      let activeUser = user;

      if (!activeUserId || !activeUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          activeUserId = session.user.id;
          activeUser = session.user;
        }
      }

      if (!activeUserId) {
        console.warn("[loadProfile] No active user ID found, aborting load.");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeUserId)
        .maybeSingle();

      let loadedProfile: any = null;
      const userMetadata = activeUser?.user_metadata || {};

      if (profileData) {
        loadedProfile = { ...profileData };
      } else {
        // Fallback: create profile locally from userMetadata
        loadedProfile = {
          id: activeUserId,
          full_name: "",
          avatar_url: null,
          created_at: new Date().toISOString()
        };
      }

      // Populate email
      if (!loadedProfile.email && activeUser?.email) {
        loadedProfile.email = activeUser.email;
      }

      // Fallback to Google Avatar/Name if not set in profile
      if (!loadedProfile.avatar_url && userMetadata?.avatar_url) {
        loadedProfile.avatar_url = userMetadata.avatar_url;
      }
      if ((!loadedProfile.full_name || loadedProfile.full_name === "Anonymous User") && (userMetadata?.full_name || userMetadata?.name)) {
        loadedProfile.full_name = userMetadata.full_name || userMetadata.name;
      }

      // If full_name is still empty or "Anonymous User", let's use email prefix
      if (!loadedProfile.full_name || loadedProfile.full_name === "Anonymous User") {
        loadedProfile.full_name = activeUser?.email?.split('@')[0] || "Anonymous User";
      }

      setProfile(loadedProfile);
      setAuthUser(activeUser);
      setFormData({
        full_name: loadedProfile.full_name || "",
        codeforces_id: loadedProfile.codeforces_id || "",
        leetcode_id: loadedProfile.leetcode_id || "",
        github_url: loadedProfile.github_url || "",
      });
      setResumeData(prev => ({
        ...prev,
        fullName: prev.fullName || loadedProfile.full_name || "",
        email: prev.email || loadedProfile.email || activeUser?.email || "",
        targetRole: prev.targetRole || loadedProfile.target_role || loadedProfile.role || "",
        github: prev.github || loadedProfile.github_url || "",
        linkedin: prev.linkedin || loadedProfile.linkedin_url || "",
      }));
      if (loadedProfile.coding_stats) {
        setCodingStats(loadedProfile.coding_stats);
      }



      // If the row was missing in the database, attempt to create it on the fly so it persists
      if (!profileData) {
        await supabase
          .from("profiles")
          .insert([{
            id: activeUserId,
            email: loadedProfile.email,
            full_name: loadedProfile.full_name,
            avatar_url: loadedProfile.avatar_url
          }]);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setProfileError(error.message || String(error));
    }
  };

  const loadStats = async (userId: string) => {
    try {
      const [textRes, videoRes, peerRes] = await Promise.all([
        supabase.from("interview_sessions").select("overall_score, status, completed_at").eq("user_id", userId),
        supabase.from("video_interview_sessions").select("overall_score, status, analyzed_at").eq("user_id", userId),
        supabase.from("peer_interview_sessions").select("*").or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`)
      ]);

      const text = textRes.data || [];
      const video = videoRes.data || [];
      const peer = (peerRes.data || []).filter((p: any) => p.status === 'completed');

      const totalInterviews = text.length + video.length + peer.length;
      
      const completedSessions = 
        text.filter(s => s.status === 'completed' || s.completed_at || (s.overall_score !== null && s.overall_score > 0)).length +
        video.filter(s => s.status === 'completed' || s.analyzed_at || (s.overall_score !== null && s.overall_score > 0)).length +
        peer.length;

      let totalScore = 0;
      let scoredCount = 0;

      text.forEach(s => {
        if (s.overall_score !== null && s.overall_score !== undefined && Number(s.overall_score) > 0) {
          totalScore += Number(s.overall_score);
          scoredCount++;
        }
      });

      video.forEach(s => {
        if (s.overall_score !== null && s.overall_score !== undefined && Number(s.overall_score) > 0) {
          totalScore += Number(s.overall_score);
          scoredCount++;
        }
      });

      peer.forEach((p: any) => {
        const myRating = p.peer_interview_ratings?.find((r: any) => r.rated_user_id === userId);
        if (myRating && myRating.overall_score) {
          totalScore += Number(myRating.overall_score) * 20;
          scoredCount++;
        }
      });

      const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

      setStats({
        totalInterviews,
        completedSessions,
        averageScore,
        peerSessions: peer.length,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
      setStatsError(error.message || String(error));
    }
  };

  const loadRecentActivity = async (userId: string) => {
    try {
      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(sessions || []);
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  const loadSkillGaps = async (userId: string) => {
    try {
      const { data: recommendations } = await supabase
        .from("user_career_recommendations")
        .select("skill_gaps")
        .eq("user_id", userId)
        .single();

      if (recommendations?.skill_gaps) {
        setSkillGaps(recommendations.skill_gaps as any[] || []);
      }
    } catch (error) {
      console.error("Error loading skill gaps:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Sanitize handles (remove URL parts if present)
      const sanitizedData = { ...formData };
      
      const sanitizeHandle = (handle: string, domain: string) => {
        if (!handle) return "";
        let clean = handle.trim();
        if (clean.endsWith('/')) clean = clean.slice(0, -1);
        if (clean.includes(domain)) {
          const parts = clean.split('/');
          return parts[parts.length - 1];
        }
        return clean;
      };

      sanitizedData.leetcode_id = sanitizeHandle(sanitizedData.leetcode_id, "leetcode.com");
      sanitizedData.codeforces_id = sanitizeHandle(sanitizedData.codeforces_id, "codeforces.com");

      // Update state with sanitized values to reflect in UI immediately
      setFormData(prev => ({
        ...prev,
        leetcode_id: sanitizedData.leetcode_id,
        codeforces_id: sanitizedData.codeforces_id
      }));

      const { error } = await supabase
        .from("profiles")
        .update(sanitizedData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      loadProfile(user.id, user);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be lost.")) {
      return;
    }

    const userInput = window.prompt("Type 'DELETE' to confirm account deletion:");
    if (userInput !== "DELETE") {
      toast.error("Deletion cancelled");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Starting account deletion via Edge Function...");

      const { error: funcError } = await supabase.functions.invoke('delete-user-account');

      if (funcError) {
        throw new Error(funcError.message || "Failed to invoke deletion function");
      }

      console.log("Deletion complete. Signing out...");
      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      navigate("/");

    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(`Failed to delete account: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncStats = async () => {
    if (!formData.codeforces_id && !formData.leetcode_id) {
      toast.error("Please enter Codeforces or LeetCode handle first");
      return;
    }

    setSyncing(true);
    const newStats: any = { ...codingStats };

    try {
      if (formData.codeforces_id) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-codeforces-data', {
            body: { handle: formData.codeforces_id }
          });
          if (error) throw error;
          if (data.error) throw new Error(data.error);
          newStats.codeforces = data;
          toast.success("Codeforces stats synced!");
        } catch (e: any) {
          console.error("Codeforces sync error:", e);
          toast.error(`Codeforces: ${e.message || "Failed to sync"}`);
        }
      }

      if (formData.leetcode_id) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-leetcode-data', {
            body: { username: formData.leetcode_id }
          });
          if (error) throw error;
          if (data.error) throw new Error(data.error);
          newStats.leetcode = data;
          toast.success("LeetCode stats synced!");
        } catch (e: any) {
          console.error("LeetCode sync error:", e);
          toast.error(`LeetCode: ${e.message || "Failed to sync"}`);
        }
      }

      setCodingStats(newStats);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updateData: any = {
          coding_stats: newStats,
          codeforces_id: formData.codeforces_id,
          leetcode_id: formData.leetcode_id
        };

        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

    } catch (error: any) {
      console.error("Error syncing stats:", error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error("Please select a file first");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = resumeFile.name.split(".").pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, resumeFile, {
          upsert: true,
          contentType: resumeFile.type,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      const separator = publicUrl.includes('?') ? '&' : '?';
      const publicUrlWithTimestamp = `${publicUrl}${separator}t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrlWithTimestamp })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Resume uploaded successfully!");
      loadProfile(user.id, user);
      setResumeFile(null);
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Failed to upload resume");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlWithTimestamp } as any)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: publicUrlWithTimestamp });
      toast.success('Avatar updated!');
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error('Error uploading avatar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30">
      <div className="relative">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <img
                src="/images/voke_logo.png"
                alt="Voke Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="font-bold text-lg tracking-tight">Voke</span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Identity Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
              >
                <Card className="bg-card/50 backdrop-blur-xl border-border/50 overflow-hidden relative">
                  <div className="h-32 bg-secondary/50 border-b border-border/40 relative overflow-hidden" />
                  <div className="px-6 pb-6 relative">
                    <div className="relative -mt-16 mb-4 flex justify-center lg:justify-start">
                      <div className="relative w-32 h-32 group/avatar">
                        <div className="w-full h-full rounded-3xl bg-card p-1 ring-4 ring-background/50 shadow-2xl overflow-hidden relative">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} crossOrigin="anonymous" alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <div className="w-full h-full rounded-2xl bg-secondary flex items-center justify-center">
                              <span className="text-4xl font-bold text-foreground">
                                {profile?.full_name?.charAt(0) || "U"}
                              </span>
                            </div>
                          )}

                          {/* Upload Overlay */}
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl">
                            <Camera className="w-8 h-8 text-white/80" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={saving} />
                          </label>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-4 border-background shadow-lg z-10"></div>
                      </div>
                    </div>

                    <div className="text-center lg:text-left space-y-1">
                      <h2 className="text-2xl font-bold text-foreground">{resumeData.fullName || profile?.full_name || "Anonymous User"}</h2>
                      <p className="text-muted-foreground flex items-center justify-center lg:justify-start gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        {resumeData.targetRole || profile?.target_role || "Software Engineer"}
                      </p>
                    </div>

                    {/* <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1">
                        LEVEL {Math.floor(((stats.completedSessions * 500) + (stats.peerSessions * 300)) / 2000) + 1}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">
                        {Math.floor(((stats.completedSessions * 500) + (stats.peerSessions * 300)) / 2000) + 1 >= 5 ? 'MASTER' : 'SCHOLAR'}
                      </Badge>
                    </div> */}

                    <div className="mt-8 space-y-4">
                      {(() => {
                        const xp = (stats.completedSessions * 500) + (stats.peerSessions * 300);
                        const level = Math.floor(xp / 2000) + 1;
                        const nextLevelXp = level * 2000;
                        const currentLevelStartXp = (level - 1) * 2000;
                        const progress = ((xp - currentLevelStartXp) / (nextLevelXp - currentLevelStartXp)) * 100;

                        return (
                          <>
                            {/* <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">XP Progress</span>
                              <span className="text-foreground font-mono">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()}</span>
                            </div>
                            <Progress value={progress} className="h-2" /> */}
                          </>
                        );
                      })()}
                    </div>

                    {/* Social/External Links */}
                    <div className="mt-6 pt-5 border-t border-border/50 space-y-2.5">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                        Integrations
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* GitHub Card */}
                        <button 
                          className={`w-full h-11 px-3 py-2 rounded-xl border flex items-center justify-between transition-all group ${
                            formData.github_url || profile?.github_url
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/50 shadow-sm'
                              : 'border-slate-800 bg-[#0b0f19]/70 text-slate-400 hover:text-slate-200 hover:bg-[#121827] hover:border-slate-700'
                          }`} 
                          onClick={() => window.open(formData.github_url || profile?.github_url || 'https://github.com', '_blank')}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Github className={`w-4 h-4 shrink-0 ${formData.github_url || profile?.github_url ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                            <span className="text-xs font-semibold text-slate-200 truncate">GitHub</span>
                          </div>
                          
                          
                        </button>

                        {/* LeetCode Card */}
                        <button 
                          className={`w-full h-11 px-3 py-2 rounded-xl border flex items-center justify-between transition-all group ${
                            profile?.leetcode_id
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/50 shadow-sm'
                              : 'border-slate-800 bg-[#0b0f19]/70 text-slate-400 hover:text-slate-200 hover:bg-[#121827] hover:border-slate-700'
                          }`}
                          onClick={() => {
                            if (profile?.leetcode_id) {
                              const url = profile.leetcode_id.includes('http') 
                                ? profile.leetcode_id 
                                : `https://leetcode.com/u/${profile.leetcode_id}/`;
                              window.open(url, '_blank');
                            } else {
                              window.open('https://leetcode.com', '_blank');
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Terminal className={`w-4 h-4 shrink-0 ${profile?.leetcode_id ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                            <span className="text-xs font-semibold text-slate-200 truncate">LeetCode</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Interviews", value: stats.totalInterviews, icon: Target, color: "text-blue-500" },
                  { label: "Completed", value: stats.completedSessions, icon: Award, color: "text-green-500" },
                  { label: "Avg Score", value: `${stats.averageScore}%`, icon: TrendingUp, color: "text-fuchsia-500" },
                  { label: "Peers", value: stats.peerSessions, icon: User, color: "text-orange-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                  >
                    <Card className="bg-card/50 border-border/50 hover:bg-secondary/20 transition-colors">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <div>
                          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8">
              {((!formData.github_url && !profile?.github_url) || !profile?.resume_url) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-card/60 border border-border/80 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary/80 border border-border/70 flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Complete Profile Integrations
                        <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                          Recommended
                        </span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Connect your {(!formData.github_url && !profile?.github_url) ? 'GitHub account' : ''}{((!formData.github_url && !profile?.github_url) && !profile?.resume_url) ? ' & ' : ''}{!profile?.resume_url ? 'Resume' : ''} in the{' '}
                        <button type="button" onClick={() => setActiveTab("settings")} className="text-primary font-medium underline hover:text-primary/80">Settings</button>{' '}
                        &{' '}
                        <button type="button" onClick={() => setActiveTab("resume")} className="text-primary font-medium underline hover:text-primary/80">Resume</button>{' '}
                        tabs to enable tailored mock interviews.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("settings")}
                    className="rounded-lg text-xs shrink-0 h-8 px-3 gap-1 border-border/80"
                  >
                    Go to Settings <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card/50 border border-border/50 p-1 rounded-xl w-full flex overflow-x-auto">
                  {[
                    { id: "overview", label: "Overview", icon: Activity },
                    { id: "analytics", label: "Analytics", icon: BarChart3 },
                    { id: "resume", label: "Resume", icon: FileText },
                    { id: "skills", label: "Skills", icon: Brain },
                    { id: "settings", label: "Settings", icon: Settings },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 min-w-[100px] gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <AnimatePresence mode="wait">
                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="space-y-6 outline-none">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                      {/* RESUME PROFILE READINESS BANNER */}
                      {(() => {
                        const { checks, completed, total, percentage } = getResumeReadiness();
                        return (
                          <Card className="bg-card/60 backdrop-blur-sm border border-border/70 rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/10">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg font-bold text-foreground">
                                        Resume & Career Profile
                                      </CardTitle>
                                      
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/resume-builder')}
                                    className="h-9 text-xs rounded-xl gap-1.5 border-border/80"
                                  >
                                    Open in Resume Builder
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveResumeData}
                                    disabled={savingResume}
                                    className="h-9 px-4 text-xs font-medium rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                                  >
                                    {savingResume ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-3.5 h-3.5" />
                                        Save Details
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Progress bar and section chips */}
                              <div className="mt-4 space-y-2.5">
                                
                                <Progress value={percentage} className="h-2" />

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {/* {checks.map((check) => (
                                    <span
                                      key={check.id}
                                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                                        check.isDone
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-secondary/40 text-muted-foreground border-border/50'
                                      }`}
                                    >
                                      {check.isDone ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                      )}
                                      {check.label}
                                    </span>
                                  ))} */}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      })()}

                      {/* 1. PERSONAL & CONTACT DETAILS */}
                      <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" />
                            1. Personal & Contact Information
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Your full name, target role headline, and primary contact methods.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Full Name *</Label>
                              <Input
                                placeholder="e.g. Alex Morgan"
                                value={resumeData.fullName}
                                onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Target Job Role / Headline *</Label>
                              <Input
                                placeholder="e.g. Full Stack Software Engineer"
                                value={resumeData.targetRole}
                                onChange={(e) => setResumeData({ ...resumeData, targetRole: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Email Address *</Label>
                              <Input
                                placeholder="e.g. alex.morgan@example.com"
                                value={resumeData.email}
                                onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Phone Number</Label>
                              <Input
                                placeholder="e.g. +1 (555) 234-5678"
                                value={resumeData.phone}
                                onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Location</Label>
                              <Input
                                placeholder="e.g. San Francisco, CA / Remote"
                                value={resumeData.location}
                                onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">LinkedIn Profile URL</Label>
                              <Input
                                placeholder="e.g. https://linkedin.com/in/alexmorgan"
                                value={resumeData.linkedin}
                                onChange={(e) => setResumeData({ ...resumeData, linkedin: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">GitHub Profile URL</Label>
                              <Input
                                placeholder="e.g. https://github.com/alexmorgan"
                                value={resumeData.github}
                                onChange={(e) => setResumeData({ ...resumeData, github: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Personal Portfolio / Website</Label>
                              <Input
                                placeholder="e.g. https://alexmorgan.dev"
                                value={resumeData.website}
                                onChange={(e) => setResumeData({ ...resumeData, website: e.target.value })}
                                className="bg-background/50 border-input h-10 text-sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 2. PROFESSIONAL SUMMARY */}
                      <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-400" />
                              2. Professional Summary
                            </CardTitle>
                            <span className="text-xs text-muted-foreground font-mono">
                              {resumeData.summary?.length || 0} chars
                            </span>
                          </div>
                          <CardDescription className="text-xs">
                            A brief 2–4 sentence overview highlighting your background, core strengths, and career impact.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Textarea
                            placeholder="e.g. Product-focused Software Engineer with 3+ years of experience in distributed systems and React architecture. Led the development of high-scale APIs supporting 100k+ daily requests, optimizing performance by 35%."
                            value={resumeData.summary}
                            onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                            className="bg-background/50 border-input min-h-[90px] text-sm leading-relaxed"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Tip: Include years of experience, primary technologies, and one notable accomplishment.
                          </p>
                        </CardContent>
                      </Card>

                      {/* 3. CORE SKILLS & TECH STACK */}
                      <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Code className="w-4 h-4 text-blue-400" />
                            3. Core Skills & Technologies
                          </CardTitle>
                          <CardDescription className="text-xs">
                            List your technical and domain skills (comma-separated or click tags below to add).
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5">
                          <Input
                            placeholder="e.g. JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS, System Design"
                            value={resumeData.skills}
                            onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                            className="bg-background/50 border-input h-10 text-sm"
                          />

                          {/* Quick Suggested Tags */}
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Click to quick-add common skills:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {suggestedSkills.map((skill) => {
                                const isAdded = resumeData.skills
                                  ?.split(",")
                                  .map(s => s.trim().toLowerCase())
                                  .includes(skill.toLowerCase());
                                return (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => isAdded ? handleRemoveSkillTag(skill) : handleAddSkillTag(skill)}
                                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                      isAdded
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
                                        : 'bg-secondary/20 hover:bg-secondary/40 text-muted-foreground border-border/50 hover:text-foreground'
                                    }`}
                                  >
                                    {isAdded ? '✓ ' : '+ '}{skill}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 4. WORK & INTERNSHIP EXPERIENCE */}
                      <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-400" />
                                4. Work & Internship Experience
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Your past employment, internships, and professional roles.
                              </CardDescription>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddExperience}
                              className="h-8 text-xs rounded-xl gap-1 border-border/80"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Role
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {resumeData.experience.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-border/60 rounded-xl bg-secondary/10">
                              <p className="text-xs text-muted-foreground mb-3">No work experience added yet.</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddExperience}
                                className="h-8 text-xs rounded-xl gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Experience
                              </Button>
                            </div>
                          ) : (
                            resumeData.experience.map((exp, index) => (
                              <div
                                key={exp.id}
                                className="p-4 rounded-xl border border-border/60 bg-secondary/15 space-y-3 relative group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                      {index + 1}
                                    </span>
                                    {exp.role || exp.company ? `${exp.role || 'Role'} at ${exp.company || 'Company'}` : `Experience Entry #${index + 1}`}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveExperience(exp.id)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Job Title / Role *</Label>
                                    <Input
                                      placeholder="e.g. Software Engineer"
                                      value={exp.role}
                                      onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Company Name *</Label>
                                    <Input
                                      placeholder="e.g. Google / Microsoft"
                                      value={exp.company}
                                      onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Duration / Dates</Label>
                                    <Input
                                      placeholder="e.g. Jun 2023 - Present"
                                      value={exp.duration}
                                      onChange={(e) => handleUpdateExperience(exp.id, 'duration', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">Key Achievements & Impact (Bullet Points)</Label>
                                  <Textarea
                                    placeholder="• Designed and deployed scalable REST/GraphQL APIs serving 50k+ daily users&#10;• Reduced latency by 40% through Redis caching and query indexing&#10;• Collaborated with product designers to ship 4 major feature sets"
                                    value={exp.description}
                                    onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                                    className="bg-background/50 border-input min-h-[75px] text-xs leading-relaxed"
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      {/* 5. EDUCATION */}
                      <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base font-bold flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-blue-400" />
                                5. Education
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Degrees, universities, graduation years, and relevant coursework.
                              </CardDescription>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddEducation}
                              className="h-8 text-xs rounded-xl gap-1 border-border/80"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Degree
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {resumeData.education.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-border/60 rounded-xl bg-secondary/10">
                              <p className="text-xs text-muted-foreground mb-3">No education details added yet.</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddEducation}
                                className="h-8 text-xs rounded-xl gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Education
                              </Button>
                            </div>
                          ) : (
                            resumeData.education.map((edu, index) => (
                              <div
                                key={edu.id}
                                className="p-4 rounded-xl border border-border/60 bg-secondary/15 space-y-3 relative group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                      {index + 1}
                                    </span>
                                    {edu.degree || edu.school ? `${edu.degree || 'Degree'} - ${edu.school || 'School'}` : `Education Entry #${index + 1}`}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveEducation(edu.id)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Degree / Major *</Label>
                                    <Input
                                      placeholder="e.g. B.Tech in Computer Science"
                                      value={edu.degree}
                                      onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">School / University *</Label>
                                    <Input
                                      placeholder="e.g. Stanford University"
                                      value={edu.school}
                                      onChange={(e) => handleUpdateEducation(edu.id, 'school', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Graduation Year</Label>
                                    <Input
                                      placeholder="e.g. 2020 - 2024"
                                      value={edu.year}
                                      onChange={(e) => handleUpdateEducation(edu.id, 'year', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">GPA / Relevant Coursework</Label>
                                  <Input
                                    placeholder="e.g. GPA: 3.9/4.0 • Data Structures, Algorithms, Operating Systems, Computer Networks"
                                    value={edu.coursework || ''}
                                    onChange={(e) => handleUpdateEducation(edu.id, 'coursework', e.target.value)}
                                    className="bg-background/50 border-input h-9 text-xs"
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      {/* 6. FEATURED PROJECTS */}
                      <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-400" />
                                6. Featured Projects
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Key software and technical projects demonstrating your hands-on engineering skills.
                              </CardDescription>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddProject}
                              className="h-8 text-xs rounded-xl gap-1 border-border/80"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Project
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {resumeData.projects.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-border/60 rounded-xl bg-secondary/10">
                              <p className="text-xs text-muted-foreground mb-3">No projects added yet.</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddProject}
                                className="h-8 text-xs rounded-xl gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Project
                              </Button>
                            </div>
                          ) : (
                            resumeData.projects.map((proj, index) => (
                              <div
                                key={proj.id}
                                className="p-4 rounded-xl border border-border/60 bg-secondary/15 space-y-3 relative group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                      {index + 1}
                                    </span>
                                    {proj.name || `Project #${index + 1}`}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveProject(proj.id)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Project Name *</Label>
                                    <Input
                                      placeholder="e.g. AI Code Assistant"
                                      value={proj.name}
                                      onChange={(e) => handleUpdateProject(proj.id, 'name', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">Live URL or GitHub Link</Label>
                                    <Input
                                      placeholder="e.g. https://github.com/username/project"
                                      value={proj.link}
                                      onChange={(e) => handleUpdateProject(proj.id, 'link', e.target.value)}
                                      className="bg-background/50 border-input h-9 text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">Tech Stack & Description</Label>
                                  <Textarea
                                    placeholder="e.g. Built with React, Next.js, Node.js, and Supabase. Implemented real-time synchronization, reducing state latency by 50% and supporting 1,000+ active users."
                                    value={proj.description}
                                    onChange={(e) => handleUpdateProject(proj.id, 'description', e.target.value)}
                                    className="bg-background/50 border-input min-h-[65px] text-xs leading-relaxed"
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                    

                    </motion.div>
                  </TabsContent>

                  {/* SETTINGS TAB */}
                  <TabsContent value="settings" className="space-y-6 outline-none">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                        <CardHeader>
                          <CardTitle>Profile Details</CardTitle>
                          <CardDescription>Manage your personal information and connections.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label>Full Name</Label>
                              <Input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="bg-background/50 border-input focus:border-blue-500 transition-colors h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input value={profile?.email} disabled className="bg-background/30 border-input text-muted-foreground h-11" />
                            </div>
                            <div className="space-y-2">
                              <Label>GitHub Integration</Label>
                              <div className="p-3.5 rounded-xl border border-border/50 bg-secondary/20 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Github className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-foreground">GitHub Account</div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {formData.github_url || profile?.github_url
                                        ? `@${(formData.github_url || profile?.github_url || '').replace(/\/$/, '').split('/').pop()} linked`
                                        : '1-Click Direct Connect'}
                                    </div>
                                  </div>
                                </div>
                                {formData.github_url || profile?.github_url ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 font-extrabold flex items-center gap-1.5 shadow-sm">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                      Connected
                                    </Badge>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const { error } = await supabase.auth.signInWithOAuth({
                                          provider: 'github',
                                          options: {
                                            scopes: 'read:user repo read:org',
                                            redirectTo: `${window.location.origin}/profile`
                                          }
                                        });
                                        if (error) toast.error(error.message);
                                      }}
                                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer ml-1"
                                    >
                                      Re-connect
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const { error } = await supabase.auth.signInWithOAuth({
                                        provider: 'github',
                                        options: {
                                          scopes: 'read:user repo read:org',
                                          redirectTo: `${window.location.origin}/profile`
                                        }
                                      });
                                      if (error) toast.error(error.message);
                                    }}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20"
                                  >
                                    <Github className="w-3.5 h-3.5" /> ⚡ Connect GitHub
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>LeetCode Username</Label>
                              <Input
                                value={formData.leetcode_id}
                                onChange={(e) => setFormData({ ...formData, leetcode_id: e.target.value })}
                                className="bg-background/50 border-input focus:border-blue-500 transition-colors h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Codeforces Handle</Label>
                              <Input
                                value={formData.codeforces_id}
                                onChange={(e) => setFormData({ ...formData, codeforces_id: e.target.value })}
                                className="bg-background/50 border-input focus:border-blue-500 transition-colors h-11"
                              />
                            </div>
                          </div>

                          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            >
                              Delete Account
                            </Button>
                            <div className="flex gap-4 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                onClick={handleSyncStats}
                                disabled={syncing}
                                className="border-input bg-secondary/20 hover:bg-secondary/40 flex-1 sm:flex-none"
                              >
                                {syncing ? "Syncing..." : "Sync Stats"}
                              </Button>
                              <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-500 text-white flex-1 sm:flex-none"
                              >
                                {saving ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* CONNECTED GITHUB REPOSITORIES GRID CARD */}
                      <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden mt-6">
                        <CardHeader className="border-b border-border/50 bg-secondary/10 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                                <Github className="w-5 h-5" />
                              </div>
                              <div>
                                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                                  Connected GitHub Repositories
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                  All public repositories linked to your account for AI technical evaluation
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs px-3 py-1 font-bold">
                              {userRepos.length} Repositories
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {loadingRepos ? (
                            <div className="py-8 text-center text-xs text-muted-foreground font-mono flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                              Fetching public repositories from GitHub...
                            </div>
                          ) : userRepos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-96 overflow-y-auto pr-1">
                              {userRepos.map((repo) => {
                                const username = (formData.github_url || profile?.github_url || '').replace(/\/$/, '').split('/').pop() || '';
                                const repoUrl = `https://github.com/${username}/${repo.name}`;
                                return (
                                  <div
                                    key={repo.name}
                                    className="p-4 rounded-2xl border border-border/50 bg-secondary/20 hover:border-blue-500/40 hover:bg-secondary/40 transition-all flex flex-col justify-between group"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors tracking-wide truncate">
                                          {repo.name}
                                        </h4>
                                        <Badge variant="outline" className="text-[9px] font-mono border-blue-500/20 bg-blue-500/10 text-blue-300 px-1.5 py-0">
                                          {repo.language || 'Code'}
                                        </Badge>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                        {repo.description || 'GitHub repository project'}
                                      </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between text-[10px]">
                                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Target
                                      </span>
                                      <a
                                        href={repoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                                      >
                                        View on GitHub <ChevronRight className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                              No public repositories found for @{(formData.github_url || profile?.github_url || '').split('/').pop()}.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* RESUME TAB */}
                  <TabsContent value="resume" className="space-y-6 outline-none">
                    <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                      <CardHeader>
                        <CardTitle>Resume Verification</CardTitle>
                        <CardDescription>Upload your latest resume to keep your profile updated.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 hover:border-blue-500/50 transition-colors bg-secondary/5 text-center relative group">
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          />
                          <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {resumeFile ? (
                              <FileText className="w-8 h-8 text-blue-500" />
                            ) : (
                              <Upload className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            {resumeFile ? resumeFile.name : "Drop your resume here"}
                          </h3>
                          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Supports PDF, DOC, DOCX. Max file size 5MB.
                          </p>
                          {resumeFile && (
                            <Button
                              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white relative z-30"
                              onClick={handleResumeUpload}
                              disabled={saving}
                            >
                              {saving ? "Uploading..." : "Confirm Upload"}
                            </Button>
                          )}
                        </div>

                        {profile?.resume_url && (
                          <div className="mt-6 flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-green-500" />
                              </div>
                              <div>
                                <div className="font-medium text-green-500">Resume Verified</div>
                                <div className="text-xs text-green-500/80">Last updated recently</div>
                              </div>
                            </div>
                            <Button
                              variant="link"
                              className="text-green-500 hover:text-green-600"
                              onClick={() => window.open(profile.resume_url, '_blank')}
                            >
                              View
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ANALYTICS TAB */}
                  <TabsContent value="analytics" className="outline-none">
                    <InterviewAnalytics userId={profile?.id || ""} />
                  </TabsContent>

                  {/* SKILLS TAB */}
                  <TabsContent value="skills" className="outline-none">
                    <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                      <CardHeader>
                        <CardTitle>Skill Gap Analysis</CardTitle>
                        <CardDescription>Areas for improvement based on your interview performance.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {skillGaps.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="inline-block p-4 rounded-full bg-secondary/20 mb-4">
                              <Target className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No Gaps Detected Yet</h3>
                            <p className="text-muted-foreground">Complete more interviews to generate a skill analysis.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {skillGaps.map((gap: any, i) => (
                              <div key={i} className="p-4 rounded-xl bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-foreground text-lg">{gap.skill}</h4>
                                  <Badge variant={gap.importance === 'High' ? 'destructive' : 'default'}>{gap.importance}</Badge>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">{gap.learning_resource}</p>
                                <div className="flex items-center gap-3 text-sm">
                                  <Progress value={Math.random() * 60 + 20} className="h-1.5" />
                                  <span className="text-muted-foreground font-mono">In Progress</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                </AnimatePresence>
              </Tabs>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
};

export default Profile;
