import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  Play,
  Code,
  FileQuestion,
  FileText,
  Briefcase,
  Zap,
  Users,
  HelpCircle,
  User,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Building2,
  Keyboard,
  LogOut,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COMPANIES = [
  { id: "c1", name: "Google", slug: "google" },
  { id: "c2", name: "Amazon", slug: "amazon" },
  { id: "c3", name: "Meta", slug: "meta" },
  { id: "c4", name: "Microsoft", slug: "microsoft" },
  { id: "c5", name: "Apple", slug: "apple" },
  { id: "c6", name: "Netflix", slug: "netflix" },
];

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  
  // Dynamic question database states
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Company list states
  const [companies, setCompanies] = useState<any[]>([]);

  // Fetch companies from Supabase
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Fetch companies from Supabase
  useEffect(() => {
    if (open) {
      const fetchCompanies = async () => {
        try {
          const { data } = await supabase
            .from("companies")
            .select("id, name, slug")
            .order("name");
          if (data && data.length > 0) {
            setCompanies(data);
          }
        } catch (err) {
          console.error("Error fetching companies:", err);
        }
      };
      fetchCompanies();
    }
  }, [open]);

  // Lazy-load questions database when dialog is opened
  useEffect(() => {
    if (open && allQuestions.length === 0) {
      setLoadingQuestions(true);
      import("@/data/questions")
        .then((mod) => {
          setAllQuestions(mod.QUESTIONS || []);
        })
        .catch((err) => {
          console.error("Failed to load questions database:", err);
        })
        .finally(() => {
          setLoadingQuestions(false);
        });
    }
  }, [open, allQuestions.length]);

  // Close dialog and navigate helper
  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  // Close dialog and open question helper
  const handleOpenQuestion = (url: string) => {
    onOpenChange(false);
    window.open(url, "_blank");
  };

  // Close dialog and open AI coach helper
  const handleOpenAICoach = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("open-ai-coach"));
  };

  // Close dialog and logout helper
  const handleLogout = async () => {
    onOpenChange(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  // Client-side filtering logic
  const normalizedQuery = search.trim().toLowerCase();

  const displayCompanies = companies.length > 0 ? companies : DEFAULT_COMPANIES;
  
  const filteredCompanies = normalizedQuery
    ? displayCompanies.filter((c) =>
        c.name.toLowerCase().includes(normalizedQuery)
      ).slice(0, 5)
    : displayCompanies.slice(0, 5);

  const filteredQuestions = normalizedQuery
    ? allQuestions
        .filter((q) => {
          return (
            q.title.toLowerCase().includes(normalizedQuery) ||
            q.tags.some((t: string) => t.toLowerCase().includes(normalizedQuery)) ||
            q.companies.some((c: string) => c.toLowerCase().includes(normalizedQuery))
          );
        })
        .slice(0, 5)
    : allQuestions.slice(0, 5); // Fallback: show first 5 popular questions when empty

  const navigationItems = [
    { label: "Community Forum", path: "/community", icon: Users },
    { label: "Help & FAQ Center", path: "/help", icon: HelpCircle },
    { label: "Profile Settings", path: "/profile", icon: User },
  ];

  const filteredNavigation = normalizedQuery
    ? navigationItems.filter((item) =>
        item.label.toLowerCase().includes(normalizedQuery)
      )
    : navigationItems;

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Medium":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Hard":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-500";
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-[#0f111a] border border-border/80 rounded-lg overflow-hidden shadow-2xl">
        <CommandInput
          placeholder="Search questions, companies..."
          value={search}
          onValueChange={setSearch}
          className="border-b border-border/50 text-foreground"
        />
        <CommandList className="max-h-[450px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <span className="text-xl">🔍</span>
            <span>No results found for "{search}"</span>
          </CommandEmpty>

          {/* Navigation Links Group */}
          {filteredNavigation.length > 0 && (
            <CommandGroup heading="Navigation & Pages">
              {filteredNavigation.map((item) => (
                <CommandItem
                  key={item.path}
                  onSelect={() => handleNavigate(item.path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-150"
                >
                  <item.icon className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Practice Questions Group */}
          {filteredQuestions.length > 0 && (
            <>
              <CommandSeparator className="my-1 opacity-20" />
              <CommandGroup
                heading={
                  <div className="flex items-center justify-between">
                    <span>Practice Questions</span>
                    {loadingQuestions && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  </div>
                }
              >
                {filteredQuestions.map((q) => (
                  <CommandItem
                    key={q.id}
                    onSelect={() => handleOpenQuestion(q.url)}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-150"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-sm font-medium truncate">{q.title}</span>
                      <span className="text-[10px] text-muted-foreground/80 shrink-0">({q.platform})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.companies && q.companies.length > 0 && (
                        <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground/90 font-medium max-w-[80px] truncate">
                          {q.companies[0]}
                        </span>
                      )}
                      <Badge variant="outline" className={`rounded-sm text-[10px] font-semibold border-0 px-2 py-0.5 ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </Badge>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Companies Group */}
          {filteredCompanies.length > 0 && (
            <>
              <CommandSeparator className="my-1 opacity-20" />
              <CommandGroup heading="Browse Company Questions">
                {filteredCompanies.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => handleNavigate(`/companies/${c.slug}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-150"
                  >
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">{c.name} Questions</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Actions Shortcuts Group */}
          <CommandSeparator className="my-1 opacity-20" />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={handleOpenAICoach}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-150"
            >
              <Sparkles className="w-4 h-4 text-pink-500 fill-pink-500/20" />
              <span className="text-sm font-medium">Ask AI Study Coach</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigate("/peer-interviews")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-150"
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Match with Peers for Mock Interview</span>
            </CommandItem>
            <CommandItem
              onSelect={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/5 cursor-pointer text-destructive hover:text-destructive/90 transition-all duration-150"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Log out from Session</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Use <kbd className="px-1 bg-muted rounded border border-border/80">↑↓</kbd> to navigate, <kbd className="px-1 bg-muted rounded border border-border/80">enter</kbd> to select</span>
          </div>
          <span>Press <kbd className="px-1 bg-muted rounded border border-border/80">esc</kbd> to close</span>
        </div>
      </div>
    </CommandDialog>
  );
};
