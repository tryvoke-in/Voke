import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface ResumeAnalysisDisplayProps {
    analysis: any;
}

const ResumeAnalysisDisplay: React.FC<ResumeAnalysisDisplayProps> = ({ analysis }) => {
    if (!analysis) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        return "Needs Improvement";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            {/* ATS Score */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        ATS Compatibility Score
                    </CardTitle>
                    <CardDescription>How well your resume performs in Applicant Tracking Systems</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className={`text-6xl font-bold ${getScoreColor(analysis.ats_score || 0)}`}>
                                {analysis.ats_score || 0}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{getScoreLabel(analysis.ats_score || 0)}</p>
                        </div>
                        <div className="text-right">
                            <Badge variant={analysis.ats_score >= 80 ? "default" : analysis.ats_score >= 60 ? "secondary" : "destructive"}>
                                {getScoreLabel(analysis.ats_score || 0)}
                            </Badge>
                        </div>
                    </div>
                    <Progress value={analysis.ats_score || 0} className="h-3" />
                </CardContent>
            </Card>

            {/* Keywords */}
            {analysis.keywords && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Keywords Analysis</CardTitle>
                        <CardDescription>Important keywords for your target role</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {analysis.keywords.present && analysis.keywords.present.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Present Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.present.map((keyword: string, index: number) => (
                                        <Badge key={index} variant="outline" className="border-green-500/30 text-green-600">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {analysis.keywords.missing && analysis.keywords.missing.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    Missing Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.missing.map((keyword: string, index: number) => (
                                        <Badge key={index} variant="outline" className="border-orange-500/30 text-orange-600">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-6">
                {analysis.strengths && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-l-4 border-l-green-500">
                        <CardHeader>
                            <CardTitle className="text-green-600 dark:text-green-400">Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {analysis.strengths.map((strength: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {analysis.improvements && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-l-4 border-l-orange-500">
                        <CardHeader>
                            <CardTitle className="text-orange-600 dark:text-orange-400">Improvements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {analysis.improvements.map((improvement: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span>{improvement}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detailed Feedback */}
            {(analysis.structure_feedback || analysis.content_feedback) && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Detailed Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {analysis.structure_feedback && (
                            <div>
                                <h4 className="font-semibold mb-2">Structure & Formatting</h4>
                                <p className="text-sm text-muted-foreground">{analysis.structure_feedback}</p>
                            </div>
                        )}
                        {analysis.content_feedback && (
                            <div>
                                <h4 className="font-semibold mb-2">Content Quality</h4>
                                <p className="text-sm text-muted-foreground">{analysis.content_feedback}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default ResumeAnalysisDisplay;
