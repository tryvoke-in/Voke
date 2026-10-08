import { Moon, Sun } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, iconClassName }) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const triggerShockwave = (nextTheme: "light" | "dark", originX: number, originY: number) => {
    try {
      const shockwave = document.createElement("div");
      shockwave.className = `theme-ripple-shockwave ${nextTheme === "dark" ? "shockwave-dark" : "shockwave-light"}`;
      shockwave.style.left = `${originX}px`;
      shockwave.style.top = `${originY}px`;
      document.body.appendChild(shockwave);
      setTimeout(() => {
        shockwave.remove();
      }, 750);
    } catch {}
  };

  const runFallbackCircularWipe = (nextTheme: "light" | "dark") => {
    isTransitioningRef.current = true;
    try {
      const curtain = document.createElement("div");
      curtain.className = `theme-fallback-circle ${nextTheme === "dark" ? "curtain-dark" : "curtain-light"}`;
      document.body.appendChild(curtain);

      setTimeout(() => {
        applyTheme(nextTheme);
      }, 300);

      setTimeout(() => {
        curtain.remove();
        isTransitioningRef.current = false;
        setWaveId((id) => id + 1);
      }, 750);
    } catch {
      applyTheme(nextTheme);
      isTransitioningRef.current = false;
    }
  };

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTransitioningRef.current) return;

    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";

    // Compute exact button center position in viewport
    const rect = buttonRef.current?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : e.clientX || window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : e.clientY || 40;

    // Radius needed to cover the furthest corner of the viewport from the button
    const endRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    // Expose coordinates as CSS variables for GPU animations
    root.style.setProperty("--theme-origin-x", `${originX}px`);
    root.style.setProperty("--theme-origin-y", `${originY}px`);
    root.style.setProperty("--theme-end-radius", `${endRadius}px`);

    // Emit luminous shockwave ring outward from the button
    triggerShockwave(nextTheme, originX, originY);
    setWaveId((id) => id + 1);

    // Fallback for browsers without View Transition API or if reduced motion is preferred
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      runFallbackCircularWipe(nextTheme);
      return;
    }

    isTransitioningRef.current = true;

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          applyTheme(nextTheme);
        });
      });

      // Drive circular clip-path reveal via Web Animations API directly on ::view-transition-new(root)
      if (transition.ready) {
        transition.ready.then(() => {
          try {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${originX}px ${originY}px)`,
                  `circle(${endRadius}px at ${originX}px ${originY}px)`
                ]
              },
              {
                duration: 700,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)"
              }
            );
          } catch {
            // CSS rule in index.css automatically handles browsers where JS pseudoElement is unsupported
          }
        });
      }

      void transition.finished.catch(() => {
        applyTheme(nextTheme);
      }).finally(() => {
        isTransitioningRef.current = false;
      });
    } catch {
      applyTheme(nextTheme);
      isTransitioningRef.current = false;
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className || "text-muted-foreground hover:text-foreground hover:bg-muted/50 relative h-9 w-9 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer overflow-hidden"}
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
          className={`w-[18px] h-[18px] ${iconClassName || "text-amber-400"} absolute transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] transform ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-180 scale-0 opacity-0"
          }`}
        />
        <Moon
          className={`w-[18px] h-[18px] ${iconClassName || "text-slate-700 dark:text-slate-200"} absolute transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] transform ${
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-180 scale-0 opacity-0"
          }`}
        />
      </span>
    </Button>
  );
};
