import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, FileText, Mail, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Privacy = () => {
    const navigate = useNavigate();

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const sections = [
        {
            title: "Information We Collect",
            icon: Database,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            content: [
                "Account information (name, email, password)",
                "Profile data (resume, skills, experience)",
                "Interview session data (recordings, transcripts, feedback)",
                "Usage data (features used, time spent, interactions)",
                "Device and browser information",
                "Cookies and similar tracking technologies"
            ]
        },
        {
            title: "How We Use Your Information",
            icon: UserCheck,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            content: [
                "Provide and improve our interview practice services",
                "Generate personalized feedback and recommendations",
                "Analyze your performance and track progress",
                "Send important updates and notifications",
                "Conduct research to enhance our AI models",
                "Ensure platform security and prevent fraud"
            ]
        },
        {
            title: "Data Security",
            icon: Lock,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            content: [
                "Industry-standard encryption for data in transit and at rest",
                "Regular security audits and penetration testing",
                "Secure cloud infrastructure with redundancy",
                "Access controls and authentication measures",
                "Employee training on data protection",
                "Incident response and breach notification procedures"
            ]
        },
        {
            title: "Your Privacy Rights",
            icon: Shield,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            content: [
                "Access your personal data at any time",
                "Request correction of inaccurate information",
                "Delete your account and associated data",
                "Export your data in a portable format",
                "Opt-out of marketing communications",
                "Object to certain data processing activities"
            ]
        },
        {
            title: "Data Sharing",
            icon: Eye,
            color: "text-fuchsia-500",
            bg: "bg-fuchsia-500/10",
            content: [
                "We do not sell your personal information to third parties",
                "Share data with service providers under strict agreements",
                "May disclose information to comply with legal obligations",
                "Aggregate, anonymized data may be used for research",
                "Peer interview data is only shared with matched participants",
                "You control what information is visible in your profile"
            ]
        },
        {
            title: "Data Retention",
            icon: FileText,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            content: [
                "Account data retained while your account is active",
                "Interview recordings kept for 2 years or until deletion",
                "Analytics data aggregated and anonymized after 1 year",
                "Deleted accounts purged within 30 days",
                "Legal compliance may require longer retention",
                "You can request early deletion of specific data"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-violet-500/30 overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-violet-600/5 rounded-full blur-[120px] mix-blend-screen dark:mix-blend-screen mix-blend-multiply" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-fuchsia-600/5 rounded-full blur-[120px] mix-blend-screen dark:mix-blend-screen mix-blend-multiply" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-secondary/50">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogoClick}>
                             <div className="relative">
                                <div className="absolute inset-0 bg-violet-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img
                                    src="/images/voke_logo.png"
                                    alt="Voke Logo"
                                    className="w-9 h-9 object-contain relative z-10"
                                />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                                Privacy Policy
                            </span>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-6 max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/30 border border-border/50 text-sm font-medium text-muted-foreground mb-4">
                        <Shield className="w-4 h-4 text-violet-500" />
                        <span>Trust & Security</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        We value your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">privacy</span>
                    </h1>
                    
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Transparent, secure, and focused on protecting your data while you focus on your career.
                    </p>
                    
                    <div className="inline-block px-4 py-1.5 rounded-lg bg-secondary/20 border border-border/30 text-sm text-muted-foreground">
                        Last updated: November 22, 2024
                    </div>
                </motion.div>

                {/* Privacy Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                        >
                            <Card className="h-full bg-card/40 backdrop-blur-xl border-border/50 hover:border-violet-500/20 transition-all duration-300">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${section.bg} border border-white/5`}>
                                            <section.icon className={`h-6 w-6 ${section.color}`} />
                                        </div>
                                        <CardTitle className="text-xl font-bold">{section.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {section.content.map((item, itemIndex) => (
                                            <li key={itemIndex} className="flex items-start gap-3 text-muted-foreground">
                                                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${section.bg.replace('/10', '')}`} />
                                                <span className="leading-relaxed text-sm">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border border-white/10 p-8 text-center">
                        <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
                        
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-2xl font-bold text-white">Questions about your data?</h2>
                            <p className="text-violet-200/80">
                                If you have any questions about this Privacy Policy or how we handle your data, please don't hesitate to reach out.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button className="bg-white text-black hover:bg-zinc-200 border-0" onClick={() => window.location.href = 'mailto:privacy@voke.com'}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email Privacy Team
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                                    Privacy Settings
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
                        This policy may be updated periodically. Your continued use of Voke constitutes acceptance of any modifications.
                    </p>
                </motion.div>
            </main>
        </div>
    );
};

export default Privacy;
