import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, X, Building2, Code2, ExternalLink, 
  ArrowRight, Flame, Sparkles, ChevronRight, Tag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { QUESTIONS, Question } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";

interface CompanyItem {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_COMPANIES: CompanyItem[] = [
  { id: "c1", name: "Google", slug: "google" },
  { id: "c2", name: "Amazon", slug: "amazon" },
  { id: "c3", name: "Meta", slug: "meta" },
  { id: "c4", name: "Microsoft", slug: "microsoft" },
  { id: "c5", name: "Apple", slug: "apple" },
  { id: "c6", name: "Netflix", slug: "netflix" },
  { id: "c7", name: "Uber", slug: "uber" },
  { id: "c8", name: "Adobe", slug: "adobe" },
  { id: "c9", name: "Nvidia", slug: "nvidia" },
  { id: "c10", name: "Stripe", slug: "stripe" },
];

const POPULAR_QUESTIONS = [
  { id: 4, title: "Two Sum", difficulty: "Easy", company: "Google, Amazon", tags: ["Array", "Hash Table"] },
  { id: 1, title: "Rotate Image", difficulty: "Medium", company: "Google, Meta", tags: ["Array", "Matrix"] },
  { id: 2, title: "Spiral Matrix", difficulty: "Medium", company: "Apple, Uber", tags: ["Array", "Matrix"] },
  { id: 3, title: "Number of 1 Bits", difficulty: "Easy", company: "Cisco, Qualcomm", tags: ["Bit Manipulation"] },
  { id: 146, title: "LRU Cache", difficulty: "Medium", company: "Amazon, Meta", tags: ["Hash Table", "Linked List"] },
];

const getDifficultyBadge = (difficulty: string) => {
  const d = (difficulty || "").toLowerCase();
  if (d === "easy") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }
  if (d === "hard") {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
  }
  return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
};

export const DashboardSearchBar: React.FC<{
  className?: string;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}> = ({ className, isMobile, onCloseMobile }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [companies, setCompanies] = useState<CompanyItem[]>(DEFAULT_COMPANIES);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch verified companies from Supabase
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await supabase
          .from("companies")
          .select("id, name, slug")
          .order("name");
        if (data && data.length > 0) {
          setCompanies(data);
        }
      } catch {
        // Fallback to DEFAULT_COMPANIES
      }
    };
    fetchCompanies();
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Companies
  const matchingCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies.slice(0, 5);
    return companies
      .filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .slice(0, 4);
  }, [query, companies]);

  // Filtered LeetCode Questions (supports question number #, title, company, and tags)
  const matchingQuestions = useMemo(() => {
    const rawQ = query.trim().toLowerCase();
    if (!rawQ) return [];

    // Extract potential problem number from query e.g. "4", "#4", "q4", "lc 4", "problem 4", "leetcode 4"
    const cleanedNumberMatch = rawQ.match(/(?:(?:#|q|lc|problem|leetcode)\s*)?(\d+)/i);
    const parsedNumber = cleanedNumberMatch ? parseInt(cleanedNumberMatch[1], 10) : null;
    const isPureNumberQuery = /^(?:#|q|lc|problem|leetcode)?\s*\d+$/i.test(rawQ);

    const exactIdMatches: Question[] = [];
    const idPrefixMatches: Question[] = [];
    const directTitleMatches: Question[] = [];
    const secondaryMatches: Question[] = [];

    for (let i = 0; i < QUESTIONS.length; i++) {
      const item = QUESTIONS[i];
      const titleLower = item.title.toLowerCase();
      const itemIdStr = String(item.id);

      // 1. Exact ID match (highest priority for question number searches)
      if (parsedNumber !== null && item.id === parsedNumber) {
        exactIdMatches.push(item);
        continue;
      }

      // 2. ID prefix match when typing numbers (e.g. "1" matches 1, 10, 11...)
      if (isPureNumberQuery && parsedNumber !== null && itemIdStr.startsWith(String(parsedNumber))) {
        idPrefixMatches.push(item);
        continue;
      }

      // 3. Exact or starts-with title match
      if (titleLower === rawQ || titleLower.startsWith(rawQ)) {
        directTitleMatches.push(item);
      } else if (
        titleLower.includes(rawQ) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(rawQ))) ||
        (item.companies && item.companies.some((c) => c.toLowerCase().includes(rawQ)))
      ) {
        secondaryMatches.push(item);
      }

      if (exactIdMatches.length + idPrefixMatches.length + directTitleMatches.length >= 10) {
        break;
      }
    }

    const combined = [
      ...exactIdMatches,
      ...idPrefixMatches,
      ...directTitleMatches,
      ...secondaryMatches,
    ];

    // Deduplicate items by question id
    const seen = new Set<number>();
    const unique: Question[] = [];
    for (const q of combined) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        unique.push(q);
      }
      if (unique.length >= 8) break;
    }

    return unique;
  }, [query]);

  // Flattened items for keyboard navigation
  const allNavItems = useMemo(() => {
    const items: Array<{ type: "company" | "question"; data: any }> = [];
    matchingCompanies.forEach((c) => items.push({ type: "company", data: c }));
    matchingQuestions.forEach((q) => items.push({ type: "question", data: q }));
    return items;
  }, [matchingCompanies, matchingQuestions]);

  const handleSelectCompany = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    if (onCloseMobile) onCloseMobile();
    navigate(`/companies/${slug}`);
  };

  const handleSelectQuestion = (url: string) => {
    setIsOpen(false);
    setQuery("");
    if (onCloseMobile) onCloseMobile();
    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      navigate(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      if (onCloseMobile) onCloseMobile();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allNavItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allNavItems.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < allNavItems.length) {
      e.preventDefault();
      const item = allNavItems[selectedIndex];
      if (item.type === "company") {
        handleSelectCompany(item.data.slug);
      } else {
        handleSelectQuestion(item.data.url);
      }
    }
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = matchingCompanies.length > 0 || matchingQuestions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Minimalist Search Input */}
      <div
        className={cn(
          "relative w-full h-9 rounded-full bg-white/40 hover:bg-muted/60 dark:bg-gray-950/40 dark:hover:bg-gray-900/80 border border-border/60 focus-within:border-blue-500/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 flex items-center px-3 gap-2",
          isOpen && "border-blue-500/60 ring-2 ring-blue-500/20"
        )}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search questions..."
          className="text-xs text-foreground placeholder:text-muted-foreground bg-transparent outline-none w-full font-normal"
        />

        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[9px] font-semibold text-muted-foreground opacity-90 shrink-0">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        )}
      </div>

      {/* Auto-complete Suggestions Dropdown Anchored Directly Below */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-popover/95 dark:bg-[#0c0e17] backdrop-blur-xl border border-border/80 shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar"
          >
            {/* When Query is Empty: Show Top Companies & Trending Questions */}
            {!hasQuery && (
              <div className="p-3 space-y-3">
                {/* Popular Companies */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="w-3 h-3 text-blue-500" />
                    <span>Top Company Questions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {DEFAULT_COMPANIES.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCompany(c.slug)}
                        className="px-2.5 py-1 text-xs rounded-xl bg-muted/50 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 border border-border/40 hover:border-sky-500/30 transition-all font-medium flex items-center gap-1.5"
                      >
                        <Building2 className="w-3 h-3 opacity-60" />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular LeetCode Problems */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>Popular LeetCode Problems</span>
                  </div>
                  <div className="space-y-0.5">
                    {POPULAR_QUESTIONS.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => {
                          setQuery(q.title);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-muted/60 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Code2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors shrink-0" />
                          <span className="text-[11px] font-mono font-bold text-muted-foreground/80 shrink-0">#{q.id}</span>
                          <span className="text-xs font-medium text-foreground truncate">{q.title}</span>
                          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                            • {q.company}
                          </span>
                        </div>
                        <span className={cn("text-[9px] font-semibold px-1.5 py-0.2 rounded-md border", getDifficultyBadge(q.difficulty))}>
                          {q.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* When Query is Typed: Show Matching Results */}
            {hasQuery && (
              <div className="p-2 space-y-2">
                {!hasResults && (
                  <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                    <Code2 className="w-6 h-6 mx-auto opacity-40 text-muted-foreground" />
                    <p className="font-semibold text-foreground">No questions found</p>
                    <p className="text-[11px]">Try searching "#1", "Two Sum", "Google", "146", or "Binary Search"</p>
                  </div>
                )}

                {/* Company Questions Matches */}
                {matchingCompanies.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-blue-500" />
                      <span>Company Interview Sheets</span>
                    </div>
                    {matchingCompanies.map((c, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCompany(c.slug)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 group",
                            isSelected
                              ? "bg-sky-500/15 text-foreground border border-sky-500/30"
                              : "hover:bg-muted/60 dark:hover:bg-white/5 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                              <Building2 className="w-3 h-3" />
                            </div>
                            <div>
                              <span className="text-xs font-bold">{c.name}</span>
                              <span className="text-[11px] text-muted-foreground ml-1.5">Interview Questions</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* LeetCode & DSA Questions Matches */}
                {matchingQuestions.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border/40">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-emerald-500" />
                      <span>LeetCode & DSA Questions ({matchingQuestions.length})</span>
                    </div>
                    {matchingQuestions.map((q, idx) => {
                      const overallIndex = matchingCompanies.length + idx;
                      const isSelected = selectedIndex === overallIndex;
                      return (
                        <div
                          key={q.id}
                          onClick={() => handleSelectQuestion(q.url)}
                          className={cn(
                            "flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 group",
                            isSelected
                              ? "bg-sky-500/15 text-foreground border border-sky-500/30"
                              : "hover:bg-muted/60 dark:hover:bg-white/5 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                              <Code2 className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-mono font-bold text-muted-foreground/90 shrink-0">
                                  #{q.id}
                                </span>
                                <span className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                                  {q.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground/70 shrink-0 font-medium">
                                  ({q.platform})
                                </span>
                              </div>
                              {q.companies && q.companies.length > 0 && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  Asked at: {q.companies.slice(0, 3).join(", ")}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn("rounded-md text-[9px] font-bold border px-1.5 py-0.2", getDifficultyBadge(q.difficulty))}
                            >
                              {q.difficulty}
                            </Badge>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
