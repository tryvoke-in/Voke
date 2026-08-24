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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { collegeService, CollegeScheduledDrive } from "@/services/collegeService";

export type EventType = "interview" | "mock" | "oa" | "goal";
export type EventSource = "admin" | "user";

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
  source?: EventSource; // 'admin' (official, no mark done/edit/delete) or 'user'
  durationMinutes?: number;
  questionCountLimit?: number;
  targetRole?: string;
  passingScore?: number;
}

const EVENT_TYPE_CONFIG: Record<EventType, { 
  label: string; 
  badgeClass: string; 
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  categoryGroup: "interview" | "event";
}> = {
  interview: {
    label: "Interview",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Briefcase,
    borderClass: "border-l-4 border-l-blue-500",
    categoryGroup: "interview"
  },
  mock: {
    label: "Mock Session",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: Target,
    borderClass: "border-l-4 border-l-indigo-500",
    categoryGroup: "interview"
  },
  oa: {
    label: "Online Assessment",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Code2,
    borderClass: "border-l-4 border-l-amber-500",
    categoryGroup: "event"
  },
  goal: {
    label: "Prep Milestone",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Sparkles,
    borderClass: "border-l-4 border-l-emerald-500",
    categoryGroup: "event"
  }
};

const INITIAL_EVENTS: CalendarEvent[] = [];

interface InterviewCalendarWidgetProps {
  userEmail?: string | null;
}

export const InterviewCalendarWidget: React.FC<InterviewCalendarWidgetProps> = ({ userEmail }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [matchedCollegeName, setMatchedCollegeName] = useState<string>("");
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
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "10:00 AM",
    company: "",
    link: "",
    notes: ""
  });

  // Load schedule events and merge college drives
  useEffect(() => {
    loadCalendarEvents();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "voke_college_drives" || e.key === "voke_user_calendar_events_v2") {
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
      .on("broadcast", { event: "college_drive_scheduled" }, async (payload: any) => {
        if (payload?.drive) {
          const stored = localStorage.getItem("voke_college_drives");
          const existing = stored ? JSON.parse(stored) : [];
          const filtered = existing.filter((d: any) => d.id !== payload.drive.id);
          localStorage.setItem("voke_college_drives", JSON.stringify([payload.drive, ...filtered]));
        }

        let currentEmail = userEmail || "";
        if (!currentEmail) {
          const session = await supabase.auth.getSession();
          currentEmail = session.data.session?.user?.email || "";
        }

        loadCalendarEvents();

        // ONLY toast if current student is genuinely targeted by this drive!
        if (payload?.drive && currentEmail) {
          const isEligible = collegeService.isStudentEligibleForDrive(currentEmail, payload.drive);
          if (isEligible) {
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
    const saved = localStorage.getItem("voke_user_calendar_events_v2");
    const DUMMY_IDS = ["admin-evt-1", "evt-user-1", "evt-user-2", "evt-1", "evt-2", "evt-3", "evt-4", "evt-5"];
    
    if (saved) {
      try {
        const parsed: CalendarEvent[] = JSON.parse(saved);
        baseEvents = parsed.filter(e => !DUMMY_IDS.includes(e.id));
      } catch (e) {
        baseEvents = [];
      }
    } else {
      baseEvents = [];
    }

    // Determine current user email dynamically
    let activeEmail = userEmail || "";
    if (!activeEmail) {
      const session = await supabase.auth.getSession();
      activeEmail = session.data.session?.user?.email || "";
    }

    // Filter out previous college drives & admin drives from base events to ensure latest verified drives render
    const userOnlyEvents = baseEvents.filter(
      e => !e.isCollegeDrive && 
           !e.id.startsWith("college-drive-") && 
           !DUMMY_IDS.includes(e.id) &&
           e.source !== "admin"
    );

    // Merge student's assigned college placement drives strictly if eligible
    if (activeEmail) {
      const college = collegeService.getCollegeByEmail(activeEmail);
      if (college) {
        setMatchedCollegeName(college.name);
      } else {
        setMatchedCollegeName("");
      }

      const studentDrives = await collegeService.getStudentDrivesAsync(activeEmail);
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
          time: drive.durationMinutes ? `${drive.durationMinutes} mins` : undefined,
          company: drive.collegeName,
          collegeName: drive.collegeName,
          link: fullUrl,
          notes: drive.instructions || "",
          completed: false,
          isCollegeDrive: true,
          source: "admin",
          durationMinutes: drive.durationMinutes,
          questionCountLimit: drive.questionCountLimit,
          targetRole: drive.targetRole,
          passingScore: drive.passingScore
        });
      }

      baseEvents = [...driveEvents, ...userOnlyEvents];
    } else {
      setMatchedCollegeName("");
      baseEvents = userOnlyEvents;
    }

    setEvents(baseEvents);
    localStorage.setItem("voke_user_calendar_events_v2", JSON.stringify(baseEvents));
  };

  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem("voke_user_calendar_events_v2", JSON.stringify(newEvents));
  };

  const handleOpenAddDialog = (type: EventType = "interview") => {
    setEditingEventId(null);
    setFormData({
      title: "",
      type: type,
      date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      time: "10:00 AM",
      company: "",
      link: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (event: CalendarEvent) => {
    // Admin / College controlled events cannot be edited by user
    if (event.source === "admin" || event.isCollegeDrive) {
      return;
    }
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time || "10:00 AM",
      company: event.company || "",
      link: event.link || "",
      notes: event.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.error("Please enter a title and date");
      return;
    }

    if (editingEventId) {
      const updated = events.map(evt => {
        if (evt.id === editingEventId) {
          return {
            ...evt,
            ...formData,
            source: evt.source || "user"
          };
        }
        return evt;
      });
      saveEvents(updated);
      toast.success("Schedule updated!");
    } else {
      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        ...formData,
        source: "user",
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
        activeEmail = session.data.session?.user?.email || "";
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
        activeEmail = session.data.session?.user?.email || "";
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

  // Sort upcoming events chronologically (excluding completed or past)
  const activeEvents = useMemo(() => {
    return [...events]
      .filter(evt => !evt.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  // Section 1: Scheduled Interviews
  const interviewEvents = useMemo(() => {
    return activeEvents.filter(evt => evt.type === "interview" || evt.type === "mock");
  }, [activeEvents]);

  // Section 2: Upcoming Events & Assessments
  const upcomingEventItems = useMemo(() => {
    return activeEvents.filter(evt => evt.type === "oa" || evt.type === "goal");
  }, [activeEvents]);

  const totalActiveCount = interviewEvents.length + upcomingEventItems.length;

  return (
    <Card className="border border-border/60 bg-card text-card-foreground shadow-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-6">
      {/* Top Header Row inside Main Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Upcoming Schedules
              </h3>
              {matchedCollegeName && (
                <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] font-medium py-0 px-2 h-5 flex items-center">
                  <GraduationCap className="w-3 h-3 mr-1" /> {matchedCollegeName} Partner
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            size="sm"
            onClick={() => handleOpenAddDialog("interview")}
            className="h-9 px-3.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </Button>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block"></div>

          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
            {totalActiveCount} Active
          </Badge>
        </div>
      </div>

      {totalActiveCount === 0 ? (
        /* Clean Zero State */
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-bold text-foreground">No upcoming schedule</p>
            <p className="text-xs text-muted-foreground">
              Add your upcoming technical screens, mock interviews, or online assessments to stay organized.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: SCHEDULED INTERVIEWS (Rendered ONLY if items exist) */}
          {interviewEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Scheduled Interviews
                  </h4>
                  <Badge className="text-[10px] bg-blue-600/40 dark:bg-blue-600/40 text-black dark:text-gray-100 font-bold px-1.5 py-0 rounded-md">
                    {interviewEvents.length}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAddDialog("interview")}
                  className="h-7 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-500 font-semibold cursor-pointer gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Add Interview</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {interviewEvents.map((evt) => {
                  const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                  const isAdminControlled = evt.source === "admin" || evt.isCollegeDrive;
                  const collegeTitle = evt.collegeName || evt.company || "Placement Drive";

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditDialog(evt)}
                      className={cn(
                        "p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 group relative shadow-xs",
                        isAdminControlled
                          ? "bg-[#EDE9E1]/50 dark:bg-[#BDB8AD]/5 border-[#EDE9E1]/70 hover:border-[#CCC7BC]/80 dark:border-[#CCC7BC]/5 dark:hover:border-[#CCC7BC]/50"
                          : "bg-background/80 dark:bg-background/50 hover:bg-background border-border/60 hover:border-border cursor-pointer"
                      )}
                    >
                      {/* Top Row: Type Badge + Admin Verification Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider", conf.badgeClass)}>
                            {conf.label}
                          </span>

                          {isAdminControlled && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-500" />
                              {evt.isCollegeDrive ? "College Scheduled" : "Admin Scheduled"}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {format(parseISO(evt.date), "MMM d")}
                        </span>
                      </div>

                      {/* Title & Company & Role */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {evt.title}
                        </h5>
                        {evt.company && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                            <span className="truncate">{evt.company}</span>
                          </div>
                        )}
                        {evt.targetRole && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                            <span className="truncate">Role: {evt.targetRole}</span>
                          </div>
                        )}
                      </div>

                      {/* Details tags */}
                      {isAdminControlled && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {evt.durationMinutes && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E3DFD6] dark:bg-gray-900/90 text-foreground/80">
                              {evt.durationMinutes} Mins
                            </span>
                          )}
                          {evt.questionCountLimit && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E3DFD6] dark:bg-gray-900/90 text-foreground/80">
                              Max {evt.questionCountLimit} Qs
                            </span>
                          )}
                          {evt.passingScore !== undefined && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              Target {evt.passingScore}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Time & Notes */}
                      {(evt.time || evt.notes) && (
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          {evt.notes && (
                            <div className="text-[11px] text-muted-foreground/90 bg-[#E3DFD6] dark:bg-gray-900/40 p-2.5 rounded-xl border border-border/40 mt-1.5">
                              <span className="font-semibold block mb-0.5 text-foreground/80">Instructions:</span>
                              <p className="whitespace-pre-wrap leading-relaxed">{evt.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        {isAdminControlled ? (
                          /* Admin card: NO mark done, NO edit, NO delete */
                          <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            <span>Official Interview</span>
                          </div>
                        ) : (
                          /* User card: Mark done checkbox */
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(evt.id);
                            }}
                            className="text-[11px] text-muted-foreground hover:text-emerald-500 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {evt.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                            <span>{evt.completed ? "Done" : "Mark Done"}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          {!isAdminControlled && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(evt);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(evt.id);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {evt.link ? (
                            <a
                              href={evt.link}
                              target={evt.link.startsWith("http") ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer shadow-xs",
                                isAdminControlled
                                  ? "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-sm hover:shadow-blue-500/25 active:scale-[0.98]"
                                  : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 active:scale-[0.98]"
                              )}
                            >
                              <span>Join Interview</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Details →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: UPCOMING EVENTS & ASSESSMENTS (Rendered ONLY if items exist) */}
          {upcomingEventItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Upcoming Events & Assessments
                  </h4>
                  <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 rounded-md">
                    {upcomingEventItems.length}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAddDialog("oa")}
                  className="h-7 px-2 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold cursor-pointer gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Add Event</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {upcomingEventItems.map((evt) => {
                  const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.oa;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditDialog(evt)}
                      className="p-4 rounded-xl sm:rounded-2xl bg-background/80 dark:bg-background/50 hover:bg-background border border-border/60 hover:border-border transition-all duration-200 flex flex-col justify-between space-y-3 group cursor-pointer shadow-xs"
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider", conf.badgeClass)}>
                          {conf.label}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {format(parseISO(evt.date), "MMM d")}
                        </span>
                      </div>

                      {/* Title & Organization */}
                      <div className="space-y-1">
                        <h5 className="text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {evt.title}
                        </h5>
                        {evt.company && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                            <span className="truncate">{evt.company}</span>
                          </div>
                        )}
                      </div>

                      {/* Time & Notes */}
                      {(evt.time || evt.notes) && (
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          {evt.time && (
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                              <span>{evt.time}</span>
                            </div>
                          )}
                          {evt.notes && (
                            <p className="text-[10px] text-muted-foreground/90 bg-muted/40 p-2 rounded-xl border border-border/40 line-clamp-2 mt-1">
                              {evt.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(evt.id);
                          }}
                          className="text-[11px] text-muted-foreground hover:text-emerald-500 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {evt.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span>{evt.completed ? "Done" : "Mark Done"}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(evt);
                            }}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(evt.id);
                            }}
                            className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {evt.link && (
                            <a
                              href={evt.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 active:scale-[0.98] transition-all duration-200 shadow-2xs cursor-pointer"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              {editingEventId ? "Edit Scheduled Item" : "Schedule Interview or Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Schedule your upcoming mock sessions, interview rounds, or online assessments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Title / Role *
              </label>
              <Input
                placeholder="e.g. System Design Mock, Stripe OA, Amazon Screen"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>

            {/* Category & Company */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Category *
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(val: EventType) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="interview">Official Interview</SelectItem>
                    <SelectItem value="mock">Mock Session</SelectItem>
                    <SelectItem value="oa">Online Assessment (OA)</SelectItem>
                    <SelectItem value="goal">Prep Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Company (Optional)
                </label>
                <Input
                  placeholder="e.g. Google, Stripe, Meta"
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
                  Date *
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
                  placeholder="e.g. 02:30 PM"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Meeting Link / Portal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Meeting Link / Portal URL (Optional)
              </label>
              <Input
                placeholder="e.g. https://meet.google.com/... or test portal link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Notes & Prep Focus (Optional)
              </label>
              <Textarea
                placeholder="Key topics to review, question formats, checklist..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs rounded-xl min-h-[70px] resize-none"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-9 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl cursor-pointer"
              >
                {editingEventId ? "Save Changes" : "Schedule Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </Card>
  );
};
