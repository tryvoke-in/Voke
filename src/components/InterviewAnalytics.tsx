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
            const [textRes, videoRes, peerRes] = await Promise.all([
                supabase.from("interview_sessions").select("*").eq("user_id", userId).order("created_at"),
                supabase.from("video_interview_sessions").select("*").eq("user_id", userId).order("created_at"),
                supabase.from("peer_interview_sessions").select("*").or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`).order("created_at")
            ]);

            const textSessions = textRes.data || [];
            const videoSessions = videoRes.data || [];
            const peerSessions = (peerRes.data || []).filter((p: any) => p.status === 'completed');

            const totalInterviews = textSessions.length + videoSessions.length + peerSessions.length;

            const allSessions = [
                ...textSessions.map(s => ({ ...s, type: "text" })),
                ...videoSessions.map(s => ({ ...s, type: "video" }))
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // Calculate score trends (scored sessions)
            const scoredSessions = allSessions.filter(s => s.overall_score !== null && s.overall_score !== undefined && Number(s.overall_score) > 0);

            const trends = scoredSessions.map((session, index) => ({
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
                    avgScore: textSessions.filter(s => s.interview_mode === "voice" && s.overall_score).length > 0
                        ? Math.round(textSessions.filter(s => s.interview_mode === "voice" && s.overall_score).reduce((acc, s) => acc + s.overall_score, 0) / textSessions.filter(s => s.interview_mode === "voice" && s.overall_score).length)
                        : 0,
                    count: textSessions.filter(s => s.interview_mode === "voice").length
                },
                {
                    type: "Video",
                    avgScore: videoSessions.filter(s => s.overall_score).length > 0
                        ? Math.round(videoSessions.filter(s => s.overall_score).reduce((acc, s) => acc + s.overall_score, 0) / videoSessions.filter(s => s.overall_score).length)
                        : 0,
                    count: videoSessions.length
                },
                {
                    type: "Text",
                    avgScore: textSessions.filter(s => (!s.interview_mode || s.interview_mode !== "voice") && s.overall_score).length > 0
                        ? Math.round(textSessions.filter(s => (!s.interview_mode || s.interview_mode !== "voice") && s.overall_score).reduce((acc, s) => acc + s.overall_score, 0) / textSessions.filter(s => (!s.interview_mode || s.interview_mode !== "voice") && s.overall_score).length)
                        : 0,
                    count: textSessions.filter(s => !s.interview_mode || s.interview_mode !== "voice").length
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

            // Calculate platform-wide average score
            let totalScore = 0;
            let scoredCount = 0;

            textSessions.forEach(s => {
                if (s.overall_score !== null && s.overall_score !== undefined && Number(s.overall_score) > 0) {
                    totalScore += Number(s.overall_score);
                    scoredCount++;
                }
            });

            videoSessions.forEach(s => {
                if (s.overall_score !== null && s.overall_score !== undefined && Number(s.overall_score) > 0) {
                    totalScore += Number(s.overall_score);
                    scoredCount++;
                }
            });

            peerSessions.forEach((p: any) => {
                const myRating = p.peer_interview_ratings?.find((r: any) => r.rated_user_id === userId);
                if (myRating && myRating.overall_score) {
                    totalScore += Number(myRating.overall_score) * 20;
                    scoredCount++;
                }
            });

            const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
            const allScores = [...textSessions.map(s => s.overall_score), ...videoSessions.map(s => s.overall_score)].filter((sc): sc is number => Boolean(sc && sc > 0));
            const bestScore = allScores.length > 0 ? Math.max(...allScores, 0) : 0;

            let improvementRate = 0;
            if (scoredSessions.length > 1) {
                const firstScore = scoredSessions[0]?.overall_score || 0;
                const latestScore = scoredSessions[scoredSessions.length - 1]?.overall_score || 0;
                if (firstScore > 0) {
                    improvementRate = Math.round(((latestScore - firstScore) / firstScore) * 100);
                } else {
                    improvementRate = latestScore - firstScore;
                }
            }
            if (!isFinite(improvementRate) || isNaN(improvementRate)) {
                improvementRate = 0;
            }

            setStats({
                totalInterviews,
                avgScore,
                improvementRate,
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
