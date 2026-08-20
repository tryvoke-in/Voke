import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, 
  CheckCircle2, Circle, ExternalLink, Building2, Briefcase, 
  AlertCircle, ChevronLeft, ChevronRight, Filter, Sparkles, 
  Code2, Target, CalendarDays, ListFilter, Check, X, Bell
} from "lucide-react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  parseISO, isToday, isBefore, startOfToday 
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
    label: "Job Deadline",
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
    label: "Assessment / OA",
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
    date: format(addDays(new Date(), 4), "yyyy-MM-dd"),
    time: "10:30 AM",
    company: "Google",
    link: "https://meet.google.com",
    notes: "Review Binary Trees, Dynamic Programming & Time Complexity."
  },
  {
    id: "evt-2",
    title: "Amazon SDE II Application Deadline",
    type: "deadline",
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "11:59 PM",
    company: "Amazon",
    link: "https://amazon.jobs",
    notes: "Tailor resume keywords for Leadership Principles."
  },
  {
    id: "evt-3",
    title: "Stripe Online Assessment (OA)",
    type: "oa",
    date: format(addDays(new Date(), 6), "yyyy-MM-dd"),
    time: "02:00 PM",
    company: "Stripe",
    notes: "90 min Hackerrank test on REST APIs and Rate Limiting."
  },
  {
    id: "evt-4",
    title: "System Design Mock Interview",
    type: "mock",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "05:00 PM",
    notes: "Practice designing Distributed Message Queue with AI Voice Coach."
  },
  {
    id: "evt-5",
    title: "Finish 75-Day DSA Array & Graph set",
    type: "goal",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "All Day",
    completed: false,
    notes: "Solve 5 medium questions on Voke DSA sheet."
  }
];

export const InterviewCalendarWidget: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid");
  const [filterType, setFilterType] = useState<string>("all");

  // Modal State
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

  // Load from local storage or initialize
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

  const handleOpenAddDialog = (dateOverride?: Date) => {
    const targetDate = dateOverride || selectedDate || new Date();
    setEditingEventId(null);
    setFormData({
      title: "",
      type: "interview",
      date: format(targetDate, "yyyy-MM-dd"),
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

  // Month navigation
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Filter events
  const filteredEvents = events.filter(e => {
    if (filterType === "all") return true;
    return e.type === filterType;
  });

  // Selected date events
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDateEvents = filteredEvents.filter(e => e.date === selectedDateStr);

  // Calendar Grid generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dateStr = format(cloneDay, "yyyy-MM-dd");
      const dayEvents = filteredEvents.filter(e => e.date === dateStr);
      const isSelected = isSameDay(cloneDay, selectedDate);
      const isCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isCurrentDay = isToday(cloneDay);

      days.push(
        <div
          key={cloneDay.toISOString()}
          onClick={() => setSelectedDate(cloneDay)}
          className={cn(
            "min-h-[90px] sm:min-h-[105px] p-2 border-b border-r border-border/40 transition-all cursor-pointer flex flex-col justify-between group relative select-none",
            !isCurrentMonth && "bg-muted/15 text-muted-foreground/50",
            isCurrentMonth && "hover:bg-muted/30 bg-card",
            isSelected && "bg-blue-500/5 dark:bg-blue-500/10 ring-2 ring-blue-500/60 ring-inset z-10"
          )}
        >
          {/* Day Number Header */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                isCurrentDay && "bg-blue-600 text-white shadow-xs font-bold",
                !isCurrentDay && isCurrentMonth && "text-foreground group-hover:text-blue-500",
                !isCurrentDay && !isCurrentMonth && "text-muted-foreground/60"
              )}
            >
              {format(cloneDay, "d")}
            </span>

            {/* Quick add button on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(cloneDay);
                handleOpenAddDialog(cloneDay);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Add event on this date"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Events List in Day Cell */}
          <div className="space-y-1 mt-1 overflow-hidden flex-1">
            {dayEvents.slice(0, 2).map(evt => {
              const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
              return (
                <div
                  key={evt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(cloneDay);
                    handleOpenEditDialog(evt);
                  }}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 font-medium transition-all shadow-2xs",
                    conf.badgeClass,
                    evt.completed && "line-through opacity-60"
                  )}
                  title={`${evt.title} ${evt.time ? `(${evt.time})` : ""}`}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", conf.dotClass)} />
                  <span className="truncate">{evt.company ? `${evt.company}: ` : ""}{evt.title}</span>
                </div>
              );
            })}

            {dayEvents.length > 2 && (
              <span className="text-[10px] text-muted-foreground font-semibold px-1 block">
                +{dayEvents.length - 2} more
              </span>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 border-l border-border/40" key={day.toISOString()}>
        {days}
      </div>
    );
    days = [];
  }

  // Upcoming upcoming list
  const upcomingEvents = [...filteredEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(e => !isBefore(parseISO(e.date), startOfToday()));

  return (
    <Card className="border border-border/60 bg-card shadow-xl rounded-3xl overflow-hidden">
      {/* Widget Header & Controls */}
      <CardHeader className="p-6 pb-4 border-b border-border/50 bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl font-bold text-foreground tracking-tight">
                  Interview & Career Schedule
                </CardTitle>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-semibold">
                  {events.length} Scheduled
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Track your upcoming real interviews, job application deadlines, mock sessions & OAs
              </CardDescription>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  viewMode === "grid" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  viewMode === "agenda" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Agenda List
              </button>
            </div>

            {/* Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border/60 bg-background">
                <Filter className="w-3 h-3 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="interview">Interviews</SelectItem>
                <SelectItem value="deadline">Job Deadlines</SelectItem>
                <SelectItem value="mock">Mock Sessions</SelectItem>
                <SelectItem value="oa">Online Assessments</SelectItem>
                <SelectItem value="goal">Study Goals</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Event Button */}
            <Button
              size="sm"
              onClick={() => handleOpenAddDialog()}
              className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Event</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Monthly Grid (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Month Navigation Row */}
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="h-7 px-2.5 text-xs font-semibold rounded-lg border-border/60"
                  >
                    Today
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevMonth}
                    className="h-8 w-8 p-0 rounded-lg border-border/60 text-muted-foreground hover:text-foreground"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextMonth}
                    className="h-8 w-8 p-0 rounded-lg border-border/60 text-muted-foreground hover:text-foreground"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Month Grid */}
              <div className="border-t border-border/40 rounded-2xl overflow-hidden bg-card/40">
                {rows}
              </div>
            </div>

            {/* Right: Selected Day Panel & Upcoming Quick Glance (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Selected Day Header */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Selected Date
                    </span>
                    <h4 className="text-base font-bold text-foreground">
                      {format(selectedDate, "EEEE, MMMM do")}
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAddDialog(selectedDate)}
                    className="h-7 px-2 text-xs rounded-lg border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>

                {/* Selected Day Events List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-background/50">
                      <CalendarIcon className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                      <p className="text-xs font-medium">No events on this day</p>
                      <button
                        onClick={() => handleOpenAddDialog(selectedDate)}
                        className="text-xs text-blue-500 hover:underline font-semibold mt-1 inline-block"
                      >
                        + Schedule an interview or deadline
                      </button>
                    </div>
                  ) : (
                    selectedDateEvents.map(evt => {
                      const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                      const Icon = conf.icon;
                      return (
                        <div
                          key={evt.id}
                          className={cn(
                            "p-3 rounded-xl bg-background border border-border/60 hover:border-blue-500/40 transition-all space-y-1.5 shadow-2xs group border-l-4",
                            conf.borderClass
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                onClick={() => handleToggleComplete(evt.id)}
                                className="text-muted-foreground hover:text-emerald-500 transition-colors shrink-0"
                              >
                                {evt.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={cn("text-xs font-bold text-foreground truncate", evt.completed && "line-through text-muted-foreground")}>
                                {evt.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => handleOpenEditDialog(evt)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(evt.id)}
                                className="p-1 rounded text-muted-foreground hover:text-rose-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap pl-6">
                            {evt.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" /> {evt.time}
                              </span>
                            )}
                            {evt.company && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Building2 className="w-3 h-3 text-muted-foreground" /> {evt.company}
                              </span>
                            )}
                            <span className={cn("px-1.5 py-0.2 rounded text-[10px] border font-semibold", conf.badgeClass)}>
                              {conf.label}
                            </span>
                          </div>

                          {evt.notes && (
                            <p className="text-[11px] text-muted-foreground pl-6 line-clamp-2 leading-relaxed">
                              {evt.notes}
                            </p>
                          )}

                          {evt.link && (
                            <div className="pl-6 pt-0.5">
                              <a
                                href={evt.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-500 hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                <ExternalLink className="w-3 h-3" /> Meeting Link / Portal
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Upcoming Highlights Widget */}
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-500" />
                    Next Milestones
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {upcomingEvents.length} items
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {upcomingEvents.slice(0, 4).map(evt => {
                    const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                    return (
                      <div
                        key={evt.id}
                        onClick={() => {
                          setSelectedDate(parseISO(evt.date));
                          setCurrentMonth(parseISO(evt.date));
                        }}
                        className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/40 transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {evt.company ? `${evt.company}: ` : ""}{evt.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(parseISO(evt.date), "MMM d")} {evt.time ? `• ${evt.time}` : ""}
                          </p>
                        </div>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0", conf.badgeClass)}>
                          {conf.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Agenda / List View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="font-bold text-base text-foreground">
                All Upcoming Interviews & Deadlines ({upcomingEvents.length})
              </h3>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-foreground">No upcoming events scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Add your interview rounds or application deadlines to stay prepared.</p>
                <Button
                  size="sm"
                  onClick={() => handleOpenAddDialog()}
                  className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  + Add First Event
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map(evt => {
                  const conf = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.interview;
                  const Icon = conf.icon;
                  return (
                    <div
                      key={evt.id}
                      className={cn(
                        "p-4 rounded-2xl bg-card border border-border/60 hover:shadow-md transition-all space-y-2 border-l-4 group relative",
                        conf.borderClass
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge className={cn(conf.badgeClass, "text-[10px] font-semibold px-2 py-0.5")}>
                          {conf.label}
                        </Badge>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditDialog(evt)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-1 rounded text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-foreground">
                        {evt.title}
                      </h4>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{format(parseISO(evt.date), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        {evt.time && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{evt.time}</span>
                          </div>
                        )}
                        {evt.company && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{evt.company}</span>
                          </div>
                        )}
                      </div>

                      {evt.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 line-clamp-2">
                          {evt.notes}
                        </p>
                      )}

                      {evt.link && (
                        <a
                          href={evt.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 pt-1 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Join Link / Application Portal
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
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
              {editingEventId ? "Edit Scheduled Event" : "Schedule New Event / Deadline"}
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
                placeholder="e.g. Google L4 Tech Interview, Amazon OA Deadline"
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
