import React from "react";
import { motion } from "framer-motion";

interface VokeLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dark";
  className?: string;
}

export const VokeLoader: React.FC<VokeLoaderProps> = ({
  message,
  submessage,
  fullScreen = true,
  size = "md",
  variant = "default",
  className = "",
}) => {
  const isDark = variant === "dark";

  const spinnerSize =
    size === "sm"
      ? "w-11 h-11"
      : size === "lg"
      ? "w-20 h-20"
      : "w-15 h-15 sm:w-16 sm:h-16";

  const logoSize =
    size === "sm"
      ? "w-5 h-5"
      : size === "lg"
      ? "w-9 h-9"
      : "w-7 h-7 sm:w-8 sm:h-8";

  const content = (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Subtle Ambient Emerald Glow */}
      <div
        className={`absolute w-44 h-44 rounded-full blur-2xl pointer-events-none -z-10 ${
          isDark
            ? "bg-emerald-500/[0.14]"
            : "bg-[#0F6B38]/[0.07] dark:bg-emerald-500/[0.09]"
        }`}
      />

      {/* Ring Spinner & Center Logo */}
      <div className={`relative ${spinnerSize} flex items-center justify-center`}>
        {/* Sleek single-track emerald spinner */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-spin ${
            isDark
              ? "border-t-emerald-400"
              : "border-t-[#0F6B38] dark:border-t-emerald-400"
          }`}
        />

        {/* Center Voke Logo */}
        <motion.div
          animate={{ scale: [0.95, 1.04, 0.95] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={`relative z-10 ${logoSize} flex items-center justify-center`}
        >
          <img
            src="/images/voke_logo.png"
            alt="Voke"
            className="w-full h-full object-contain"
          />
        </motion.div>
      </div>

      {/* Simple, clean text */}
      {message && (
        <p
          className={`mt-3.5 text-xs font-medium tracking-wide text-center ${
            isDark ? "text-zinc-300" : "text-muted-foreground/80"
          }`}
        >
          {message}
        </p>
      )}
      {submessage && (
        <p
          className={`mt-1 text-[11px] text-center max-w-[220px] ${
            isDark ? "text-zinc-400/80" : "text-muted-foreground/60"
          }`}
        >
          {submessage}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {content}
      </div>
    );
  }

  return content;
};

export default VokeLoader;
