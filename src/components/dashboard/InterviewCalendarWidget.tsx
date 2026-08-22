import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, 
  CheckCircle2, Circle, ExternalLink, Building2, Briefcase, 
  AlertCircle, ChevronDown, ChevronUp, Sparkles, 
  Code2, Target, Search, Check, Bell
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

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Google Technical Screen (L4)",
    type: "interview",
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    time: "10:30 AM",
    company: "Google",
    link: "https://meet.google.com",
    notes: "Review Binary Trees, Dynamic Programming & Time Complexity."
  },
  {
    id: "evt-2",
    title: "Amazon SDE II Application Deadline",
    type: "deadline",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "11:59 PM",
    company: "Amazon",
    link: "https://amazon.jobs",
    notes: "Tailor resume keywords for Leadership Principles."
  },
  {
    id: "evt-3",
    title: "Stripe Online Assessment (OA)",
    type: "oa",
    date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
    time: "02:00 PM",
    company: "Stripe",
    notes: "90 min Hackerrank test on REST APIs and Rate Limiting."
  },
  {
    id: "evt-4",
    title: "System Design Mock Interview",
    type: "mock",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "05:00 PM",
    notes: "Practice designing Distributed Message Queue with AI Voice Coach."
  },
  {
    id: "evt-5",
    title: "Finish 75-Day DSA Array & Graph set",
    type: "goal",
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "All Day",
    completed: false,
    notes: "Solve 5 medium questions on Voke DSA sheet."
  }
];

export const InterviewCalendarWidget: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  // Load schedule events from localStorage or initialize
  useEffect(() => {
    const saved = localStorage.getItem("voke_user_calendar_events");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents(INITIAL_EVENTS);
      }
    } else {
      setEvents(INITIAL_EVENTS);
      localStorage.setItem("voke_user_calendar_events", JSON.stringify(INITIAL_EVENTS));
    }
  }, []);

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
      saveEvents([...events, newEvent]);
      toast.success("Event scheduled!");
    }

    setIsDialogOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    const filtered = events.filter(e => e.id !== id);
    saveEvents(filtered);
    toast.info("Event removed");
  };

  const handleToggleComplete = (id: string) => {
    const updated = events.map(evt => 
      evt.id === id ? { ...evt, completed: !evt.completed } : evt
    );
    saveEvents(updated);
  };

  // Sort upcoming events chronologically
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(e => !isBefore(parseISO(e.date), startOfToday()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  // Filtered list when searching / filtering in expanded mode
  const displayedExpandedEvents = useMemo(() => {
    return upcomingEvents.filter(e => {
      const matchesFilter = filterType === "all" || e.type === filterType;
      const matchesSearch = !searchQuery.trim() || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.company && e.company.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [upcomingEvents, filterType, searchQuery]);

  // Get relative date display
  const getRelativeDateLabel = (dateStr: string) => {
    try {
      const targetDate = parseISO(dateStr);
      if (isToday(targetDate)) return "Today";
      if (isTomorrow(targetDate)) return "Tomorrow";
      const days = differenceInDays(targetDate, startOfToday());
      if (days > 0 && days <= 7) return `In ${days} days`;
      return format(targetDate, "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="p-4 sm:p-5 pb-3  bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-foreground tracking-tight">
                  Upcoming Schedule & Deadlines
                </CardTitle>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold px-2 py-0.2">
                  {upcomingEvents.length} Active
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Your upcoming interview rounds, OA assessments, and prep deadlines
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Add Button */}
            <Button
              size="sm"
              onClick={handleOpenAddDialog}
              className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg gap-1 shadow-xs transition-all"
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
          /* Empty State */
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border/60 rounded-xl bg-background/50">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
            <p className="text-xs font-semibold text-foreground">No upcoming events scheduled</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
              Schedule your real interview dates, mock tests, or job deadlines to stay prepared.
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddDialog}
              className="mt-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg h-7 px-3"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Schedule Item
            </Button>
          </div>
        ) : (
          <div>
            {/* COLLAPSED VIEW: Top 3-4 Widgets */}
            {!isScheduleExpanded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {upcomingEvents.slice(0, 4).map((evt) => {
                  const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                  const relativeLabel = getRelativeDateLabel(evt.date);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditDialog(evt)}
                      className={cn(
                        "p-3.5 rounded-xl bg-background/80 hover:bg-background border border-border/70 hover:border-border hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative space-y-3",
                        conf.borderClass
                      )}
                    >
                      {/* Top: Category Badge & Relative Timing */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", conf.badgeClass)}>
                          {conf.label}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-md">
                          {relativeLabel}
                        </span>
                      </div>

                      {/* Title & Company */}
                      <div className="space-y-0.5">
                        <h4 className={cn("text-xs sm:text-sm font-bold text-foreground line-clamp-1 transition-colors", evt.completed && "line-through text-muted-foreground")}>
                          {evt.title}
                        </h4>
                        {evt.company && (
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
                          {format(parseISO(evt.date), "MMM d")}
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
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-blue-500 hover:underline font-semibold flex items-center gap-0.5"
                          >
                            Join <ExternalLink className="w-2.5 h-2.5" />
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
              /* EXPANDED VIEW: All upcoming schedules with filter & search */
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/40">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search interview or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs rounded-lg bg-background border-border/60"
                    />
                  </div>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-xs w-[140px] rounded-lg border-border/60 bg-background">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="interview">Interviews</SelectItem>
                      <SelectItem value="deadline">Deadlines</SelectItem>
                      <SelectItem value="mock">Mock Sessions</SelectItem>
                      <SelectItem value="oa">Assessments (OA)</SelectItem>
                      <SelectItem value="goal">Study Goals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expanded Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {displayedExpandedEvents.map((evt) => {
                    const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          "p-3.5 rounded-xl bg-card border border-border/60 hover:shadow-md transition-all space-y-2.5 border-l-3 group relative",
                          conf.borderClass
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", conf.badgeClass)}>
                            {conf.label}
                          </span>
                          <div className="flex items-center gap-1">
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
                            <span>{evt.completed ? "Completed" : "Mark as Completed"}</span>
                          </button>

                          {evt.link && (
                            <a
                              href={evt.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-500 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              Join Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>

      {/* Add / Edit Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              {editingEventId ? "Edit Scheduled Event" : "Schedule Interview / Deadline"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add upcoming interview rounds, application deadlines, mock tests, or study milestones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Google L4 Tech Screen, Amazon OA Deadline"
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
                  Company (Optional)
                </label>
                <Input
                  placeholder="e.g. Google, Amazon"
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

            {/* Meeting Link / Portal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Meeting Link / Portal URL (Optional)
              </label>
              <Input
                placeholder="e.g. https://meet.google.com/xyz or https://jobs.lever.co/..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Notes / Prep Strategy (Optional)
              </label>
              <Textarea
                placeholder="e.g. Topics to review, interviewer details, key focus areas..."
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
                className="h-9 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
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
