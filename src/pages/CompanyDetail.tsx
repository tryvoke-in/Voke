import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Search, ArrowLeft, ExternalLink, Loader2, Calendar,
    TrendingUp, Award, Layers, AlertCircle, Code2, CheckCircle2, Sparkles, BookOpen
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import {
    getStaticCompany,
    getStaticCompanyQuestions,
    StaticCompanyItem,
    StaticCompanyQuestion
} from "@/data/staticCompanyData";

const PERIODS = ["All", "Thirty Days", "Three Months", "Six Months", "More Than Six Months"];

const COMPANY_LOGOS: Record<string, string> = {
    "google": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    "meta": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png",
    "facebook": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png",
    "amazon": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
    "apple": "https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg",
    "netflix": "https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg",
    "microsoft": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    "uber": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
    "airbnb": "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg",
    "linkedin": "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    "twitter": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
    "x": "https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg",
    "tesla": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png",
    "spacex": "https://upload.wikimedia.org/wikipedia/commons/2/2e/SpaceX_logo_black.svg",
    "spotify": "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
    "adobe": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Old_Adobe_logo.svg",
    "salesforce": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
    "oracle": "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
    "ibm": "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    "intel": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg",
    "nvidia": "https://upload.wikimedia.org/wikipedia/commons/a/a4/NVIDIA_logo.svg",
    "amd": "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg",
    "cisco": "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
    "paypal": "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    "square": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Square_Inc_logo.svg",
    "stripe": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    "zoom": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
    "slack": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
    "tiktok": "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg",
    "bytedance": "https://upload.wikimedia.org/wikipedia/commons/0/07/ByteDance_Logo.png",
    "snapchat": "https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg",
    "pinterest": "https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png",
    "reddit": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg",
    "dropbox": "https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg",
    "gitlab": "https://upload.wikimedia.org/wikipedia/commons/e/e1/GitLab_logo.svg",
    "github": "https://upload.wikimedia.org/wikipedia/commons/4/4a/GitHub_Mark.png",
    "atlassian": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Atlassian_logo.svg",
    "jira": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg",
    "trello": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Trello-logo-blue.svg",
    "asana": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Asana_logo.svg",
    "notion": "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    "deutsche bank": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Deutsche_Bank_logo_without_wordmark.svg",
    "uber eats": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Uber_Eats_2018_Logo_Suite_stacked.png",
};

function formatSlugToName(slug: string): string {
    if (!slug) return "";
    const lower = slug.toLowerCase();
    if (lower === "amd") return "AMD";
    if (lower === "ibm") return "IBM";
    if (lower === "github") return "GitHub";
    if (lower === "gitlab") return "GitLab";
    if (lower === "twitter") return "Twitter (X)";
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

const CompanyDetail = () => {
    const { slug = "" } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // 1. Instant Static Resolution for SSR & zero-latency initial render
    const staticComp = getStaticCompany(slug);
    const initialCompany = staticComp || {
        id: slug,
        name: formatSlugToName(slug),
        slug: slug,
        totalQuestions: 0,
        periods: ["All"],
        questionsByPeriod: {}
    };

    // Determine default non-empty period tab
    const getBestInitialPeriod = () => {
        if (staticComp) {
            if (staticComp.questionsByPeriod["Thirty Days"]?.length) return "Thirty Days";
            if (staticComp.questionsByPeriod["All"]?.length) return "All";
            if (staticComp.periods.length > 0) return staticComp.periods[0];
        }
        return "All";
    };

    const [company, setCompany] = useState<any>(initialCompany);
    const [selectedPeriod, setSelectedPeriod] = useState<string>(getBestInitialPeriod);
    const [questions, setQuestions] = useState<any[]>(() => getStaticCompanyQuestions(slug, getBestInitialPeriod()));
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Helper to get logo with fallbacks
    const getCompanyLogoUrl = (companyName: string) => {
        const logo = COMPANY_LOGOS[companyName.toLowerCase()];
        if (logo) return logo;
        const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`;
    };

    // Background refresh from Supabase (graceful progressive enhancement)
    useEffect(() => {
        if (!slug) return;
        let isMounted = true;

        const syncWithDb = async () => {
            try {
                const { data: compData, error: compErr } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (!compErr && compData && isMounted) {
                    setCompany((prev: any) => ({ ...prev, ...compData }));

                    const { data: qData, error: qErr } = await supabase
                        .from('company_questions')
                        .select('*')
                        .eq('company_id', compData.id)
                        .eq('period', selectedPeriod)
                        .order('frequency', { ascending: false });

                    if (!qErr && qData && qData.length > 0 && isMounted) {
                        setQuestions(qData);
                    }
                }
            } catch (err) {
                // Keep static dataset on any network/database errors
            }
        };

        syncWithDb();

        return () => {
            isMounted = false;
        };
    }, [slug, selectedPeriod]);

    // Handle tab change
    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        const staticList = getStaticCompanyQuestions(slug, newPeriod);
        if (staticList.length > 0) {
            setQuestions(staticList);
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topics?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getDifficultyColor = (diff: string) => {
        switch (diff?.toUpperCase()) {
            case 'EASY': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'HARD': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const companyName = company?.name || formatSlugToName(slug) || "Tech Company";

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <SEO
                title={`${companyName} Interview Questions & AI Practice | Voke`}
                description={`Practice real ${companyName} technical and behavioral interview questions. Filter questions by frequency, difficulty, and topics with instant AI evaluation on Voke.`}
                canonicalPath={`/companies/${slug}`}
            />
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-5xl flex-1">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate('/companies')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to All Companies
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-sm border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                    src={getCompanyLogoUrl(companyName)}
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        if (target.src.includes('ui-avatars.com')) return;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random&color=fff&size=64`;
                                    }}
                                    alt={`${companyName} logo`}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">{companyName} Interview Questions</h1>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
                                    <Layers className="h-4 w-4 text-primary" />
                                    Curated technical problems, DSA questions & coding interview rounds
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                className="bg-primary text-primary-foreground font-medium shadow-md hover:bg-primary/90 gap-2"
                                onClick={() => navigate(`/voice-assistant?company=${encodeURIComponent(companyName)}`)}
                            >
                                <Sparkles className="h-4 w-4" /> Start AI Mock Interview
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Company Highlights Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-card/50 border-border/50 p-4">
                        <p className="text-xs text-muted-foreground">Target Role</p>
                        <p className="text-base font-semibold mt-1">Software Engineer (SDE I / II)</p>
                    </Card>
                    <Card className="bg-card/50 border-border/50 p-4">
                        <p className="text-xs text-muted-foreground">Problem Count</p>
                        <p className="text-base font-semibold mt-1">{questions.length > 0 ? `${questions.length}+ Verified` : "Top Curated"}</p>
                    </Card>
                    <Card className="bg-card/50 border-border/50 p-4">
                        <p className="text-xs text-muted-foreground">Assessment Type</p>
                        <p className="text-base font-semibold mt-1">DSA & System Design</p>
                    </Card>
                    <Card className="bg-card/50 border-border/50 p-4">
                        <p className="text-xs text-muted-foreground">Preparation Mode</p>
                        <p className="text-base font-semibold mt-1 text-primary">Live AI Interactive</p>
                    </Card>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${companyName} questions or topics...`}
                            className="pl-9 h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={selectedPeriod} onValueChange={handlePeriodChange} className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 h-auto flex-wrap border border-border/40">
                        {PERIODS.map(period => (
                            <TabsTrigger key={period} value={period} className="px-4 py-2 text-xs md:text-sm">
                                {period}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedPeriod} className="mt-0 space-y-4">
                        {filteredQuestions.length === 0 ? (
                            <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center bg-muted/20">
                                <Calendar className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                <h3 className="text-lg font-medium">No specific questions found for "{selectedPeriod}"</h3>
                                <p className="text-muted-foreground text-sm mt-1">Explore other timeframe tabs above to view all frequent problems.</p>
                                <Button variant="outline" className="mt-4" onClick={() => handlePeriodChange("All")}>
                                    View All {companyName} Questions
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredQuestions.map((q, i) => (
                                    <div
                                        key={q.id || `${slug}-${i}`}
                                        className="transition-all duration-200"
                                    >
                                        <Card className="hover:border-primary/50 transition-colors border-border/60 bg-card/80">
                                            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-base md:text-lg">{q.title}</h3>
                                                        <Badge variant="outline" className={`${getDifficultyColor(q.difficulty)} border text-xs`}>
                                                            {q.difficulty}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-x-4 gap-y-2 text-xs md:text-sm text-muted-foreground flex-wrap">
                                                        {q.acceptance_rate > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Award className="h-3.5 w-3.5 text-primary" />
                                                                {Math.round(q.acceptance_rate <= 1 ? q.acceptance_rate * 100 : q.acceptance_rate)}% Acceptance
                                                            </span>
                                                        )}
                                                        {q.frequency > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                                {q.frequency.toFixed(0)}% Frequency
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {q.topics?.slice(0, 5).map((topic: string) => (
                                                            <Badge key={topic} variant="secondary" className="text-[11px] bg-muted text-muted-foreground">
                                                                {topic}
                                                            </Badge>
                                                        ))}
                                                        {q.topics?.length > 5 && (
                                                            <span className="text-xs text-muted-foreground self-center">+{q.topics.length - 5} more</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                                                        onClick={() => navigate(`/playground?title=${encodeURIComponent(q.title)}&company=${encodeURIComponent(companyName)}&mode=problem`)}
                                                    >
                                                        Solve <Code2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* FAQ & Preparation Guide Section for SEO */}
                <section className="mt-16 pt-8 border-t border-border/50">
                    <h2 className="text-2xl font-bold mb-4">How to Prepare for {companyName} Technical Interviews</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Card className="p-6 bg-card/40 border-border/40">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> 1. Master High Frequency DSA
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Review the top questions asked in {companyName} coding rounds over the past 3-6 months. Focus on core patterns including Arrays, Hash Tables, Trees, Dynamic Programming, and Graph Traversals.
                            </p>
                        </Card>

                        <Card className="p-6 bg-card/40 border-border/40">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-primary" /> 2. Practice with AI Voice Mock Interviews
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Simulate real pressure by practicing voice and video interview loops on Voke with AI calibrated specifically for {companyName} engineering standards and behavioral rubrics.
                            </p>
                        </Card>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default CompanyDetail;
