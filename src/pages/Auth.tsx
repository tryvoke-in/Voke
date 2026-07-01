import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAIL, isAdminEmail } from "@/config/admin";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, User, ArrowRight, Sparkles, Github, Loader2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isDisposableEmail } from "@/utils/emailValidation";
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
        // Signup successful – process referral if one was pending
        const newUser = data?.user;
        const storedRef = localStorage.getItem("voke_pending_referral");
        if (newUser && storedRef) {
          // Fire-and-forget – don't block the UI
          supabase.rpc("process_referral", {
            ref_code: storedRef,
            new_user_id: newUser.id
          }).then(({ error }) => {
            if (!error) localStorage.removeItem("voke_pending_referral");
          }).catch(console.error);
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
    <div className="min-h-screen w-full flex bg-black text-white overflow-hidden">
      {/* Left Side - Feature Showcase */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[120px] -z-10" />
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] -z-10" />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              className="w-20 h-20 object-contain mb-8 hover:scale-110 transition-transform duration-300"
            />
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Master Your <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Interview Skills
              </span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Join thousands of candidates who are acing their interviews with our AI-powered practice platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                JD
              </div>
              <div>
                <h4 className="font-semibold">John Doe</h4>
                <p className="text-xs text-gray-400">Software Engineer @ Google</p>
              </div>
              <div className="ml-auto flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="w-4 h-4 text-yellow-500 fill-yellow-500">★</div>
                ))}
              </div>
            </div>
            <p className="text-gray-300 italic">
              "Voke changed the game for me. The AI feedback was incredibly accurate and helped me identify weak spots I didn't know I had."
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-black/95">
        <div className="absolute top-6 right-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            Back to Home
          </Button>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              {authMode === "signin" 
                ? "Welcome Back" 
                : authMode === "signup" 
                ? "Create Account" 
                : authMode === "forgot" 
                ? "Reset Password" 
                : "Set New Password"}
            </h2>
            <p className="text-gray-400">
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
            <div className="bg-white/5 p-1 rounded-2xl flex relative">
              <motion.div
                className="absolute top-1 bottom-1 bg-violet-600 rounded-xl shadow-lg"
                initial={false}
                animate={{
                  x: authMode === "signin" ? 0 : "100%",
                  width: "50%"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-3 text-sm font-medium rounded-xl relative z-10 transition-colors duration-200 ${authMode === "signin" ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-3 text-sm font-medium rounded-xl relative z-10 transition-colors duration-200 ${authMode === "signup" ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={authMode + (resetLinkSent ? "-sent" : "")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {authMode === "forgot" && resetLinkSent ? (
                <div className="space-y-6 text-center py-4 bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl relative">
                  <div className="mx-auto w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center text-violet-400">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Check your email</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      We have sent a password reset link to <span className="text-violet-400 font-medium">{email}</span>.
                    </p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => handleForgotPassword()}
                      disabled={loading}
                      className="w-full h-12 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl transition-all"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-black" />
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
                      className="w-full text-gray-400 hover:text-white"
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
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-violet-500 transition-colors" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl h-12 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {authMode !== "reset" && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-violet-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl h-12 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {authMode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-gray-300">
                        {authMode === "reset" ? "New Password" : "Password"}
                      </Label>
                      {authMode === "signin" && (
                        <button
                          type="button"
                          onClick={() => setAuthMode("forgot")}
                          className="text-xs text-violet-400 hover:text-violet-300 focus:outline-none"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-violet-500 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl h-12 transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(authMode === "signup" || authMode === "reset") && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">
                      {authMode === "reset" ? "Confirm New Password" : "Confirm Password"}
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-violet-500 transition-colors" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl h-12 transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white h-12 rounded-xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {authMode === "signin" 
                        ? "Sign In" 
                        : authMode === "signup" 
                        ? "Create Account" 
                        : authMode === "forgot" 
                        ? "Send Reset Link" 
                        : "Update Password"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {authMode === "forgot" && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-sm text-gray-400 hover:text-white transition-colors focus:outline-none"
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
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-gray-300"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
                  variant="outline"
                  className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-gray-300"
                  disabled
                >
                  <Github className="mr-2 h-5 w-5" />
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
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-violet-500" />
              Verify your email
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2 text-sm leading-relaxed">
              We've sent a verification link to <span className="text-violet-400 font-medium">{email}</span>.
              <br /><br />
              Please check your inbox (and spam folder) and click the link to verify your account before signing in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto border border-white/10 hover:bg-white/5 hover:text-white text-gray-300"
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Resend Link
            </Button>
            <Button
              type="button"
              variant="default"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
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