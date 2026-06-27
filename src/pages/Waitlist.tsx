import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, ArrowRight, Sparkles, CheckCircle, Twitter, Linkedin, ShieldAlert, Code, GraduationCap, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WAITLIST_CONFIG } from "@/config/waitlist";
import { ADMIN_EMAIL } from "@/config/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Waitlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Developer bypass state
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const [bypassCode, setBypassCode] = useState("");
  const [bypassError, setBypassError] = useState(false);
  const [isBypassed, setIsBypassed] = useState(() => {
    return localStorage.getItem("voke_waitlist_bypass") === "true";
  });

  useEffect(() => {
    if (isBypassed) {
      const checkSessionAndRedirect = async () => {
        try {
          // Guarantee resolution within 800ms to prevent hanging on page load
          const { data, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 800))
          ]);

          if (error) throw error;

          if (data?.session) {
            if (data.session.user.email === ADMIN_EMAIL) {
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          } else {
            navigate("/auth");
          }
        } catch (err) {
          console.warn("[Waitlist Bypasser] Session check failed/timed out, redirecting to /auth:", err);
          navigate("/auth");
        }
      };
      checkSessionAndRedirect();
    }
  }, [isBypassed, navigate]);

  const handleExitBypass = () => {
    localStorage.removeItem("voke_waitlist_bypass");
    setIsBypassed(false);
    toast({
      title: "Access Deactivated",
      description: "Session closed. You are now previewing the waitlist as a public visitor.",
    });
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (!collegeName.trim()) {
      toast({
        title: "College/University required",
        description: "Please enter your college or university name.",
        variant: "destructive",
      });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ 
          email, 
          college_name: collegeName, 
          phone_number: phoneNumber 
        }]);

      if (error) {
        // Check for duplicate key error (code 23505 in PostgreSQL)
        if (error.code === "23505" || error.message?.includes("unique")) {
          toast({
            title: "Already Registered",
            description: "You're already on the waitlist! We'll notify you soon.",
          });
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome aboard!",
          description: "You've been added to the waitlist. We will reach out soon!",
        });
        setSubmitted(true);
      }
    } catch (err: any) {
      console.error("Waitlist error:", err);
      toast({
        title: "Submission failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bypassCode === WAITLIST_CONFIG.bypassCode) {
      localStorage.setItem("voke_waitlist_bypass", "true");
      setIsBypassed(true);
      toast({
        title: "Access Granted",
        description: "Checking session and redirecting...",
      });
      setShowBypassDialog(false);

      // Perform immediate redirect to bypass React hook state change lag
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 800))
        ]);

        if (error) throw error;

        if (data?.session) {
          if (data.session.user.email === ADMIN_EMAIL) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/auth");
        }
      } catch (err) {
        navigate("/auth");
      }
    } else {
      setBypassError(true);
      toast({
        title: "Access Denied",
        description: "Incorrect security code. Please check your email.",
        variant: "destructive",
      });
    }
  };

  const handleLogoDoubleClick = () => {
    setShowBypassDialog(true);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30 flex flex-col justify-between relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -z-10 animate-pulse duration-10000" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group select-none"
          onDoubleClick={handleLogoDoubleClick}
          title="Enter security code to try Voke"
        >
          <img 
            src="/images/voke_logo.png" 
            alt="Voke Logo" 
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Voke
          </span>
        </div>
        {isBypassed ? (
          <button 
            onClick={handleExitBypass}
            className="border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 bg-transparent hover:bg-emerald-500/10 text-xs flex gap-1.5 items-center rounded-xl transition-all duration-300 hover:scale-105 h-9 px-4 py-2 font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Access Active (Exit)
          </button>
        ) : (
          <Button 
            variant="ghost" 
            onClick={() => setShowBypassDialog(true)}
            className="text-gray-400 hover:text-white hover:bg-white/5 text-xs flex gap-1 items-center"
          >
            <Code className="w-3.5 h-3.5" />
            Enter Security Code
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 flex-grow flex items-center justify-center py-12">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.5 }}
                className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
                  <span>Join Voke Private Beta</span>
                </div>

                <h1 className="text-3.5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                  Level up your interview prep.
                </h1>
                
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Practice realistic AI-driven mock interviews, get instant actionable feedback, and analyze your performance. Join the waitlist for early access.
                </p>

                <form onSubmit={handleJoinWaitlist} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black/50 border-white/10 text-white pl-10 h-12 focus-visible:ring-violet-500 rounded-xl"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="college" className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                      College / University
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="college"
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="bg-black/50 border-white/10 text-white pl-10 h-12 focus-visible:ring-violet-500 rounded-xl"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. +1 (555) 000-0000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-black/50 border-white/10 text-white pl-10 h-12 focus-visible:ring-violet-500 rounded-xl"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl"
              >
                <div className="mx-auto w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center mb-6 text-violet-400">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Thank you for your interest in Voke. We will email you at <span className="text-violet-300 font-medium">{email}</span> as soon as spots open up.
                </p>

                <div className="space-y-4">
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Share and invite friends</div>
                  <div className="flex gap-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        "Just joined the waitlist for @voke_ai - the ultimate AI mock interviewer! 🚀 Can't wait to level up my prep. Join me here: https://voke.in"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white h-11 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors font-medium">
                        <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                        Share on X
                      </button>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://voke.in")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white h-11 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors font-medium">
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        Share on LinkedIn
                      </button>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 text-center text-xs text-gray-600 border-t border-white/5">
        &copy; {new Date().getFullYear()} Voke. All rights reserved. &middot; <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
      </footer>

      {/* Security Code Dialog */}
      <Dialog open={showBypassDialog} onOpenChange={setShowBypassDialog}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-violet-400" />
              Enter Security Code
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Enter the security code sent to your email to try Voke.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBypassSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-zinc-300 text-xs">
                Security Code
              </Label>
              <Input
                id="code"
                type="password"
                placeholder="Enter code..."
                value={bypassCode}
                onChange={(e) => {
                  setBypassCode(e.target.value);
                  setBypassError(false);
                }}
                className={`bg-zinc-900 border-white/10 text-white focus-visible:ring-violet-500 h-10 ${
                  bypassError ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                autoFocus
              />
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowBypassDialog(false);
                  setBypassCode("");
                  setBypassError(false);
                }}
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Waitlist;
