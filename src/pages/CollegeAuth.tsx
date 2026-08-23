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
  CheckCircle2, Users, BarChart3, Bot, Key, Mail, Lock, Phone, MapPin
} from "lucide-react";
import { collegeService, DEFAULT_COLLEGES, College } from "@/services/collegeService";
import { toast } from "sonner";
import { motion } from "framer-motion";

const CollegeAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("signin");

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Registration state
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regShortName, setRegShortName] = useState("");
  const [regDomain, setRegDomain] = useState("");
  const [regAdminName, setRegAdminName] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regSlots, setRegSlots] = useState(500);

  useEffect(() => {
    // Check if college session already exists
    const session = collegeService.getCollegeSession();
    if (session) {
      navigate("/college/dashboard");
    }

    const requestedCollegeSlug = searchParams.get("college");
    if (requestedCollegeSlug) {
      const matched = DEFAULT_COLLEGES.find(c => c.slug === requestedCollegeSlug);
      if (matched) {
        setEmail(matched.adminEmail);
      }
    }
  }, [navigate, searchParams]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your college administrator email.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = collegeService.authenticateCollegeAdmin(email, password);
      setIsLoading(false);
      if (res.success && res.college) {
        toast.success(`Welcome back, ${res.college.name} Placement Cell!`);
        navigate("/college/dashboard");
      } else {
        toast.error(res.error || "Authentication failed.");
      }
    }, 400);
  };

  const handleQuickDemoSignIn = (college: College) => {
    collegeService.setCollegeSession(college);
    toast.success(`Logged in as ${college.name} Admin!`);
    navigate("/college/dashboard");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCollegeName.trim() || !regAdminEmail.trim() || !regDomain.trim()) {
      toast.error("Please fill in College Name, Official Email Domain, and Admin Email.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const cleanDomains = regDomain
        .split(",")
        .map(d => d.trim().replace(/^@/, ""))
        .filter(Boolean);

      const newCollege = collegeService.registerCollege({
        name: regCollegeName.trim(),
        shortName: regShortName.trim() || regCollegeName.slice(0, 4).toUpperCase(),
        domains: cleanDomains.length > 0 ? cleanDomains : [`${regCollegeName.toLowerCase().replace(/\s+/g, '')}.edu.in`],
        adminEmail: regAdminEmail.trim(),
        adminName: regAdminName.trim() || "Placement Cell Head",
        location: regLocation.trim() || "Campus Location",
        totalStudentSlots: Number(regSlots) || 500
      });

      setIsLoading(false);
      toast.success(`Institutional partnership registered for ${newCollege.name}! Welcome to Voke.`);
      navigate("/college/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-violet-500/30 flex flex-col justify-center relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Mesh */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-violet-600/25 via-purple-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none -z-10" />

      {/* Top Brand Header */}
      <div className="max-w-4xl mx-auto w-full mb-8 text-center">
        <div 
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-3 cursor-pointer group mb-4"
        >
          <img
            src="/images/voke_logo.png"
            alt="Voke AI Logo"
            className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
            Voke <span className="text-violet-400 font-semibold text-lg">for Universities</span>
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
          Institutional Placement & AI Mock Assessment Portal
        </h1>
        <p className="text-gray-400 text-sm md:text-base mt-2 max-w-xl mx-auto">
          Empower your students with enterprise AI technical interviews, automated placement drives, and real-time candidate readiness analytics.
        </p>
      </div>

      {/* Auth Container */}
      <div className="max-w-xl mx-auto w-full">
        <Card className="bg-[#0c0c14]/90 border-white/10 shadow-2xl backdrop-blur-2xl text-white overflow-hidden relative">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />
          
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 p-1">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white font-medium text-xs md:text-sm py-2"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  College Admin Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-violet-600 data-[state=active]:text-white font-medium text-xs md:text-sm py-2"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  New Partnership
                </TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Sign In to College Admin Dashboard</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Access your student directory, schedule campus mock drives, and view placement readiness reports.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      Official Institutional Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        type="email"
                        placeholder="placement@nst.edu.in or tnp@dtu.ac.in"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="bg-white/5 border-white/10 pl-9 text-white placeholder:text-gray-600 text-sm focus:border-violet-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      Partner Security Key / Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 pl-9 text-white placeholder:text-gray-600 text-sm focus:border-violet-500"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Demo mode enabled: Password optional for verified partner accounts.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-5 shadow-lg shadow-violet-600/30 transition-all text-sm"
                  >
                    {isLoading ? "Authenticating College Admin..." : "Access College Admin Dashboard"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                {/* 1-Click Quick Demo Sign-Ins */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Instant Partner Demo Access:
                    </span>
                    <span className="text-[11px] text-gray-500">1-click test</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_COLLEGES.map(college => (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => handleQuickDemoSignIn(college)}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-violet-950/40 hover:border-violet-500/50 transition-all text-left group"
                      >
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white group-hover:text-violet-300 truncate">
                            {college.shortName}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {college.name}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Onboard Your University / Institution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Register your institution's email domain to auto-map students and unlock bulk mock assessment drives.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        College / University Name
                      </Label>
                      <Input
                        placeholder="e.g. Newton School of Technology"
                        value={regCollegeName}
                        onChange={e => setRegCollegeName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Short Code
                      </Label>
                      <Input
                        placeholder="e.g. NST"
                        value={regShortName}
                        onChange={e => setRegShortName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                      Official Student Email Domain(s)
                    </Label>
                    <Input
                      placeholder="e.g. nst.edu.in, university.ac.in (comma separated)"
                      value={regDomain}
                      onChange={e => setRegDomain(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-sm"
                      required
                    />
                    <p className="text-[11px] text-gray-500">
                      Students registering with these domains will automatically appear in your roster.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Placement Head / Admin Name
                      </Label>
                      <Input
                        placeholder="Prof. / Dr. Name"
                        value={regAdminName}
                        onChange={e => setRegAdminName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Admin Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="placement@university.edu"
                        value={regAdminEmail}
                        onChange={e => setRegAdminEmail(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Campus Location
                      </Label>
                      <Input
                        placeholder="City, State"
                        value={regLocation}
                        onChange={e => setRegLocation(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Student Scale
                      </Label>
                      <Input
                        type="number"
                        min="50"
                        value={regSlots}
                        onChange={e => setRegSlots(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-5 shadow-lg shadow-violet-600/30 text-sm mt-2"
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
          <p className="text-sm text-gray-400">
            Are you a student preparing for interviews?{" "}
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4"
            >
              Sign In to Student Account →
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Need institutional API access or customized campus licensing? Contact us at{" "}
            <a href="mailto:partnerships@tryvoke.in" className="text-gray-400 underline">
              partnerships@tryvoke.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegeAuth;
