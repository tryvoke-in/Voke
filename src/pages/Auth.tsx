import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAIL, isAdminEmail } from "@/config/admin";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, User, ArrowRight, Sparkles, Github, Loader2, Eye, EyeOff, GraduationCap, Building2, Target, Mic, Trophy, ChevronRight, Briefcase, Video, TrendingUp, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isDisposableEmail } from "@/utils/emailValidation";
import { collegeService } from "@/services/collegeService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);

  useEffect(() => {
    // Check for OAuth redirect errors in the URL hash or query
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const queryParams = new URLSearchParams(window.location.search);
    
    let errorDesc = hashParams.get("error_description") || queryParams.get("error_description");
    
    // If we were bounced back from a protected route, the error might be inside the redirect param
    const redirectParam = queryParams.get("redirect");
    if (!errorDesc && redirectParam) {
      try {
        // redirectParam looks like "/dashboard?error=...&error_description=..."
        const embeddedUrl = new URL(redirectParam, window.location.origin);
        errorDesc = embeddedUrl.searchParams.get("error_description");
      } catch (e) {
        // ignore parsing errors
      }
    }
    
    if (errorDesc) {
      if (errorDesc.includes("Multiple accounts")) {
        toast({
          title: "Account Already Exists",
          description: "An account with this email already exists via another provider (like Google). Please log in with Google first, then connect your GitHub from your Profile page.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Login Error",
          description: decodeURIComponent(errorDesc).replace(/\+/g, ' '),
          variant: "destructive",
        });
      }
      
      // Clean up the URL so it doesn't keep showing the error on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // If user arrived via referral link, store it persistently for OAuth/Magic Link support
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("voke_pending_referral", ref);
    }

    const isRecovery = window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery");

    if (isRecovery) {
      setAuthMode("reset");
    }

    // Check if already logged in (only if not recovering)
    if (!isRecovery) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          if (session.user.email) {
            collegeService.recordStudentRegistration({
              email: session.user.email,
              fullName: session.user.user_metadata?.full_name || session.user.email.split("@")[0].replace(/[._]/g, " ")
            });
          }
          if (isAdminEmail(session.user.email)) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      });
    }

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset");
        return;
      }

      if (session && !window.location.hash.includes("type=recovery") && !window.location.search.includes("type=recovery")) {
        if (session.user.email) {
          collegeService.recordStudentRegistration({
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email.split("@")[0].replace(/[._]/g, " ")
          });
        }
        if (session.user.email === ADMIN_EMAIL) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !fullName || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isDisposableEmail(email)) {
      toast({
        title: "Restricted Email Domain",
        description: "Please use a permanent email address (e.g., Gmail, Outlook, Yahoo) to sign up.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        trackEvent("user_signup", "/auth", {
          email,
          full_name: fullName,
        });

        // Record student registration in College Partner Directory immediately
        collegeService.recordStudentRegistration({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim()
        });

        // Signup successful – process referral if one was pending
        const newUser = data?.user;
        const storedRef = localStorage.getItem("voke_pending_referral");
        if (newUser && storedRef) {
          // Fire-and-forget – don't block the UI
          (async () => {
            try {
              const { error } = await supabase.rpc("process_referral", {
                ref_code: storedRef,
                new_user_id: newUser.id
              });
              if (!error) localStorage.removeItem("voke_pending_referral");
            } catch (err) {
              console.error(err);
            }
          })();
        }
        
        setPassword("");
        setFullName("");
        setConfirmPassword("");
        setShowVerificationDialog(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isDisposableEmail(email)) {
      toast({
        title: "Restricted Email Domain",
        description: "Access with temporary email addresses is not permitted.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Error",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else if (error.message.includes("fetch")) {
          toast({
            title: "Connection Error",
            description: "Unable to connect to authentication server. Please check your internet connection and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('[Auth] Sign in exception:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      trackEvent("google_signin_click", "/auth");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGithubSignIn = async () => {
    try {
      trackEvent("github_signin_click", "/auth");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "user:email read:user repo read:org",
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset link sent!",
          description: "Please check your email inbox (and spam folder) for the password reset link.",
        });
        setResetLinkSent(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "A new verification link has been sent to your email.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully!",
        });
        
        // Clear recovery hash/search query from URL
        window.history.replaceState(null, "", window.location.origin + window.location.pathname);
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0f14] text-white selection:bg-emerald-500/30 font-sans antialiased relative overflow-x-hidden">
      {/* Global Unified Precision Grid & Ambient Glow across entire screen */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Deep Slate Base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_25%_40%,rgba(15,23,42,0.3)_0%,rgba(12,15,20,0)_72%),radial-gradient(ellipse_75%_60%_at_75%_40%,rgba(15,23,42,0.3)_0%,rgba(12,15,20,0)_72%)]" />
        {/* Soft Subdued Emerald Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_25%_45%,rgba(16,185,129,0.04)_0%,rgba(15,107,56,0.015)_40%,transparent_75%),radial-gradient(ellipse_50%_40%_at_75%_45%,rgba(16,185,129,0.04)_0%,rgba(15,107,56,0.015)_40%,transparent_75%)]" />
        {/* Subtle Precision Orthogonal Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Left Side - Feature Showcase (fixed so it never moves) */}
      <div className="hidden lg:flex w-1/2 fixed inset-y-0 left-0 items-center justify-center p-8 xl:p-14 overflow-hidden z-10">
        {/* Top corner branding */}
        <div 
          onClick={() => navigate("/")}
          className="absolute top-8 left-8 xl:top-10 xl:left-14 cursor-pointer inline-flex items-center gap-1.5 group z-20"
        >
          <img
            src="/images/voke_logo.png"
            alt="Voke Logo"
            className="w-12 h-12 xl:w-14 xl:h-14 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-extrabold text-2xl xl:text-3xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            Voke
          </span>
        </div>

        <div className="relative z-10 max-w-[480px] w-full mt-5 xl:mt-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-[44px] lg:text-[46px] font-bold tracking-tight mb-3.5 text-white leading-[1.14]">
              Master Your <br />
              <span className="text-emerald-400 font-bold">
                Interview Skills
              </span>
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-md mb-8">
              Join thousands of candidates who are acing their interviews with our AI-powered practice platform.
            </p>

            {/* Interview Flow Steps */}
            <div className="space-y-0 relative">
              {/* Vertical connector line */}
              <div className="absolute left-[20px] top-[38px] bottom-[38px] w-px bg-gradient-to-b from-white/10 via-white/5 to-white/10 pointer-events-none" />

              {[{
                icon: Briefcase,
                title: "Pick a Role",
                desc: "Choose from 50+ roles across top tech companies",
                step: 1,
                badgeBg: "bg-[#1d1230] border border-purple-500/30 text-purple-400 group-hover:bg-[#281845] group-hover:border-purple-400/50",
                hoverText: "group-hover:text-purple-300",
              }, {
                icon: Video,
                title: "Practice",
                desc: "Real-time AI mock interviews with voice & video",
                step: 2,
                badgeBg: "bg-[#0b1d2e] border border-sky-500/30 text-sky-400 group-hover:bg-[#102942] group-hover:border-sky-400/50",
                hoverText: "group-hover:text-sky-300",
              }, {
                icon: TrendingUp,
                title: "Get Scored",
                desc: "Detailed feedback on content, delivery & confidence",
                step: 3,
                badgeBg: "bg-[#271906] border border-amber-500/30 text-amber-400 group-hover:bg-[#382409] group-hover:border-amber-400/50",
                hoverText: "group-hover:text-amber-300",
              }, {
                icon: Rocket,
                title: "Land the Job",
                desc: "Walk into your interview fully prepared",
                step: 4,
                badgeBg: "bg-[#0a2316] border border-emerald-500/30 text-emerald-400 group-hover:bg-[#0f3320] group-hover:border-emerald-400/50",
                hoverText: "group-hover:text-emerald-300",
              }].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 * i, ease: "easeOut" }}
                  className="flex items-center gap-4 py-3.5 group cursor-default"
                >
                  <div className={`relative z-10 w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${item.badgeBg}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-[15.5px] font-semibold text-white transition-colors ${item.hoverText}`}>{item.title}</h4>
                    <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form Column */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative min-h-screen z-10">
        {/* Single rounded dark panel */}
        <div className="w-full max-w-[470px] bg-black rounded-[32px] border border-white/[0.08] shadow-[0_12px_48px_rgba(0,0,0,0.85)] p-8 sm:p-10 space-y-6 relative overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent pointer-events-none" />

          {/* Mobile-only brand identifier */}
          <div 
            onClick={() => navigate("/")} 
            className="lg:hidden flex items-center justify-center gap-2 mb-1 cursor-pointer"
          >
            <img
              src="/images/voke_logo_nav.png"
              alt="Voke Logo"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/voke_logo.png";
              }}
            />
            <span className="font-extrabold text-xl tracking-tight text-white">Voke</span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {authMode === "signin" 
                ? "Welcome Back" 
                : authMode === "signup" 
                ? "Create Account" 
                : authMode === "forgot" 
                ? "Reset Password" 
                : "Set New Password"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              {authMode === "signin"
                ? "Enter your details to access your account"
                : authMode === "signup"
                ? "Start your journey to interview mastery"
                : authMode === "forgot"
                ? "Enter your email to receive a password reset link"
                : "Choose a strong password for your account"}
            </p>
          </div>

          {/* Custom Tabs */}
          {(authMode === "signin" || authMode === "signup") && (
            <div className="bg-white/[0.04] border border-white/[0.08] p-1.5 rounded-full flex relative">
              <motion.div
                className="absolute top-1.5 bottom-1.5 bg-[#0F6B38] rounded-full shadow-md shadow-emerald-950/40 border border-emerald-500/30"
                initial={false}
                animate={{
                  x: authMode === "signin" ? "0%" : "100%",
                  width: "50%"
                }}
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
              />
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-full relative z-10 transition-colors duration-200 cursor-pointer ${
                  authMode === "signin" ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-full relative z-10 transition-colors duration-200 cursor-pointer ${
                  authMode === "signup" ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={authMode + (resetLinkSent ? "-sent" : "")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {authMode === "forgot" && resetLinkSent ? (
                <div className="space-y-4 text-center py-2 bg-white/[0.03] border border-white/10 p-6 rounded-2xl shadow-xl relative">
                  <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Check your email</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      We have sent a password reset link to <span className="text-emerald-400 font-medium">{email}</span>.
                    </p>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleForgotPassword()}
                      disabled={loading}
                      className="w-full h-11 text-sm bg-[#0F6B38] hover:bg-[#0B572D] text-white font-semibold rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                      ) : (
                        "Resend Reset Link"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setResetLinkSent(false);
                        setEmail("");
                        setAuthMode("signin");
                      }}
                      className="w-full text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <form 
                  onSubmit={
                    authMode === "signin" 
                      ? handleSignIn 
                      : authMode === "signup" 
                      ? handleSignUp 
                      : authMode === "forgot" 
                      ? handleForgotPassword 
                      : handleResetPassword
                  } 
                  className="space-y-5"
                >
                  {authMode === "signup" && (
                    <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-3 flex items-start gap-2.5 mb-2">
                      <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-zinc-300 leading-snug">
                        <span className="font-semibold text-emerald-300">College / University Student?</span> Use official campus email to link your institutional drives!
                      </div>
                    </div>
                  )}

                  {authMode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs sm:text-sm font-medium text-zinc-300 block">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-12 text-sm transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {authMode !== "reset" && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-zinc-300 block">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-12 text-sm transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {authMode !== "forgot" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-zinc-300">
                          {authMode === "reset" ? "New Password" : "Password"}
                        </Label>
                        {authMode === "signin" && (
                          <button
                            type="button"
                            onClick={() => setAuthMode("forgot")}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors focus:outline-none cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-11 pr-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-12 text-sm transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4.5 w-4.5" />
                          ) : (
                            <Eye className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {(authMode === "signup" || authMode === "reset") && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-zinc-300 block">
                        {authMode === "reset" ? "Confirm New Password" : "Confirm Password"}
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-11 pr-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-12 text-sm transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer p-1"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4.5 w-4.5" />
                          ) : (
                            <Eye className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#0F6B38] hover:bg-[#0B572D] text-white h-12 rounded-xl font-semibold border border-emerald-500/30 shadow-md shadow-emerald-950/40 hover:shadow-emerald-900/40 transition-all duration-200 cursor-pointer active:scale-[0.99] text-sm sm:text-base !mt-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                    ) : (
                      <>
                        {authMode === "signin" 
                          ? "Sign In" 
                          : authMode === "signup" 
                          ? "Create Account" 
                          : authMode === "forgot" 
                          ? "Send Reset Link" 
                          : "Update Password"}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {authMode === "forgot" && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setAuthMode("signin")}
                        className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  )}
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {(authMode === "signin" || authMode === "signup") && (
            <>
              <div className="relative py-2.5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-black px-3 text-zinc-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 hover:text-white text-zinc-300 font-medium text-sm transition-all cursor-pointer"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGithubSignIn}
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 hover:text-white text-zinc-300 font-medium text-sm transition-all cursor-pointer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>

            </>
          )}
        </div>
      </div>

      <Dialog 
        open={showVerificationDialog} 
        onOpenChange={(open) => {
          setShowVerificationDialog(open);
          if (!open) {
            setEmail("");
            setAuthMode("signin");
          }
        }}
      >
        <DialogContent className="bg-[#0b0d14] border-white/10 text-white sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-400" />
              Verify your email
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2 text-sm leading-relaxed">
              We've sent a verification link to <span className="text-emerald-400 font-medium">{email}</span>.
              <br /><br />
              Please check your inbox (and spam folder) and click the link to verify your account before signing in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto border border-white/10 hover:bg-white/5 hover:text-white text-zinc-300"
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Resend Link
            </Button>
            <Button
              type="button"
              variant="default"
              className="w-full sm:w-auto bg-[#0F6B38] hover:bg-[#0B572D] text-white border border-emerald-500/30"
              onClick={() => {
                setShowVerificationDialog(false);
                setEmail("");
                setAuthMode("signin");
              }}
            >
              I understand, take me to Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;