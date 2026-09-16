import { Moon, Sun } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  const isTransitioningRef = useRef(false);
  const [waveId, setWaveId] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark" && !root.classList.contains("dark")) {
      root.classList.add("dark");
    } else if (theme === "light" && root.classList.contains("dark")) {
      root.classList.remove("dark");
    }
  }, [theme]);

  const applyTheme = (nextTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    if (isTransitioningRef.current) return;

    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";

    // Fallback for browsers without View Transition API or if reduced motion is preferred
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      applyTheme(nextTheme);
      return;
    }

    isTransitioningRef.current = true;

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          applyTheme(nextTheme);
        });
      });

      // A page-sized clip-path wave repaints every frame. Keep the page
      // transition to opacity and use a composited pulse on the control.
      void transition.finished.catch(() => {
        applyTheme(nextTheme);
      }).finally(() => {
        isTransitioningRef.current = false;
        setWaveId((id) => id + 1);
      });
    } catch {
      applyTheme(nextTheme);
      isTransitioningRef.current = false;
      setWaveId((id) => id + 1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 relative h-9 w-9 rounded-full transition-colors flex items-center justify-center cursor-pointer overflow-hidden"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {waveId > 0 && (
        <span
          key={waveId}
          aria-hidden="true"
          className="theme-toggle-wave absolute inset-0 rounded-full pointer-events-none"
        />
      )}
      <span className="relative flex items-center justify-center w-5 h-5 pointer-events-none">
        <Sun
          className={`w-5 h-5 text-amber-400 absolute transition-all duration-300 transform ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon
          className={`w-5 h-5 text-slate-700 dark:text-slate-200 absolute transition-all duration-300 transform ${
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
    </Button>
  );
};
