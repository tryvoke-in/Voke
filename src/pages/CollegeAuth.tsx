import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, GraduationCap, Sparkles, ShieldCheck, ArrowRight,
  CheckCircle2, Users, BarChart3, Bot, Key, Mail, Lock, Phone, MapPin,
  Eye, EyeOff, ShieldAlert
} from "lucide-react";
import { collegeService, College } from "@/services/collegeService";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const CollegeAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("signin");

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration state
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regShortName, setRegShortName] = useState("");
  const [regDomain, setRegDomain] = useState("");
  const [regAdminName, setRegAdminName] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regLocation, setRegLocation] = useState("");
  const [regSlots, setRegSlots] = useState(500);

  useEffect(() => {
    const requestedMode = searchParams.get("mode") || searchParams.get("tab");
    if (requestedMode === "register" || requestedMode === "new") {
      setActiveTab("register");
      return;
    }

    const requestedCollegeParam = searchParams.get("college") || searchParams.get("id");
    if (requestedCollegeParam) {
      collegeService.getCollegesAsync().then(list => {
        const matched = list.find(c => 
          c.slug === requestedCollegeParam || 
          c.id === requestedCollegeParam || 
          c.shortName?.toLowerCase() === requestedCollegeParam.toLowerCase()
        );
        if (matched) {
          setEmail(matched.adminEmail);
          const currentSession = collegeService.getCollegeSession();
          if (currentSession && currentSession.id === matched.id) {
            navigate(`/college/dashboard?college=${matched.id}`);
          }
        }
      });
      return;
    }

    // Only redirect to dashboard if no specific college was requested and an active session exists
    const session = collegeService.getCollegeSession();
    if (session) {
      navigate(`/college/dashboard?college=${session.id}`);
    }
  }, [navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your college administrator email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await collegeService.authenticateCollegeAdminAsync(email, password);
      if (res.success && res.college) {
        toast.success(`Welcome back, ${res.college.name} Placement Cell!`);
        navigate("/college/dashboard");
      } else {
        toast.error(res.error || "Authentication failed. Please verify your credentials.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSignIn = (college: College) => {
    collegeService.setCollegeSession(college);
    toast.success(`Logged in as ${college.name} Admin!`);
    navigate("/college/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCollegeName.trim() || !regAdminEmail.trim() || !regDomain.trim()) {
      toast.error("Please fill in College Name, Official Email Domain, and Admin Email.");
      return;
    }

    if (!regPassword || regPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long for security.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match. Please re-enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanDomains = regDomain
        .split(",")
        .map(d => d.trim().replace(/^@/, ""))
        .filter(Boolean);

      const newCollege = await collegeService.registerCollegeAsync({
        name: regCollegeName.trim(),
        shortName: regShortName.trim() || regCollegeName.slice(0, 4).toUpperCase(),
        domains: cleanDomains.length > 0 ? cleanDomains : [`${regCollegeName.toLowerCase().replace(/\s+/g, '')}.edu.in`],
        adminEmail: regAdminEmail.trim(),
        adminName: regAdminName.trim() || "Placement Cell Head",
        password: regPassword.trim(),
        location: regLocation.trim() || "Campus Location",
        totalStudentSlots: Number(regSlots) || 500
      });

      toast.success(`Institutional partnership registered for ${newCollege.name}! Welcome to Voke.`);
      navigate("/college/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to register institution.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 flex flex-col justify-center relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Mesh */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 via-blue-600/5 to-transparent dark:from-blue-600/25 dark:via-blue-600/15 rounded-full blur-[140px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/8 via-blue-600/5 to-transparent dark:from-indigo-600/20 dark:via-blue-600/10 rounded-full blur-[150px] pointer-events-none transform-gpu" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:48px_48px] pointer-events-none -z-10" />

      {/* Top Brand Header */}
      <div className="max-w-4xl mx-auto w-full mb-8 text-center relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <div
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-3 cursor-pointer group mb-4"
        >
          <img
            src="/images/voke_logo.png"
            alt="Voke AI Logo"
            className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-500 dark:from-white dark:via-white dark:to-gray-400">
            Voke <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">for Universities</span>
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto">
          Institutional Placement & AI Mock Assessment Portal
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-xl mx-auto">
          Empower your students with enterprise AI technical interviews, automated placement drives, and real-time candidate readiness analytics.
        </p>
      </div>

      {/* Auth Container */}
      <div className="max-w-xl mx-auto w-full">
        <Card className="bg-card/95 border-border shadow-2xl backdrop-blur-2xl overflow-hidden relative">
          <div className="h-1 bg-blue-500" />

          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 bg-muted/50 dark:bg-muted/30 border border-border p-1 rounded-full h-auto">
                <TabsTrigger
                  value="signin"
                  className="relative rounded-full data-[state=active]:text-white font-medium text-xs md:text-sm py-2 cursor-pointer"
                >
                  {activeTab === "signin" && (
                    <motion.div
                      layoutId="active-auth-tab"
                      className="absolute inset-0 bg-blue-600 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    College Admin Login
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="relative rounded-full data-[state=active]:text-white font-medium text-xs md:text-sm py-2 cursor-pointer"
                >
                  {activeTab === "register" && (
                    <motion.div
                      layoutId="active-auth-tab"
                      className="absolute inset-0 bg-blue-600 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    New Partnership
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Sign In to College Admin Dashboard</h3>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Official Institutional Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-9 text-sm focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Administrator Password
                      </Label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-9 pr-10 text-sm focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-5 shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30 transition-all text-sm cursor-pointer"
                  >
                    {isLoading ? "Authenticating College Admin..." : "Access College Admin Dashboard"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>New university / institution?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Register <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Onboard Your University / Institution</h3>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        College / University Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Newton School of Technology"
                        value={regCollegeName}
                        onChange={e => setRegCollegeName(e.target.value)}
                        className="text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Short Code
                      </Label>
                      <Input
                        placeholder="e.g. NST"
                        value={regShortName}
                        onChange={e => setRegShortName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Official Student Email Domain(s) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="nst.edu.in (without @)"
                      value={regDomain}
                      onChange={e => setRegDomain(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Placement Head / Admin Name
                      </Label>
                      <Input
                        placeholder="Enter your name"
                        value={regAdminName}
                        onChange={e => setRegAdminName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Admin Login Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="admin@nst.edu.in"
                        value={regAdminEmail}
                        onChange={e => setRegAdminEmail(e.target.value)}
                        className="text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Admin Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          type={showRegPassword ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="pl-9 pr-10 text-sm"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
                          tabIndex={-1}
                        >
                          {showRegPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          type={showRegConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          className="pl-9 pr-10 text-sm"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
                          tabIndex={-1}
                        >
                          {showRegConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Campus Location
                      </Label>
                      <Input
                        placeholder="City, State"
                        value={regLocation}
                        onChange={e => setRegLocation(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Student Scale
                      </Label>
                      <Input
                        type="number"
                        min="50"
                        value={regSlots}
                        onChange={e => setRegSlots(Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-5 shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30 text-sm mt-2 cursor-pointer"
                  >
                    {isLoading ? "Registering Institution..." : "Register & Launch College Portal"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Footer Navigation */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Are you a student preparing for interviews?{" "}
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Sign In to Student Account →
            </button>
          </p>
          <p className="text-xs text-muted-foreground/70">
            Need institutional API access or customized campus licensing? Contact us at{" "}
            <a href="mailto:partnerships@tryvoke.in" className="text-muted-foreground underline">
              partnerships@tryvoke.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegeAuth;

