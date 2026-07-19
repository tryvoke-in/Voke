import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, TrendingUp, Sparkles, ArrowRight, Zap, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressPanelProps {
  allSessions?: any[];
}

const defaultChartData = [
  { name: "7 days ago", score: 42 },
  { name: "5 days ago", score: 58 },
  { name: "4 days ago", score: 72 },
  { name: "3 days ago", score: 85 },
  { name: "2 days ago", score: 65 },
  { name: "Yesterday", score: 80 },
  { name: "Today", score: 95 }
];

export const ProgressPanel = ({ allSessions = [] }: ProgressPanelProps) => {
  const navigate = useNavigate();

  // 1. Filter sessions with numerical overall scores
  const scoredSessions = allSessions
    .filter(s => typeof s.score === 'number' && s.score !== null && s.score > 0)
    .map(s => ({
      date: s.date || s.created_at || s.scheduled_at,
      score: Number(s.score)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Calculate dynamic overall score progression
  let startingScore = 34;
  let currentScore = 48;
  let ptsDifference = 14;

  if (scoredSessions.length >= 2) {
    startingScore = scoredSessions[0].score;
    currentScore = scoredSessions[scoredSessions.length - 1].score;
    ptsDifference = currentScore - startingScore;
  } else if (scoredSessions.length === 1) {
    startingScore = Math.max(0, scoredSessions[0].score - 10);
    currentScore = scoredSessions[0].score;
    ptsDifference = 10;
  }

  const diffSign = ptsDifference >= 0 ? "+" : "";
  const diffColorClass = ptsDifference >= 0 ? "text-violet-400" : "text-red-400";

  // 3. Format line chart data
  const formatRelativeDate = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      return `${diffDays} days ago`;
    } catch (e) {
      return "Session";
    }
  };

  const chartData = scoredSessions.length >= 2
    ? scoredSessions.slice(-7).map(s => ({
        name: formatRelativeDate(s.date),
        score: s.score
      }))
    : defaultChartData;

  // 4. Calculate total practice stats
  const totalInterviews = allSessions.length > 0 ? allSessions.length : 67;

  let totalSeconds = 0;
  allSessions.forEach(s => {
    if (s.type === 'Text') totalSeconds += (s.total_duration_seconds || 0);
    else if (s.type === 'Video') totalSeconds += (s.duration_seconds || 0);
    else if (s.type === 'Peer' && s.status === 'completed') totalSeconds += ((s.duration_minutes || 0) * 60);
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const practiceTimeText = totalSeconds > 0
    ? `${hours}h ${minutes}m`
    : "12h 40m";

  // 5. Biggest improvement / focus area calculation
  // We can look at categories (Text / Video / Coding / System) if available
  // Fall back to default mock stats if not enough data
  let biggestImprovementLabel = "Communication";
  let biggestImprovementVal = "+18%";
  let needsAttentionLabel = "Technical problem solving";
  let needsAttentionVal = 41;

  if (allSessions.length >= 3) {
    const textScores = allSessions.filter(s => s.type === 'Text' && s.score).map(s => s.score);
    const videoScores = allSessions.filter(s => s.type === 'Video' && s.score).map(s => s.score);

    const textAvg = textScores.length > 0 ? textScores.reduce((a, b) => a + b, 0) / textScores.length : 60;
    const videoAvg = videoScores.length > 0 ? videoScores.reduce((a, b) => a + b, 0) / videoScores.length : 60;

    // Pick the lower average score as the "needs attention" skill
    if (textAvg < videoAvg) {
      needsAttentionLabel = "Technical problem solving";
      needsAttentionVal = Math.round(textAvg);
      biggestImprovementLabel = "Communication";
      biggestImprovementVal = "+15%";
    } else {
      needsAttentionLabel = "Communication skills";
      needsAttentionVal = Math.round(videoAvg);
      biggestImprovementLabel = "Technical reasoning";
      biggestImprovementVal = "+12%";
    }
  }

  return (
    <Card className="border-border/50 bg-[#0d1117] dark:bg-[#0a0d14] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-white/90">Your Progress Since Day 1</h3>
        <div className="bg-violet-950/40 border border-violet-800/40 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <span className={diffColorClass}>{diffSign}{Math.abs(ptsDifference)} pts</span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overall Score</div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-white/95">{startingScore}%</span>
          <div className="flex-1 h-2 bg-zinc-800 rounded-full relative">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full"
              style={{ width: `${currentScore}%` }}
            />
            {/* Knob */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
              style={{ left: `${currentScore}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <span className="text-2xl font-bold text-white/95">{currentScore}%</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last 7 interviews</div>
        <div className="h-[180px] w-full mt-2 -ml-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#4b5563" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#4b5563" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '12px',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  color: '#fff'
                }}
                itemStyle={{ color: '#a78bfa' }}
                labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#ffffff', stroke: '#8b5cf6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Interviews Count */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalInterviews}</div>
            <div className="text-[11px] text-muted-foreground">interviews</div>
          </div>
        </div>

        {/* Practiced Time */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{practiceTimeText}</div>
            <div className="text-[11px] text-muted-foreground">practiced</div>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Biggest Improvement */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 min-h-[95px]">
          <div className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
            <span>Biggest improvement</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-medium text-white/90">{biggestImprovementLabel}</div>
            <div className="text-emerald-400 text-sm font-bold mt-0.5">{biggestImprovementVal}</div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-300 min-h-[95px]">
          <div className="text-orange-500 text-xs font-semibold">
            Needs attention
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-sm font-medium text-white/90 truncate">{needsAttentionLabel}</div>
            <div className="text-zinc-400 text-xs flex items-center gap-1.5">
              <span>Score:</span>
              <span className="text-white font-semibold">{needsAttentionVal}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full" 
                style={{ width: `${needsAttentionVal}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Practice Button */}
      <button
        onClick={() => navigate("/question-practice")}
        className="w-full py-3 px-4 rounded-xl border border-violet-500/50 text-violet-400 font-semibold text-sm hover:bg-violet-500/10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
      >
        <span>Practice this skill</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </Card>
  );
};
