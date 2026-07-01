
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
    TrendingUp, Award, Layers, AlertCircle, Code2
} from "lucide-react";
import { motion } from "framer-motion";

const PERIODS = ["Thirty Days", "Three Months", "Six Months", "More Than Six Months"];

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

const CompanyDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("Thirty Days");

    // Helper to get logo with fallbacks
    const getCompanyLogoUrl = (companyName: string) => {
        // 1. Static map for major companies
        const logo = COMPANY_LOGOS[companyName.toLowerCase()];
        if (logo) {
            return logo;
        }

        // 2. Google Favicon API (highly reliable, no DNS blocks)
        // Clean name: remove special chars, spaces, lowercase
        const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`;
    };

    useEffect(() => {
        if (slug) fetchCompany();
    }, [slug]);

    useEffect(() => {
        if (company) fetchQuestions();
    }, [company, selectedPeriod]);

    const fetchCompany = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            setCompany(data);
        } catch (error) {
            console.error("Error fetching company:", error);
            // set error or redirect
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestions = async () => {
        setLoadingQuestions(true);
        try {
            // Mapping period names if necessary, assuming exact match from seed
            const { data, error } = await supabase
                .from('company_questions')
                .select('*')
                .eq('company_id', company.id)
                .eq('period', selectedPeriod)
                .order('frequency', { ascending: false });

            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topics?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getDifficultyColor = (diff: string) => {
        switch (diff.toUpperCase()) {
            case 'EASY': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'HARD': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Company not found</p>
                <Button onClick={() => navigate('/companies')}>Back to Companies</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate('/companies')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
                                <img
                                    src={getCompanyLogoUrl(company.name)}
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        // Final fallback to UI Avatars
                                        const target = e.currentTarget;
                                        // Prevent infinite loop if fallback also fails
                                        if (target.src.includes('ui-avatars.com')) return;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&color=fff&size=64`;
                                    }}
                                    alt={`${company.name} logo`}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Layers className="h-4 w-4" />
                                    Top Interview Questions
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions or topics..."
                            className="pl-9 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
                        {PERIODS.map(period => (
                            <TabsTrigger key={period} value={period} className="px-4 py-2">
                                {period}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedPeriod} className="mt-0 space-y-4">
                        {loadingQuestions ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center bg-muted/20">
                                <Calendar className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                <h3 className="text-lg font-medium">No questions found</h3>
                                <p className="text-muted-foreground">Try adjusting your search or timeframe.</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredQuestions.map((q, i) => (
                                    <motion.div
                                        key={q.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Card className="hover:border-primary/50 transition-colors">
                                            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-lg">{q.title}</h3>
                                                        <Badge variant="outline" className={`${getDifficultyColor(q.difficulty)} border`}>
                                                            {q.difficulty}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-x-4 gap-y-2 text-sm text-muted-foreground flex-wrap">
                                                        {q.acceptance_rate > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Award className="h-3 w-3" />
                                                                {Math.round(q.acceptance_rate * 100)}% Acceptance
                                                            </span>
                                                        )}
                                                        {q.frequency > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <TrendingUp className="h-3 w-3" />
                                                                {q.frequency.toFixed(1)}% Frequency
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        {q.topics.slice(0, 5).map((topic: string) => (
                                                            <Badge key={topic} variant="secondary" className="text-xs bg-muted text-muted-foreground hover:bg-muted/80">
                                                                {topic}
                                                            </Badge>
                                                        ))}
                                                        {q.topics.length > 5 && (
                                                            <span className="text-xs text-muted-foreground self-center">+{q.topics.length - 5} more</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {q.url && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => navigate(`/playground?title=${encodeURIComponent(q.title)}&company=${encodeURIComponent(company.name)}`)}
                                                        >
                                                            Solve <Code2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default CompanyDetail;
