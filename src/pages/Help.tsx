import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search, HelpCircle, BookOpen, Video, MessageCircle, Mail, Sparkles, Zap, ChevronRight, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Help = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const handleReplayTour = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
            localStorage.removeItem(`voke_tour_seen_${user.id}`);
            localStorage.removeItem(`voke_checklist_dismissed_${user.id}`);
            toast.success("Welcome tour reset! Redirecting to dashboard...");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } else {
            navigate("/auth");
        }
    };

    const categories = [
        {
            title: "Getting Started",
            icon: BookOpen,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            faqs: [
                {
                    question: "How do I create an account?",
                    answer: "Click the 'Sign Up' button in the top right corner, enter your email and create a password. You'll receive a confirmation email to verify your account."
                },
                {
                    question: "What types of interviews can I practice?",
                    answer: "Voke offers multiple interview types including General, Technical, Behavioral, and Role-Specific interviews. You can also practice with AI-powered adaptive interviews and peer mock interviews."
                },
                {
                    question: "Is Voke free to use?",
                    answer: "Voke offers a free tier with basic features. Premium features including unlimited AI interviews, detailed analytics, and personalized career guidance are available with a subscription."
                }
            ]
        },
        {
            title: "Interview Practice",
            icon: Video,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
            faqs: [
                {
                    question: "How does the AI interviewer work?",
                    answer: "Our AI interviewer uses advanced natural language processing to conduct realistic interviews. It asks relevant questions based on your role and experience, and provides real-time feedback."
                },
                {
                    question: "Can I review my past interviews?",
                    answer: "Yes! All your interview sessions are saved in your dashboard. You can review transcripts, watch recordings, and see detailed feedback and scores for each session."
                },
                {
                    question: "How accurate is the AI feedback?",
                    answer: "Our AI is trained on thousands of successful interviews. It provides detailed feedback on communication skills, technical accuracy, and overall performance."
                }
            ]
        },
        {
            title: "Features & Tools",
            icon: HelpCircle,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            faqs: [
                {
                    question: "Can I practice with other users?",
                    answer: "Yes! The Peer Interviews feature allows you to schedule mock interviews with other users. You can take turns being the interviewer and interviewee."
                }
            ]
        },
        {
            title: "Account & Billing",
            icon: MessageCircle,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            faqs: [
                {
                    question: "How do I upgrade to premium?",
                    answer: "Go to your Profile page and click on 'Upgrade to Premium'. Choose your preferred plan and complete the payment process."
                },
                {
                    question: "Can I cancel my subscription?",
                    answer: "Yes, you can cancel your subscription at any time from your Profile settings. Your premium features will remain active until the end of the billing period."
                },
                {
                    question: "How do I update my profile?",
                    answer: "Navigate to your Profile page by clicking the Settings icon in the header. You can update your personal information and resume there."
                }
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
                                Help Center
                            </span>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-6 max-w-3xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/30 border border-border/50 text-sm font-medium text-muted-foreground mb-4">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span>Support & Documentation</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                        How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">empower</span> you?
                    </h1>
                    
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Find answers, master the platform, and level up your interview game.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto mt-8 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg flex items-center p-2 focus-within:border-violet-500/50 transition-colors">
                            <Search className="ml-4 h-6 w-6 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                            <Input
                                placeholder="Search for documentation, tutorials, or FAQs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 bg-transparent text-lg h-12 focus-visible:ring-0 placeholder:text-muted-foreground/60"
                            />
                            <Button className="rounded-xl px-6 bg-violet-600 hover:bg-violet-700 text-white">
                                Search
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ Categories Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                    {categories.map((category, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                        >
                            <Card className={`h-full bg-card/40 backdrop-blur-xl border-border/50 hover:border-violet-500/30 transition-all duration-300 group overflow-hidden`}>
                                <CardHeader className="pb-4">
                                     <div className="flex items-center gap-4 mb-2">
                                        <div className={`p-3 rounded-xl ${category.bg} ${category.border} border`}>
                                            <category.icon className={`h-6 w-6 ${category.color}`} />
                                        </div>
                                        <CardTitle className="text-xl font-bold">{category.title}</CardTitle>
                                     </div>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {category.faqs.map((faq, faqIndex) => (
                                            <AccordionItem key={faqIndex} value={`item-${idx}-${faqIndex}`} className="border-border/40">
                                                <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline py-4 data-[state=open]:text-violet-500 transition-colors">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground leading-relaxed pl-1 pb-4">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Onboarding Tour CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-12"
                >
                    <Card className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 backdrop-blur-xl overflow-hidden relative p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="space-y-2 max-w-xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-xs font-bold text-violet-600 dark:text-violet-400">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Guided Tour</span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground">New to the platform or want a refresher?</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Replay our feature guidance walkthrough and onboarding checklist to understand what each tool does and get recommended starting points.
                            </p>
                        </div>
                        <Button
                            onClick={handleReplayTour}
                            className="bg-violet-600 hover:bg-violet-700 text-white shrink-0 shadow-lg shadow-violet-500/20 rounded-2xl h-11 px-6 font-bold"
                        >
                            Start Welcome Tour
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Card>
                </motion.div>

                {/* Contact Support CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border border-white/10 p-8 md:p-12 text-center">
                        <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-[100px] rounded-full" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 mb-2">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Still can't find what you're looking for?</h2>
                            <p className="text-violet-200/80 text-lg">
                                Our support team is always ready to help you navigate your interview journey.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button size="lg" className="bg-white text-black hover:bg-zinc-200 border-0">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Contact Support
                                </Button>
                                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                                    Visit Community
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Help;
