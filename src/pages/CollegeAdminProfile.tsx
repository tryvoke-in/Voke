import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Mail, User, Phone, MapPin, Globe, ArrowLeft, LogOut, Upload, CheckCircle2 } from "lucide-react";
import { collegeService, College } from "@/services/collegeService";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const CollegeAdminProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [college, setCollege] = useState<College | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [domains, setDomains] = useState("");
  const [location, setLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const session = collegeService.getCollegeSession();
    if (!session) {
      navigate("/college/auth");
      return;
    }
    setCollege(session);
    setName(session.name);
    setAdminName(session.adminName);
    setAdminEmail(session.adminEmail);
    setDomains(session.domains.join(", "));
    setLocation(session.location || "");
    setContactPhone(session.contactPhone || "");
    setLogoUrl(session.logoUrl || "");
    setIsLoading(false);
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college) return;
    
    setIsSaving(true);
    
    try {
      const cleanDomains = domains
        .split(",")
        .map(d => d.trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean);

      const updates: Partial<College> = {
        name,
        adminName,
        adminEmail,
        domains: cleanDomains,
        location,
        contactPhone,
        logoUrl
      };

      await collegeService.updateCollegeAsync(college.id, updates);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    collegeService.clearCollegeSession();
    toast.success("Signed out successfully");
    navigate("/college/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E9] dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#BDB8AD] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E9] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#CCC7BC]/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#EDE9E1]/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-[#CCC7BC] dark:border-zinc-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/college/dashboard")}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-[#D8D3C9] dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <h1 className="text-lg font-bold tracking-tight">Admin Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-[#E3DFD6] dark:hover:bg-zinc-800 text-xs h-9"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        
        <Card className="bg-[#EDE9E1] dark:bg-zinc-900 border-[#CCC7BC] dark:border-zinc-800 shadow-lg">
          <CardHeader className="border-b border-[#CCC7BC] dark:border-zinc-800 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="relative group cursor-pointer">
                <Avatar className="w-24 h-24 rounded-2xl border-2 border-[#BDB8AD] dark:border-zinc-700 bg-[#E3DFD6] dark:bg-zinc-800 shadow-sm">
                  <AvatarImage src={logoUrl} className="object-cover" />
                  <AvatarFallback className="bg-[#E3DFD6] dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-2xl uppercase">
                    {name?.slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center md:text-left space-y-1.5">
                <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {name}
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Institutional Admin Account
                </CardDescription>
                <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D8D3C9] dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    Verified Partner
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="profile-form" onSubmit={handleSave} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-[#CCC7BC] dark:border-zinc-800 pb-2">
                  Organization Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Organization Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Authorized Email Domains (comma separated)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        value={domains} 
                        onChange={(e) => setDomains(e.target.value)} 
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                        placeholder="university.edu.in, nst.edu.in"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Students registering with these domains will automatically appear in your roster.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-[#CCC7BC] dark:border-zinc-800 pb-2">
                  Admin Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Admin Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        value={adminName} 
                        onChange={(e) => setAdminName(e.target.value)} 
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        type="email"
                        value={adminEmail} 
                        onChange={(e) => setAdminEmail(e.target.value)} 
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        value={contactPhone} 
                        onChange={(e) => setContactPhone(e.target.value)} 
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Profile Logo URL</Label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <Input 
                        value={logoUrl} 
                        onChange={(e) => setLogoUrl(e.target.value)} 
                        placeholder="https://..."
                        className="pl-9 bg-[#E3DFD6] dark:bg-zinc-800 border-[#CCC7BC] dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </CardContent>
          <CardFooter className="bg-[#D8D3C9]/40 dark:bg-zinc-900/40 border-t border-[#CCC7BC] dark:border-zinc-800 p-6 flex justify-end">
            <Button 
              type="submit" 
              form="profile-form"
              disabled={isSaving}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-[#F5F1E9] dark:text-zinc-900 font-semibold px-6 shadow-md transition-all"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default CollegeAdminProfile;
