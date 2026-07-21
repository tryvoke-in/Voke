import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { FileText, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProgressPanelProps {
  allSessions?: any[];
}

export const ProgressPanel = ({ allSessions = [] }: ProgressPanelProps) => {
  const navigate = useNavigate();

  // 1. Filter sessions with numerical overall scores and extract details
  const scoredSessions = allSessions
    .filter(s => {
      const hasOverallScore = typeof s.score === 'number' && s.score !== null && s.score > 0;
      const hasOverallScoreAlt = typeof s.overall_score === 'number' && s.overall_score !== null && s.overall_score > 0;
      return hasOverallScore || hasOverallScoreAlt;
    })
    .map(s => {
      const overallScore = typeof s.score === 'number' && s.score > 0 
        ? s.score 
        : (s.overall_score || 0);

      return {
        date: s.date || s.created_at || s.scheduled_at,
        score: Number(overallScore),
        confidence: typeof s.confidence_score === 'number' ? s.confidence_score : null,
        delivery: typeof s.delivery_score === 'number' ? s.delivery_score : null,
        body: typeof s.body_language_score === 'number' ? s.body_language_score : null,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Calculate dynamic overall score progression
  let startingScore = 0;
  let currentScore = 0;
  let ptsDifference = 0;

  if (scoredSessions.length >= 2) {
    startingScore = scoredSessions[0].score;
    currentScore = scoredSessions[scoredSessions.length - 1].score;
    ptsDifference = currentScore - startingScore;
  } else if (scoredSessions.length === 1) {
    startingScore = scoredSessions[0].score;
    currentScore = scoredSessions[0].score;
    ptsDifference = 0;
  }

  const diffSign = ptsDifference >= 0 ? "+" : "";
  const diffColorClass = ptsDifference >= 0 ? "text-violet-500 font-semibold" : "text-red-500 font-semibold";

  // 3. Format line chart data
  const formatRelativeDate = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return "Session";
    }
  };

  const chartData = scoredSessions.length > 0
    ? scoredSessions.slice(-7).map(s => ({
        name: formatRelativeDate(s.date),
        score: s.score
      }))
    : [];

  // 4. Calculate total practice stats
  const totalInterviews = allSessions.length;

  let totalSeconds = 0;
  allSessions.forEach(s => {
    if (s.type === 'Text') totalSeconds += (s.total_duration_seconds || 0);
    else if (s.type === 'Video') totalSeconds += (s.duration_seconds || 0);
    else if (s.type === 'Peer' && s.status === 'completed') totalSeconds += ((s.duration_minutes || 0) * 60);
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const practiceTimeText = `${hours}h ${minutes}m`;

  // 5. Biggest improvement / focus area calculation
  let biggestImprovementLabel = "Mock Practice";
  let biggestImprovementVal = "0%";
  let needsAttentionLabel = "Initial Practice Session";
  let needsAttentionVal = 0;

  if (scoredSessions.length >= 2) {
    const first = scoredSessions[0];
    const last = scoredSessions[scoredSessions.length - 1];

    const getVal = (s: typeof last, key: 'confidence' | 'delivery' | 'body') => {
      if (typeof s[key] === 'number') return s[key] as number;
      return s.score;
    };

    const techImp = getVal(last, 'confidence') - getVal(first, 'confidence');
    const commImp = getVal(last, 'delivery') - getVal(first, 'delivery');
    const bodyImp = getVal(last, 'body') - getVal(first, 'body');

    const improvements = [
      { name: "Technical Reasoning", val: techImp },
      { name: "Communication Skills", val: commImp },
      { name: "Presentation & Delivery", val: bodyImp },
    ];
    improvements.sort((a, b) => b.val - a.val);

    biggestImprovementLabel = improvements[0].name;
    biggestImprovementVal = `${improvements[0].val >= 0 ? "+" : ""}${Math.round(improvements[0].val)}%`;

    const techAvgList = scoredSessions.map(s => typeof s.confidence === 'number' ? s.confidence : s.score);
    const commAvgList = scoredSessions.map(s => typeof s.delivery === 'number' ? s.delivery : s.score);
    const bodyAvgList = scoredSessions.map(s => typeof s.body === 'number' ? s.body : s.score);

    const techAvg = techAvgList.reduce((a, b) => a + b, 0) / techAvgList.length;
    const commAvg = commAvgList.reduce((a, b) => a + b, 0) / commAvgList.length;
    const bodyAvg = bodyAvgList.reduce((a, b) => a + b, 0) / bodyAvgList.length;

    const averages = [
      { name: "Technical Reasoning", val: techAvg },
      { name: "Communication Skills", val: commAvg },
      { name: "Presentation & Delivery", val: bodyAvg },
    ];
    averages.sort((a, b) => a.val - b.val);

    needsAttentionLabel = averages[0].name;
    needsAttentionVal = Math.round(averages[0].val);
  } else if (scoredSessions.length === 1) {
    const session = scoredSessions[0];
    biggestImprovementLabel = "Baseline Established";
    biggestImprovementVal = "+0%";

    const tech = typeof session.confidence === 'number' ? session.confidence : session.score;
    const comm = typeof session.delivery === 'number' ? session.delivery : session.score;
    const body = typeof session.body === 'number' ? session.body : session.score;

    const scores = [
      { name: "Technical Reasoning", val: tech },
      { name: "Communication Skills", val: comm },
      { name: "Presentation & Delivery", val: body },
    ];
    scores.sort((a, b) => a.val - b.val);

    needsAttentionLabel = scores[0].name;
    needsAttentionVal = Math.round(scores[0].val);
  }

  return (
    <Card className="border-border/50 bg-card text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground/90">Your Progress Since Day 1</h3>
        <div className="bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <span className={diffColorClass}>{diffSign}{Math.abs(ptsDifference)} pts</span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overall Score</div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-foreground/95">{startingScore}%</span>
          <div className="flex-1 h-2 bg-muted rounded-full relative">
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
          <span className="text-2xl font-bold text-foreground/95">{currentScore}%</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last 7 interviews</div>
        {chartData.length === 0 ? (
          <div className="h-[180px] w-full flex flex-col items-center justify-center border border-dashed border-border/40 rounded-2xl bg-muted/10 p-4 mt-2">
            <TrendingUp className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-medium">No progress chart data yet</span>
            <span className="text-[10px] text-muted-foreground/60 mt-1">Complete interviews to see score trends</span>
          </div>
        ) : (
          <div className="h-[180px] w-full mt-2 -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  className="text-muted-foreground"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-muted-foreground"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    color: 'hsl(var(--foreground))'
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
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Interviews Count */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{totalInterviews}</div>
            <div className="text-[11px] text-muted-foreground">interviews</div>
          </div>
        </div>

        {/* Practiced Time */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{practiceTimeText}</div>
            <div className="text-[11px] text-muted-foreground">practiced</div>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Biggest Improvement */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 min-h-[95px]">
          <div className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
            <span>Biggest improvement</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-medium text-foreground/90">{biggestImprovementLabel}</div>
            <div className="text-emerald-400 text-sm font-bold mt-0.5">{biggestImprovementVal}</div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-300 min-h-[95px]">
          <div className="text-orange-500 text-xs font-semibold">
            Needs attention
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-sm font-medium text-foreground/90 truncate">{needsAttentionLabel}</div>
            <div className="text-muted-foreground text-xs flex items-center gap-1.5">
              <span>Score:</span>
              <span className="text-foreground font-semibold">{needsAttentionVal}%</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
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
        className="w-full py-3 px-4 rounded-xl border border-violet-500/40 text-violet-500 font-semibold text-sm hover:bg-violet-500/5 dark:hover:bg-violet-500/10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
      >
        <span>Practice this skill</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </Card>
  );
};
