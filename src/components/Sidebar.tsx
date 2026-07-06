import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, LogOut, Play, Users, Mic, Settings,
  Code, MessageSquare, Briefcase, FileQuestion, LayoutDashboard, Zap
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      color: "text-violet-500",
      hoverBg: "hover:bg-violet-500/10 hover:text-violet-500",
    },
    {
      id: "job-recommendations",
      label: "Job Matches",
      icon: Briefcase,
      path: "/job-recommendations",
      color: "text-amber-500",
      hoverBg: "hover:bg-amber-500/10 hover:text-amber-500",
    },
    {
      id: "interview-new",
      label: "Text Interview",
      icon: MessageSquare,
      path: "/interview/new",
      color: "text-violet-500",
      hoverBg: "hover:bg-violet-500/10 hover:text-violet-500",
    },
    {
      id: "voice-assistant",
      label: "AI Voice Agent",
      icon: Mic,
      path: "/voice-assistant",
      color: "text-pink-500",
      hoverBg: "hover:bg-pink-500/10 hover:text-pink-500",
    },
    {
      id: "resume-builder",
      label: "Resume Builder",
      icon: FileText,
      path: "/resume-builder",
      color: "text-emerald-500",
      hoverBg: "hover:bg-emerald-500/10 hover:text-emerald-500",
    },
    {
      id: "elite-prep",
      label: "Elite Prep",
      icon: Zap,
      path: "/elite-prep",
      color: "text-blue-500",
      hoverBg: "hover:bg-blue-500/10 hover:text-blue-500",
    },
    {
      id: "video-interview",
      label: "Video Practice",
      icon: Play,
      path: "/video-interview",
      color: "text-fuchsia-500",
      hoverBg: "hover:bg-fuchsia-500/10 hover:text-fuchsia-500",
    },
    {
      id: "playground",
      label: "Playground",
      icon: Code,
      path: "/playground",
      color: "text-indigo-500",
      hoverBg: "hover:bg-indigo-500/10 hover:text-indigo-500",
    },
    {
      id: "question-practice",
      label: "Question Practice",
      icon: FileQuestion,
      path: "/question-practice",
      color: "text-orange-500",
      hoverBg: "hover:bg-orange-500/10 hover:text-orange-500",
    },
  ];

  // Determine top styling based on current path
  const getTopClass = () => {
    if (location.pathname.startsWith("/job-recommendations")) {
      return "top-[80px] h-[calc(100vh-80px)]";
    }
    if (location.pathname.startsWith("/resume-builder") || location.pathname.startsWith("/question-practice")) {
      return "top-[64px] h-[calc(100vh-64px)]";
    }
    return "top-[73px] h-[calc(100vh-73px)]";
  };

  return (
    <aside className={`hidden md:flex flex-col items-center justify-between py-6 w-16 bg-card/65 backdrop-blur-xl border-r border-border/50 sticky z-40 shrink-0 print:hidden ${getTopClass()}`}>
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 group ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                        : `text-muted-foreground ${item.hoverBg}`
                    }`}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    {isActive && (
                      <span className="absolute left-1 w-1 h-5 bg-primary rounded-full" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-4 w-full px-2">
        <div className="w-8 h-px bg-border/60" />
        
        {/* Peer Match */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/peer-interviews")}
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 group ${
                location.pathname === "/peer-interviews"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                  : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
              }`}
            >
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              {location.pathname === "/peer-interviews" && (
                <span className="absolute left-1 w-1 h-5 bg-primary rounded-full" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Peer Match
          </TooltipContent>
        </Tooltip>

        {/* Profile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
            >
              <Settings className="w-5 h-5 hover:rotate-45 transition-transform duration-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Profile Settings
          </TooltipContent>
        </Tooltip>

        {/* Logout */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-11 h-11 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300"
            >
              <LogOut className="w-5 h-5 hover:translate-x-0.5 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
};
