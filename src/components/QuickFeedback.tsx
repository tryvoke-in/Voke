import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Award, ArrowRight } from "lucide-react";

interface QuickFeedbackProps {
    modelAnswer: string;
    whatsGood: string[];
    whatsWrong: string[];
    deliveryScore: number;
    bodyLanguageScore: number;
    confidenceScore: number;
    onNext: () => void;
    isLastQuestion: boolean;
}

export const QuickFeedback = ({
    modelAnswer,
    whatsGood,
    whatsWrong,
    deliveryScore,
    bodyLanguageScore,
    confidenceScore,
    onNext,
    isLastQuestion,
}: QuickFeedbackProps) => {
    const avgScore = Math.round((deliveryScore + bodyLanguageScore + confidenceScore) / 3);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Scores */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-violet-500">{deliveryScore}</div>
                        <div className="text-xs text-muted-foreground mt-1">Delivery</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-500">{bodyLanguageScore}</div>
                        <div className="text-xs text-muted-foreground mt-1">Body Language</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-fuchsia-500">{confidenceScore}</div>
                        <div className="text-xs text-muted-foreground mt-1">Confidence</div>
                    </CardContent>
                </Card>
            </div>

            {/* Model Answer */}
            <Card className="bg-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-500" />
                        Model Answer
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{modelAnswer}</p>
                </CardContent>
            </Card>

            {/* What's Good / What's Wrong */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            What's Good
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {whatsGood.map((item, idx) => (
                                <li key={idx} className="flex gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                                    <span className="text-muted-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/5 border-red-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            What's Wrong
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {whatsWrong.map((item, idx) => (
                                <li key={idx} className="flex gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                                    <span className="text-muted-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Next Button */}
            <div className="flex justify-center pt-4">
                <Button
                    onClick={onNext}
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg px-8"
                >
                    {isLastQuestion ? "View Overall Results" : "Next Question"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    );
};
