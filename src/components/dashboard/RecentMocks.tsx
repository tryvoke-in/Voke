import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Play, Users, ArrowRight, Activity, Calendar, Award } from "lucide-react";
import { motion } from "framer-motion";

interface RecentMocksProps {
  sessions: any[];
}

export const RecentMocks = ({ sessions }: RecentMocksProps) => {
  const navigate = useNavigate();
  const recentThree = (sessions || []).slice(0, 3);

  const getSessionDetails = (session: any) => {
    switch (session.type) {
      case "Text":
        return {
          title: "AI Chat Mock",
          path: `/interview/results/${session.id}`,
          icon: MessageSquare,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        };
      case "Video":
        return {
          title: "AI Video Practice",
          path: `/video-interview/results/${session.id}`,
          icon: Play,
          color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
        };
      case "Peer":
        return {
          title: "Peer Match Session",
          path: "/peer-interviews",
          icon: Users,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        };
      default:
        return {
          title: "Practice Session",
          path: "/dashboard",
          icon: Activity,
          color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
        };
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null || score === undefined) return "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300";
    if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900/50 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:to-purple-950/10 backdrop-blur-xl border-gray-100 dark:border-white/5 overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-1.5 text-gray-900 dark:text-white">
                <Activity className="w-4 h-4 text-violet-500" />
                Recent Practice
              </CardTitle>
              <CardDescription className="text-[11px] text-gray-500 dark:text-gray-400">
                AI feedback and performance analytics
              </CardDescription>
            </div>
            {recentThree.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] h-7 px-2 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                onClick={() => navigate("/progress-analytics")}
              >
                View All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4 px-4 pt-0">
          {recentThree.length > 0 ? (
            <div className="space-y-2">
              {recentThree.map((session, index) => {
                const details = getSessionDetails(session);
                const IconComponent = details.icon;
                return (
                  <div
                    key={session.id || index}
                    onClick={() => navigate(details.path)}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-md border shrink-0 ${details.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-none mb-0.5">
                          {details.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(session.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] px-2 py-0.5 font-semibold ${getScoreColor(session.score)}`} variant="outline">
                        {session.score !== null && session.score !== undefined ? (
                          <span className="flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5" />
                            {session.score}%
                          </span>
                        ) : (
                          "Completed"
                        )}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
              <p className="text-[11px] text-muted-foreground mb-2">No practice history recorded yet.</p>
              <Button
                size="sm"
                onClick={() => navigate("/interview/new")}
                className="h-7 px-3 text-[11px] bg-violet-600 hover:bg-violet-700 text-white"
              >
                Start AI Mock
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
