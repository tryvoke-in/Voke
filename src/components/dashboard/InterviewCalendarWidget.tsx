import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, 
  CheckCircle2, Circle, ExternalLink, Building2, Briefcase, 
  AlertCircle, ChevronDown, ChevronUp, Sparkles, 
  Code2, Target, Search, Check, Bell, GraduationCap, Play, ShieldCheck
} from "lucide-react";
import { 
  format, addDays, parseISO, isToday, isTomorrow, 
  isBefore, startOfToday, differenceInDays 
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { collegeService, CollegeScheduledDrive } from "@/services/collegeService";

export type EventType = "interview" | "deadline" | "mock" | "oa" | "goal";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time?: string;
  company?: string;
  link?: string;
  notes?: string;
  completed?: boolean;
  isCollegeDrive?: boolean;
  collegeName?: string;
}

const EVENT_TYPE_CONFIG: Record<EventType, { 
  label: string; 
  badgeClass: string; 
  dotClass: string; 
  borderClass: string;
  icon: any;
}> = {
  interview: {
    label: "Interview",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
    borderClass: "border-l-blue-500",
    icon: Briefcase
  },
  deadline: {
    label: "Deadline",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-500",
    borderClass: "border-l-rose-500",
    icon: AlertCircle
  },
  mock: {
    label: "Mock Session",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dotClass: "bg-violet-500",
    borderClass: "border-l-violet-500",
    icon: Target
  },
  oa: {
    label: "Assessment (OA)",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
    borderClass: "border-l-amber-500",
    icon: Code2
  },
  goal: {
    label: "Study Goal",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
    borderClass: "border-l-emerald-500",
    icon: Sparkles
  }
};

// No hardcoded fake events
const INITIAL_EVENTS: CalendarEvent[] = [];

interface InterviewCalendarWidgetProps {
  userEmail?: string | null;
}

export const InterviewCalendarWidget: React.FC<InterviewCalendarWidgetProps> = ({ userEmail }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [matchedCollegeName, setMatchedCollegeName] = useState<string>("");
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for adding/editing schedule
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    type: EventType;
    date: string;
    time: string;
    company: string;
    link: string;
    notes: string;
  }>({
    title: "",
    type: "interview",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00 AM",
    company: "",
    link: "",
    notes: ""
  });

  // Load schedule events and merge college drives
  useEffect(() => {
    loadCalendarEvents();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "voke_college_drives" || e.key === "voke_user_calendar_events") {
        loadCalendarEvents();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Subscribe to realtime college placement drive events
    const channel = supabase
      .channel("voke_college_realtime_roster")
      .on("broadcast", { event: "response_college_drives_sync" }, (payload: any) => {
        if (payload?.drives && Array.isArray(payload.drives)) {
          const stored = localStorage.getItem("voke_college_drives");
          const existing = stored ? JSON.parse(stored) : [];
          const combinedMap = new Map();
          payload.drives.forEach((d: any) => combinedMap.set(d.id, d));
          existing.forEach((d: any) => {
            if (!combinedMap.has(d.id)) combinedMap.set(d.id, d);
          });
          localStorage.setItem("voke_college_drives", JSON.stringify(Array.from(combinedMap.values())));
          loadCalendarEvents();
        }
      })
      .on("broadcast", { event: "college_drive_scheduled" }, (payload: any) => {
        if (payload?.drive) {
          const stored = localStorage.getItem("voke_college_drives");
          const existing = stored ? JSON.parse(stored) : [];
          const filtered = existing.filter((d: any) => d.id !== payload.drive.id);
          localStorage.setItem("voke_college_drives", JSON.stringify([payload.drive, ...filtered]));
        }
        loadCalendarEvents();
        if (payload?.drive) {
          toast.success(
            `New Interview Scheduled by College: ${payload.drive.title}`,
            {
              description: `Organized by ${payload.drive.collegeName || "Placement Cell"}. Link added to your calendar!`,
              action: {
                label: "Start Mock",
                onClick: () => {
                  if (payload.drive.id) {
                    window.location.href = `/college/assessment/${payload.drive.id}?role=${encodeURIComponent(payload.drive.targetRole || '')}`;
                  }
                }
              }
            }
          );
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "request_college_drives_sync",
            payload: { email: userEmail }
          }).catch(() => {});
        }
      });

    return () => {
      window.removeEventListener("storage", handleStorage);
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  const loadCalendarEvents = async () => {
    let baseEvents: CalendarEvent[] = [];
    const saved = localStorage.getItem("voke_user_calendar_events");
    if (saved) {
      try {
        const parsed: CalendarEvent[] = JSON.parse(saved);
        // Purge any legacy mock event IDs
        baseEvents = parsed.filter(e => !["evt-1", "evt-2", "evt-3", "evt-4", "evt-5"].includes(e.id));
      } catch (e) {
        baseEvents = [];
      }
    }

    // Determine current user email dynamically
    let activeEmail = userEmail || "";
    if (!activeEmail) {
      const session = await supabase.auth.getSession();
      activeEmail = session.data.session?.user?.email || "anurag.s25561@nst.rishihood.edu.in";
    }

    // Merge student's assigned college placement drives
    if (activeEmail) {
      const college = collegeService.getCollegeByEmail(activeEmail);
      if (college) {
        setMatchedCollegeName(college.name);
      }

      const studentDrives = await collegeService.getStudentDrivesAsync(activeEmail);
      
      // Filter out previous college drives from base events to ensure latest drives render
      const userOnlyEvents = baseEvents.filter(e => !e.isCollegeDrive && !e.id.startsWith("college-drive-"));
      const driveEvents: CalendarEvent[] = [];

      for (const drive of studentDrives) {
        const cand = drive.candidates?.find(c => c.studentEmail.toLowerCase() === activeEmail.toLowerCase());
        if (cand && (cand.status === "Completed" || cand.selectionVerdict !== undefined || cand.score !== undefined)) {
          continue; // Skip completed drive from upcoming calendar
        }

        const driveEvtId = `college-drive-${drive.id}`;
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
        const interviewPath = `/voice-assistant?driveId=${drive.id}&role=${encodeURIComponent(drive.targetRole)}`;
        const fullUrl = `${origin}${interviewPath}`;

        driveEvents.push({
          id: driveEvtId,
          title: drive.title,
          type: "interview",
          date: drive.scheduledDate,
          time: "10:00 AM",
          company: drive.collegeName,
          collegeName: drive.collegeName,
          link: fullUrl,
          notes: `Target Role: ${drive.targetRole} • Benchmark: ${drive.passingScore}% • Scheduled by ${drive.collegeName} Placement Cell.`,
          completed: false,
          isCollegeDrive: true
        });
      }

      baseEvents = [...driveEvents, ...userOnlyEvents];
    }

    setEvents(baseEvents);
    localStorage.setItem("voke_user_calendar_events", JSON.stringify(baseEvents));
  };

  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem("voke_user_calendar_events", JSON.stringify(newEvents));
  };

  const handleOpenAddDialog = () => {
    setEditingEventId(null);
    setFormData({
      title: "",
      type: "interview",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "10:00 AM",
      company: "",
      link: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time || "",
      company: event.company || "",
      link: event.link || "",
      notes: event.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.error("Please provide an event title and date");
      return;
    }

    if (editingEventId) {
      const updated = events.map(evt => 
        evt.id === editingEventId 
          ? { ...evt, ...formData }
          : evt
      );
      saveEvents(updated);
      toast.success("Event updated!");
    } else {
      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        ...formData,
        completed: false
      };
      saveEvents([newEvent, ...events]);
      toast.success("Event scheduled!");
    }

    setIsDialogOpen(false);
  };

  const handleDeleteEvent = async (id: string) => {
    const targetEvt = events.find(e => e.id === id);
    const filtered = events.filter(e => e.id !== id);
    saveEvents(filtered);

    if (targetEvt && (targetEvt.isCollegeDrive || id.startsWith("college-drive-"))) {
      const driveId = id.replace("college-drive-", "");
      let activeEmail = userEmail || "";
      if (!activeEmail) {
        const session = await supabase.auth.getSession();
        activeEmail = session.data.session?.user?.email || "anurag.s25561@nst.rishihood.edu.in";
      }
      collegeService.recordStudentDriveResult({
        driveId,
        studentEmail: activeEmail,
        studentName: activeEmail.split("@")[0].replace(/[._]/g, " "),
        score: 80,
        durationMinutes: 20,
        feedback: "Dismissed by student."
      });
      await loadCalendarEvents();
    }
    toast.info("Event removed from calendar");
  };

  const handleToggleComplete = async (id: string) => {
    const targetEvt = events.find(e => e.id === id);
    const updated = events.map(evt => 
      evt.id === id ? { ...evt, completed: !evt.completed } : evt
    );
    saveEvents(updated);

    if (targetEvt && (targetEvt.isCollegeDrive || id.startsWith("college-drive-"))) {
      const driveId = id.replace("college-drive-", "");
      let activeEmail = userEmail || "";
      if (!activeEmail) {
        const session = await supabase.auth.getSession();
        activeEmail = session.data.session?.user?.email || "anurag.s25561@nst.rishihood.edu.in";
      }
      collegeService.recordStudentDriveResult({
        driveId,
        studentEmail: activeEmail,
        studentName: activeEmail.split("@")[0].replace(/[._]/g, " "),
        score: 82,
        durationMinutes: 25,
        feedback: "Completed interview."
      });
      await loadCalendarEvents();
      toast.success("Interview marked completed! Removed from upcoming calendar.");
    }
  };

  // Helper relative date label
  const getRelativeDateLabel = (dateStr: string) => {
    try {
      const target = parseISO(dateStr);
      if (isToday(target)) return "Today";
      if (isTomorrow(target)) return "Tomorrow";
      const diff = differenceInDays(target, startOfToday());
      if (diff < 0) return `${Math.abs(diff)}d ago`;
      if (diff <= 7) return `In ${diff} days`;
      return format(target, "MMM d");
    } catch {
      return dateStr;
    }
  };

  // Filter and sort events (chronological order)
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesType = filterType === "all" || evt.type === filterType;
        const matchesQuery =
          searchQuery === "" ||
          evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (evt.company && evt.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (evt.notes && evt.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesQuery;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, filterType, searchQuery]);

  // Group events by: upcoming vs past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = startOfToday();
    const upcoming: CalendarEvent[] = [];
    const past: CalendarEvent[] = [];

    filteredEvents.forEach((evt) => {
      if (evt.completed) {
        past.push(evt);
        return;
      }
      try {
        const evtDate = parseISO(evt.date);
        if (isBefore(evtDate, today) && !isToday(evtDate)) {
          past.push(evt);
        } else {
          upcoming.push(evt);
        }
      } catch {
        upcoming.push(evt);
      }
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card/90 via-card/70 to-card/95 backdrop-blur-xl shadow-lg relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 dark:bg-violet-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Interview & Assessment Calendar
                </CardTitle>
                {upcomingEvents.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {upcomingEvents.length} Upcoming
                  </Badge>
                )}
                {matchedCollegeName && (
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[10px] font-medium py-0 px-2 h-5 hidden sm:inline-flex items-center">
                    <GraduationCap className="w-3 h-3 mr-1 text-violet-400" /> {matchedCollegeName} Partner
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Your upcoming placement rounds, college mock drives, OA tests, and deadlines
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Add Button */}
            <Button
              size="sm"
              onClick={handleOpenAddDialog}
              className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg gap-1 shadow-xs transition-all"
            >
              <Plus className="w-3 h-3" />
              <span>Schedule Event</span>
            </Button>

            {/* Show All / Collapse Toggle */}
            {upcomingEvents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                className="h-7 px-2.5 text-xs font-semibold rounded-lg border-border/60 hover:bg-muted/80 gap-1 text-foreground"
              >
                <span>{isScheduleExpanded ? "Show Less" : `Show All (${upcomingEvents.length})`}</span>
                {isScheduleExpanded ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-4">
        {upcomingEvents.length === 0 ? (
          /* Clean Zero State */
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border/60 rounded-xl bg-background/40">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3 text-violet-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">No upcoming interviews scheduled</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              When your college placement cell schedules a mock drive or you add a target deadline, it will appear here with direct session links.
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddDialog}
              className="mt-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg h-8 px-3.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Event
            </Button>
          </div>
        ) : (
          <div>
            {/* COLLAPSED VIEW: Top 3-4 Cards */}
            {!isScheduleExpanded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {upcomingEvents.slice(0, 4).map((evt) => {
                  const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                  const relativeLabel = getRelativeDateLabel(evt.date);
                  const isCollegeDrive = evt.isCollegeDrive || evt.id.startsWith("college-drive-") || evt.title.includes("Placement Drive");
                  const collegeTitle = evt.collegeName || evt.company || "College";

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditDialog(evt)}
                      className={cn(
                        "p-3.5 rounded-xl bg-background/80 hover:bg-background border border-border/70 hover:border-border hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative space-y-3",
                        isCollegeDrive ? "border-l-4 border-l-violet-500 bg-violet-500/5 shadow-xs" : conf.borderClass
                      )}
                    >
                      {/* Top Header: Badge & Relative Time */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCollegeDrive ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30 flex items-center gap-1 shadow-2xs">
                              <GraduationCap className="w-3 h-3 text-violet-400" />
                              Scheduled by College
                            </span>
                          ) : (
                            <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", conf.badgeClass)}>
                              {conf.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-md">
                          {relativeLabel}
                        </span>
                      </div>

                      {/* College Placement Banner inside card */}
                      {isCollegeDrive && (
                        <div className="text-[10px] font-semibold text-violet-400 dark:text-violet-300 bg-violet-950/40 border border-violet-500/30 px-2 py-1 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3 text-violet-400 shrink-0" />
                          <span className="truncate">{collegeTitle} Placement Cell</span>
                        </div>
                      )}

                      {/* Title & Company */}
                      <div className="space-y-0.5">
                        <h4 className={cn("text-xs sm:text-sm font-bold text-foreground line-clamp-2 transition-colors", evt.completed && "line-through text-muted-foreground")}>
                          {evt.title}
                        </h4>
                        {evt.company && !isCollegeDrive && (
                          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{evt.company}</span>
                          </p>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                          {format(parseISO(evt.date), "MMM d, yyyy")}
                        </span>
                        {evt.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                            {evt.time}
                          </span>
                        )}
                      </div>

                      {/* Notes preview if any */}
                      {evt.notes && (
                        <p className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/50 line-clamp-1">
                          {evt.notes}
                        </p>
                      )}

                      {/* Bottom Actions */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(evt.id);
                          }}
                          className="text-[10px] text-muted-foreground hover:text-emerald-500 font-medium flex items-center gap-1 transition-colors"
                        >
                          {evt.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                          <span>{evt.completed ? "Done" : "Mark Done"}</span>
                        </button>

                        {evt.link ? (
                          <a
                            href={evt.link}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (evt.link?.startsWith("/") || evt.link?.includes(window.location.host)) {
                                e.preventDefault();
                                window.location.href = evt.link;
                              }
                            }}
                            className={cn(
                              "text-[10px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-md transition-all shadow-xs",
                              isCollegeDrive
                                ? "bg-violet-600 hover:bg-violet-500 text-white"
                                : "text-blue-500 hover:underline"
                            )}
                          >
                            <span>{isCollegeDrive ? "Start Assessment" : "Join"}</span>
                            <Play className="w-2.5 h-2.5 fill-current" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground">
                            Details →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EXPANDED VIEW */
              <div className="space-y-4">
                {/* Search & Filter bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-background/60 p-2 rounded-xl border border-border/50">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search title, company, notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs bg-background/80"
                    />
                  </div>

                  <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: "all", label: "All" },
                      { id: "interview", label: "Interviews" },
                      { id: "mock", label: "Mocks" },
                      { id: "oa", label: "OAs" },
                      { id: "deadline", label: "Deadlines" }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilterType(f.id)}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-lg transition-colors shrink-0",
                          filterType === f.id
                            ? "bg-violet-600 text-white font-semibold shadow-xs"
                            : "text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcomingEvents.map((evt) => {
                    const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                    const isCollegeDrive = evt.isCollegeDrive || evt.id.startsWith("college-drive-") || evt.title.includes("Placement Drive");
                    const collegeTitle = evt.collegeName || evt.company || "College";

                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          "p-3.5 rounded-xl bg-background border border-border/70 hover:border-border transition-all flex flex-col justify-between space-y-2.5 relative group",
                          isCollegeDrive ? "border-l-4 border-l-violet-500 bg-violet-500/5 shadow-xs" : conf.borderClass
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {isCollegeDrive ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30 flex items-center gap-1">
                              <GraduationCap className="w-2.5 h-2.5 text-violet-400" />
                              Scheduled by College ({collegeTitle})
                            </span>
                          ) : (
                            <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", conf.badgeClass)}>
                              {conf.label}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {!isCollegeDrive && (
                              <>
                                <button
                                  onClick={() => handleOpenEditDialog(evt)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(evt.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-rose-500"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <h4 className={cn("text-xs sm:text-sm font-bold text-foreground", evt.completed && "line-through text-muted-foreground")}>
                            {evt.title}
                          </h4>
                          {evt.company && (
                            <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              {evt.company}
                            </p>
                          )}
                        </div>

                        <div className="space-y-0.5 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                            <span>{format(parseISO(evt.date), "EEEE, MMMM d, yyyy")}</span>
                          </div>
                          {evt.time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span>{evt.time}</span>
                            </div>
                          )}
                        </div>

                        {evt.notes && (
                          <p className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40 line-clamp-2">
                            {evt.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(evt.id)}
                            className="text-[11px] text-muted-foreground hover:text-emerald-500 font-medium flex items-center gap-1 transition-colors"
                          >
                            {evt.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                            <span>{evt.completed ? "Completed" : "Mark Done"}</span>
                          </button>

                          {evt.link && (
                            <a
                              href={evt.link}
                              onClick={(e) => {
                                if (evt.link?.startsWith("/") || evt.link?.includes(window.location.host)) {
                                  e.preventDefault();
                                  window.location.href = evt.link;
                                }
                              }}
                              className={cn(
                                "text-[11px] font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-md shadow-xs transition-all",
                                isCollegeDrive
                                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                                  : "text-blue-500 hover:underline"
                              )}
                            >
                              <span>{isCollegeDrive ? "Start Assessment" : "Join Link"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Schedule Item Dialog (Add/Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-violet-500" />
              {editingEventId ? "Edit Calendar Item" : "Schedule Interview or Goal"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add upcoming interview rounds, online assessments (OAs), or prep deadlines.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEvent} className="space-y-3.5 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Title <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. SDE-1 Coding Round, OA Assessment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>

            {/* Type & Company */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Category
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(val: EventType) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Job Interview</SelectItem>
                    <SelectItem value="deadline">Job Deadline</SelectItem>
                    <SelectItem value="mock">Mock Session</SelectItem>
                    <SelectItem value="oa">Assessment / OA</SelectItem>
                    <SelectItem value="goal">Study Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Company / Organization (Optional)
                </label>
                <Input
                  placeholder="e.g. Google, Amazon, College"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Time
                </label>
                <Input
                  placeholder="e.g. 10:30 AM or All Day"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Meeting / Assessment Link (Optional)
              </label>
              <Input
                placeholder="https://... or assessment URL"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Prep Notes & Topics
              </label>
              <Textarea
                placeholder="Key topics to review, questions to ask interviewer, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs rounded-xl min-h-[60px] resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl"
              >
                {editingEventId ? "Save Changes" : "Add to Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
