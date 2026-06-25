import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { WAITLIST_CONFIG, isPublicPath } from "@/config/waitlist";
import { useToast } from "@/components/ui/use-toast";

export const WaitlistGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { toast } = useToast();
  const [isBypassed, setIsBypassed] = useState(() => {
    return localStorage.getItem("voke_waitlist_bypass") === "true";
  });

  useEffect(() => {
    // Check URL parameters for bypass code
    const queryParams = new URLSearchParams(location.search);
    const bypassParam = queryParams.get("bypass");

    if (bypassParam === WAITLIST_CONFIG.bypassCode) {
      localStorage.setItem("voke_waitlist_bypass", "true");
      setIsBypassed(true);
      
      // Clean up the URL parameter
      queryParams.delete("bypass");
      const cleanSearch = queryParams.toString();
      const cleanPath = location.pathname + (cleanSearch ? `?${cleanSearch}` : "");
      
      window.history.replaceState(null, "", window.location.origin + cleanPath);
      
      toast({
        title: "Developer Bypass Activated",
        description: "Bypass mode is active. You can access all restricted routes.",
      });
    }
  }, [location.search, location.pathname, toast]);

  // Sync state with localStorage on path changes (e.g., after logging in via dialog)
  useEffect(() => {
    const currentBypass = localStorage.getItem("voke_waitlist_bypass") === "true";
    if (currentBypass !== isBypassed) {
      setIsBypassed(currentBypass);
    }
  }, [location.pathname]);

  // If waitlist is disabled, let everything through
  if (!WAITLIST_CONFIG.enabled) {
    return <>{children}</>;
  }

  // If developer bypass is active, let everything through
  if (isBypassed) {
    return (
      <>
        {children}
        <div 
          onClick={() => {
            localStorage.removeItem("voke_waitlist_bypass");
            window.location.href = "/";
          }}
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 bg-zinc-950/90 hover:bg-zinc-900 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-full shadow-lg shadow-emerald-500/5 transition-all duration-300 group hover:scale-105 cursor-pointer text-xs font-semibold select-none"
          title="Click to Exit Developer Bypass"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Dev Mode Active</span>
          <span className="text-zinc-600 dark:text-zinc-500 mx-1">|</span>
          <span className="text-emerald-500/80 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            Exit
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </div>
      </>
    );
  }

  // Check if current path is public
  if (isPublicPath(location.pathname)) {
    return <>{children}</>;
  }

  // Otherwise, redirect to waitlist page
  return <Navigate to="/waitlist" replace state={{ from: location }} />;
};
export default WaitlistGuard;
