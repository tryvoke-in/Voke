import React, { useState } from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Brain,
    Heart,
    Lightbulb,
    Shield,
    Users,
    Scale,
    ChevronDown,
    ChevronUp,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SixQScores {
    iq: number;
    eq: number;
    cq: number;
    aq: number;
    sq: number;
    mq: number;
}

interface SixQAnalysisProps {
    scores?: SixQScores;
    cluster?: string;
}

const TRAIT_DETAILS = {
    iq: {
        label: "IQ (Intelligence Quotient)",
        shortDesc: "Problem solving, concept grasping, and logic.",
        icon: Brain,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        highIndicators: [
            "Academic performance",
            "Uses specific examples to justify opinions",
            "Asks counter-questions to refine understanding",
            "Minimal emotional expression"
        ],
        developingIndicators: [
            "Responses not clear ('I don’t know')",
            "Changes topic often",
            "Rarely asks follow-ups",
            "Relies on emotions (e.g., Shrugs)"
        ],
        improvement: [
            "Ask to explain thought process ('Walk me through how you reached this step')",
            "Encourage asking 'why' or 'how' before answering",
            "Organize thoughts: Point → Explanation → Example",
            "Build clarity habits: summarize in three lines"
        ]
    },
    eq: {
        label: "EQ (Emotional Quotient)",
        shortDesc: "Emotional literacy, self-awareness, and empathy.",
        icon: Heart,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        highIndicators: [
            "Admits mistakes & feedback without defensiveness",
            "Uses emotional vocabulary",
            "Acknowledges both strengths and struggles",
            "Values teamwork, listens to peers",
            "Takes pauses before responding"
        ],
        developingIndicators: [
            "Blames others instead of owning reactions",
            "Holds grudges or replays negative events",
            "Displays visible frustration quickly",
            "Seeks constant external validation"
        ],
        improvement: [
            "Introduce emotional vocabulary (confused, stressed, tired)",
            "Reflection questions: what was in your control?",
            "Pause technique: take 5 seconds before reacting",
            "Replace comparison with self-progress"
        ]
    },
    cq: {
        label: "CQ (Creativity Quotient)",
        shortDesc: "Finding new ways to look at questions.",
        icon: Lightbulb,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        highIndicators: [
            "Asks diverse, curiosity-driven questions",
            "Uses 'maybe', 'what if', or 'imagine if' often",
            "Associates concepts creatively",
            "Comfortable with trial and error",
            "Quick shifts in tone (excitement, imagination)"
        ],
        developingIndicators: [
            "Gets uncomfortable with open-ended questions",
            "Prefers structured, known paths",
            "Rarely asks questions beyond the task",
            "Gets frustrated when unsure of success"
        ],
        improvement: [
            "Ask open-ended prompts ('What are 3 ways to solve this?')",
            "Creativity warm-ups: imagine 3 alternatives",
            "Praise attempts, not just correctness",
            "Mini design tasks ('Redesign your morning routine')"
        ]
    },
    aq: {
        label: "AQ (Adversity Quotient)",
        shortDesc: "Handling pressure, setbacks, and uncertainty.",
        icon: Shield,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        highIndicators: [
            "Nods or uses affirming gestures while reflecting",
            "Talks about process, doesn't blame others",
            "Doesn't overjustify — gives quick, clear reflection",
            "Calm tone when describing workload",
            "Listens without interrupting when corrected"
        ],
        developingIndicators: [
            "Reflection is missing",
            "Quickly blames others",
            "Immediate defensiveness — tone sharpens",
            "Quick frustration"
        ],
        improvement: [
            "3-step reflection: what happened, what went wrong, what to do differently",
            "Break tasks into micro-goals",
            "Calm communication: pause, breathe, describe without judgment",
            "Plan weekly workload (priority list, time blocks)"
        ]
    },
    sq: {
        label: "SQ (Social Quotient)",
        shortDesc: "Connecting, collaborating, and building rapport.",
        icon: Users,
        color: "text-green-500",
        bg: "bg-green-500/10",
        highIndicators: [
            "Adapts tone based on audience",
            "Includes others in discussions",
            "Handles conflict maturely",
            "Understands non-verbal cues"
        ],
        developingIndicators: [
            "Blames team or coordination issues",
            "Dominates or withdraws in group tasks",
            "Focuses only on their own ideas"
        ],
        improvement: [
            "Small group tasks with roles (time-keeper, summarizer)",
            "Conversation rule: speak 30s, listen 30s",
            "Deliberately ask a teammate for their opinion",
            "Conflict language: 'I understand your point, here is my view...'"
        ]
    },
    mq: {
        label: "MQ (Moral Quotient)",
        shortDesc: "Integrity, honesty, and fairness.",
        icon: Scale,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        highIndicators: [
            "Takes responsibility for group outcomes",
            "Acknowledges contributions of others",
            "Consistency across contexts",
            "Owns up to mistakes honestly"
        ],
        developingIndicators: [
            "Alters behavior based on who is present",
            "Avoids reflection after conflicts not in their favor"
        ],
        improvement: [
            "Scenario-based questions ('What if faculty wasn't watching?')",
            "Honesty reflections: could you have handled it more fairly?",
            "Small responsibilities (attendance, coordination)",
            "Role-model integrity and avoid judgment"
        ]
    }
};

const CLUSTER_DETAILS: Record<string, { strength: string; roles: string }> = {
    "Balanced Thinker": { strength: "Logical, calm, socially aware", roles: "Class Representative, Peer Mentor, Study Circle Coordinator" },
    "Innovative Problem Solver": { strength: "Logical, creative, works under pressure", roles: "Hackathon Team Member, Tech Club Member" },
    "Creative Strategist": { strength: "Smart, imaginative, people-friendly", roles: "UI/UX Helper, Design Team Volunteer, Ideation Support" },
    "Resilient Scholar": { strength: "Clear thinker, disciplined", roles: "Study Support Volunteer, Coding Practice Buddy, Subject Revision Lead" },
    "Responsible Analyst": { strength: "Logical, reliable, ethical", roles: "Lab Volunteer, Code of Conduct Helper, Event Logistics" },
    "Compassionate Leader": { strength: "Empathetic, ethical, socially aware", roles: "Student Welfare Helper, Hostel Buddy Mentor, Cultural Event Team" },
    "Creative People Person": { strength: "Expressive, creative, interactive", roles: "Social Media Team, Content Creation, Video Editing" },
    "Ethical Resilient Leader": { strength: "Calm, fair, good under stress", roles: "Clan Team Roles, Discipline Support Team" },
    "Adaptive Innovator": { strength: "Creative, adaptable", roles: "Robotics & IoT Team, Fest Tech Crew, Project Implementation" },
    "Socially Conscious Creator": { strength: "Creative, ethical, community-driven", roles: "Community Projects, Tech-for-Good, Awareness Campaigns" },
    "Ethical Executor": { strength: "Disciplined, values-driven", roles: "Event Operations, Project Task Coordinator, Exam Support" },
    "Empathic Creator": { strength: "Emotional, creative, grounded", roles: "Wellness Awareness Content, Peer Listener, Creative Workshop Assistant" },
    "Insightful Innovator": { strength: "Logical, creative, empathetic", roles: "Product Ideation, UX Research, Prototype Planning" },
    "Thoughtful Decision Maker": { strength: "Mature, balanced", roles: "Student Council, Club Recruitment, Mediation Helper" },
    "Creative Resilient Communicator": { strength: "Creative, calm, confident", roles: "Event Hosting, Anchor/Moderator, PR & Outreach" },
    "Purpose-Led Problem Solver": { strength: "Ethical, innovation-driven", roles: "Social Innovation Cell, Tech for Impact, NGO Tech Assistance" },
    "High-Output Collaborator": { strength: "Team-driven, fast learner", roles: "Event Core Helper, Academic Task Coordinator, Project Collaboration" },
    "The Stabiliser": { strength: "Emotionally strong, adaptive", roles: "Peer Support Group, Stress Relief Coordinator, Team Harmony" },
};

const SixQAnalysis = ({ scores, cluster }: SixQAnalysisProps) => {
    const [expandedTrait, setExpandedTrait] = useState<keyof SixQScores | null>(null);

    if (!scores) return null;

    const data = [
        { subject: "IQ", A: scores.iq, fullMark: 100 },
        { subject: "EQ", A: scores.eq, fullMark: 100 },
        { subject: "CQ", A: scores.cq, fullMark: 100 },
        { subject: "AQ", A: scores.aq, fullMark: 100 },
        { subject: "SQ", A: scores.sq, fullMark: 100 },
        { subject: "MQ", A: scores.mq, fullMark: 100 },
    ];

    const clusterInfo = cluster && CLUSTER_DETAILS[cluster] ? CLUSTER_DETAILS[cluster] : null;

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Radar Chart */}
                <Card className="bg-card/30 backdrop-blur-xl border-border/50 h-full flex flex-col justify-center min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-center text-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Personality Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                                <PolarGrid stroke="currentColor" className="text-muted/20" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "currentColor", fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Cluster & Summary */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🌟</span>
                                Your Personality Cluster
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-foreground mb-1">
                                    {cluster || "Analyzing..."}
                                </h3>
                                <p className="text-muted-foreground">
                                    {clusterInfo?.strength || "Your unique combination of traits defines your professional persona."}
                                </p>
                            </div>

                            {clusterInfo && (
                                <div className="pt-4 border-t border-border/50">
                                    <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">Recommended Roles</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {clusterInfo.roles.split(',').map((role, i) => (
                                            <Badge key={i} variant="secondary" className="bg-background/50 hover:bg-background/80">
                                                {role.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="p-4 rounded-xl bg-background/50 border border-border/50">
                                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Top Trait</div>
                                <div className="text-lg font-bold capitalize">{key.toUpperCase()}</div>
                                <div className="text-2xl font-bold text-primary">{value}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"></span>
                    Detailed 6Q Analysis
                </h3>
                <div className="grid gap-4">
                    {(Object.entries(TRAIT_DETAILS) as [keyof SixQScores, typeof TRAIT_DETAILS.iq][]).map(([key, info]) => {
                        const score = scores[key];
                        const Icon = info.icon;
                        const isExpanded = expandedTrait === key;

                        return (
                            <motion.div
                                key={key}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card
                                    className={`border-border/50 bg-card/50 transition-all cursor-pointer ${isExpanded ? 'ring-2 ring-primary/20' : 'hover:bg-card/80'}`}
                                    onClick={() => setExpandedTrait(isExpanded ? null : key)}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${info.bg}`}>
                                                <Icon className={`w-6 h-6 ${info.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-foreground text-lg">{info.label}</h4>
                                                    <span className={`text-xl font-bold ${info.color}`}>{score}%</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{info.shortDesc}</p>
                                                <div className="w-full bg-muted/30 rounded-full h-2 mt-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${info.bg.replace('/10', '')}`}
                                                        style={{ width: `${score}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-muted-foreground">
                                                {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-6 grid md:grid-cols-3 gap-6 border-t border-border/50 mt-6">
                                                        <div>
                                                            <h5 className="font-semibold text-green-500 mb-2 flex items-center gap-2">
                                                                <span className="text-xs">●</span> High Indicators
                                                            </h5>
                                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                                {info.highIndicators.map((item, i) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-orange-500 mb-2 flex items-center gap-2">
                                                                <span className="text-xs">●</span> Developing Indicators
                                                            </h5>
                                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                                {info.developingIndicators.map((item, i) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-blue-500 mb-2 flex items-center gap-2">
                                                                <span className="text-xs">●</span> How to Improve
                                                            </h5>
                                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                                {info.improvement.map((item, i) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SixQAnalysis;
