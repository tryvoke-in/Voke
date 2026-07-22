import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Target, Award, Calendar, Brain } from "lucide-react";
import { motion } from "motion/react";

interface InterviewAnalyticsProps {
    userId: string;
}

const InterviewAnalytics = ({ userId }: InterviewAnalyticsProps) => {
    const [loading, setLoading] = useState(true);
    const [scoreTrends, setScoreTrends] = useState<any[]>([]);
    const [performanceByType, setPerformanceByType] = useState<any[]>([]);
    const [sixQEvolution, setSixQEvolution] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalInterviews: 0,
        avgScore: 0,
        improvementRate: 0,
        bestScore: 0,
    });

    useEffect(() => {
        loadAnalytics();
    }, [userId]);

    const loadAnalytics = async () => {
        try {
            // Fetch all interview sessions
            const { data: textSessions } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("user_id", userId)
                .not("overall_score", "is", null)
                .order("created_at");

            const { data: videoSessions } = await supabase
                .from("video_interview_sessions")
                .select("*")
                .eq("user_id", userId)
                .not("overall_score", "is", null)
                .order("created_at");

            const allSessions = [
                ...(textSessions || []).map(s => ({ ...s, type: "text" })),
                ...(videoSessions || []).map(s => ({ ...s, type: "video" }))
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // Calculate score trends
            const trends = allSessions.map((session, index) => ({
                interview: index + 1,
                score: session.overall_score,
                date: new Date(session.created_at).toLocaleDateString(),
                type: session.type
            }));

            setScoreTrends(trends);

            // Calculate performance by type
            const typePerformance = [
                {
                    type: "Voice",
                    avgScore: textSessions?.filter(s => s.interview_mode === "voice").reduce((acc, s) => acc + s.overall_score, 0) / (textSessions?.filter(s => s.interview_mode === "voice").length || 1) || 0,
                    count: textSessions?.filter(s => s.interview_mode === "voice").length || 0
                },
                {
                    type: "Video",
                    avgScore: videoSessions?.reduce((acc, s) => acc + s.overall_score, 0) / (videoSessions?.length || 1) || 0,
                    count: videoSessions?.length || 0
                },
                {
                    type: "Text",
                    avgScore: textSessions?.filter(s => !s.interview_mode || s.interview_mode !== "voice").reduce((acc, s) => acc + s.overall_score, 0) / (textSessions?.filter(s => !s.interview_mode || s.interview_mode !== "voice").length || 1) || 0,
                    count: textSessions?.filter(s => !s.interview_mode || s.interview_mode !== "voice").length || 0
                }
            ];

            setPerformanceByType(typePerformance);

            // Calculate 6Q evolution (first vs latest)
            const sessionsWithSixQ = allSessions.filter(s => s.six_q_score);
            if (sessionsWithSixQ.length > 0) {
                const firstSixQ = sessionsWithSixQ[0].six_q_score;
                const latestSixQ = sessionsWithSixQ[sessionsWithSixQ.length - 1].six_q_score;

                const evolution = [
                    { trait: "IQ", first: firstSixQ.iq, latest: latestSixQ.iq, fullMark: 100 },
                    { trait: "EQ", first: firstSixQ.eq, latest: latestSixQ.eq, fullMark: 100 },
                    { trait: "CQ", first: firstSixQ.cq, latest: latestSixQ.cq, fullMark: 100 },
                    { trait: "AQ", first: firstSixQ.aq, latest: latestSixQ.aq, fullMark: 100 },
                    { trait: "SQ", first: firstSixQ.sq, latest: latestSixQ.sq, fullMark: 100 },
                    { trait: "MQ", first: firstSixQ.mq, latest: latestSixQ.mq, fullMark: 100 },
                ];

                setSixQEvolution(evolution);
            }

            // Calculate stats
            const totalInterviews = allSessions.length;
            const avgScore = allSessions.reduce((acc, s) => acc + s.overall_score, 0) / (totalInterviews || 1);
            const bestScore = Math.max(...allSessions.map(s => s.overall_score), 0);
            const improvementRate = allSessions.length > 1
                ? ((allSessions[allSessions.length - 1].overall_score - allSessions[0].overall_score) / allSessions[0].overall_score) * 100
                : 0;

            setStats({
                totalInterviews,
                avgScore: Math.round(avgScore),
                improvementRate: Math.round(improvementRate),
                bestScore
            });

        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Brain className="h-8 w-8 text-primary" />
                </motion.div>
            </div>
        );
    }

    if (scoreTrends.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Interview Data Yet</h3>
                    <p className="text-muted-foreground">Complete some interviews to see your analytics here.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Total Interviews", value: stats.totalInterviews, icon: Calendar, color: "text-blue-500" },
                    { title: "Average Score", value: `${stats.avgScore}%`, icon: Target, color: "text-green-500" },
                    { title: "Best Score", value: `${stats.bestScore}%`, icon: Award, color: "text-yellow-500" },
                    { title: "Improvement", value: `${stats.improvementRate > 0 ? '+' : ''}${stats.improvementRate}%`, icon: TrendingUp, color: stats.improvementRate >= 0 ? "text-emerald-500" : "text-red-500" }
                ].map((stat, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Score Trends Chart */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Score Trends Over Time
                    </CardTitle>
                    <CardDescription>Track your interview performance improvement</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scoreTrends}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="interview" className="text-xs" />
                            <YAxis domain={[0, 100]} className="text-xs" />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Performance by Type */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Performance by Interview Type
                    </CardTitle>
                    <CardDescription>Compare your scores across different interview formats</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceByType}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="type" className="text-xs" />
                            <YAxis domain={[0, 100]} className="text-xs" />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                            <Legend />
                            <Bar dataKey="avgScore" fill="hsl(var(--primary))" name="Average Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 6Q Evolution */}
            {sixQEvolution.length > 0 && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            6Q Personality Evolution
                        </CardTitle>
                        <CardDescription>Compare your first and latest 6Q scores</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={sixQEvolution}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="trait" />
                                <PolarRadiusAxis domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                <Legend />
                                <Radar name="First Interview" dataKey="first" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.3} />
                                <Radar name="Latest Interview" dataKey="latest" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default InterviewAnalytics;
