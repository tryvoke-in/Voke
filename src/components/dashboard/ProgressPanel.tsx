import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { FileText, Clock, TrendingUp, ArrowRight, Zap, Target, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProgressPanelProps {
  allSessions?: any[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-violet-500/30 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 z-50 text-white min-w-[170px]">
        <div className="font-semibold text-white border-b border-white/10 pb-1.5 flex items-center justify-between gap-3">
          <span>{data.fullDate || data.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
            {data.type || 'Interview'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-slate-400">Overall Score:</span>
          <span className="font-bold text-violet-400 text-sm">{data.score}%</span>
        </div>
        {typeof data.confidence === 'number' && (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-400">Technical:</span>
            <span className="font-medium text-slate-200">{data.confidence}%</span>
          </div>
        )}
        {typeof data.delivery === 'number' && (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-400">Communication:</span>
            <span className="font-medium text-slate-200">{data.delivery}%</span>
          </div>
        )}
        {typeof data.body === 'number' && (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-400">Presentation:</span>
            <span className="font-medium text-slate-200">{data.body}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ProgressPanel = ({ allSessions = [] }: ProgressPanelProps) => {
  const navigate = useNavigate();

  // 1. Process and normalize session scores across Text, Video, Peer & Practice sessions
  const scoredSessions = allSessions
    .map(s => {
      const date = s.date || s.created_at || s.scheduled_at || new Date().toISOString();
      let overallScore = typeof s.score === 'number' && s.score > 0 
        ? s.score 
        : (typeof s.overall_score === 'number' && s.overall_score > 0 ? s.overall_score : null);

      const confidence = typeof s.confidence_score === 'number' ? s.confidence_score : null;
      const delivery = typeof s.delivery_score === 'number' ? s.delivery_score : null;
      const body = typeof s.body_language_score === 'number' ? s.body_language_score : null;

      // Fallback if overallScore is missing but sub-scores exist
      if (overallScore === null) {
        const subScores = [confidence, delivery, body].filter((val): val is number => typeof val === 'number');
        if (subScores.length > 0) {
          overallScore = Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length);
        }
      }

      if (overallScore === null) return null;

      return {
        id: s.id || Math.random().toString(),
        type: s.type || 'Interview',
        date: date,
        score: Math.min(100, Math.max(0, Number(overallScore))),
        confidence: confidence,
        delivery: delivery,
        body: body,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Score Progression calculation
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
  const diffColorClass = ptsDifference >= 0 ? "text-emerald-500 dark:text-emerald-400 font-semibold" : "text-rose-500 font-semibold";

  // 3. Line chart data with clean, unique dates & full time tooltips
  const chartData = scoredSessions.slice(-7).map((s, index, arr) => {
    let name = "Session";
    let fullDate = "Session Date";
    try {
      const d = new Date(s.date);
      fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const sameDateCount = arr.filter(item => {
        try {
          return new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === shortDate;
        } catch { return false; }
      }).length;

      if (sameDateCount > 1) {
        name = `${shortDate} (${index + 1})`;
      } else {
        name = shortDate;
      }
    } catch (e) {
      name = `S${index + 1}`;
    }

    return {
      ...s,
      name,
      fullDate,
    };
  });

  // 4. Calculate total practice stats
  const totalInterviews = allSessions.length;

  let totalSeconds = 0;
  allSessions.forEach(s => {
    if (s.total_duration_seconds) totalSeconds += Number(s.total_duration_seconds);
    else if (s.duration_seconds) totalSeconds += Number(s.duration_seconds);
    else if (s.duration_minutes) totalSeconds += Number(s.duration_minutes) * 60;
    else if (s.type === 'Peer' && s.status === 'completed') totalSeconds += 1800; // 30 min default
    else totalSeconds += 300; // 5 min fallback
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const practiceTimeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // 5. Dynamic Insights Engine: Biggest Improvement & Needs Attention
  let biggestImprovementLabel = "Mock Practice";
  let biggestImprovementVal = "+0%";
  let needsAttentionLabel = "Technical Reasoning";
  let needsAttentionVal = 0;

  if (scoredSessions.length >= 2) {
    const firstHalf = scoredSessions.slice(0, Math.max(1, Math.floor(scoredSessions.length / 2)));
    const recentHalf = scoredSessions.slice(Math.floor(scoredSessions.length / 2));

    const calcAvg = (sessions: typeof scoredSessions, key: 'confidence' | 'delivery' | 'body' | 'score') => {
      const valid = sessions.map(s => (key === 'score' ? s.score : (typeof s[key] === 'number' ? s[key]! : s.score)));
      return valid.reduce((a, b) => a + b, 0) / valid.length;
    };

    const techImp = calcAvg(recentHalf, 'confidence') - calcAvg(firstHalf, 'confidence');
    const commImp = calcAvg(recentHalf, 'delivery') - calcAvg(firstHalf, 'delivery');
    const bodyImp = calcAvg(recentHalf, 'body') - calcAvg(firstHalf, 'body');
    const overallImp = calcAvg(recentHalf, 'score') - calcAvg(firstHalf, 'score');

    const improvements = [
      { name: "Technical Reasoning", val: techImp },
      { name: "Communication Skills", val: commImp },
      { name: "Presentation & Delivery", val: bodyImp },
      { name: "Overall Performance", val: overallImp },
    ];
    improvements.sort((a, b) => b.val - a.val);

    biggestImprovementLabel = improvements[0].name;
    biggestImprovementVal = `${improvements[0].val >= 0 ? "+" : ""}${Math.round(improvements[0].val)}%`;

    const techAvg = calcAvg(scoredSessions, 'confidence');
    const commAvg = calcAvg(scoredSessions, 'delivery');
    const bodyAvg = calcAvg(scoredSessions, 'body');
    const overallAvg = calcAvg(scoredSessions, 'score');

    const averages = [
      { name: "Technical Reasoning", val: techAvg, route: "/question-practice" },
      { name: "Communication Skills", val: commAvg, route: "/voice-assistant" },
      { name: "Presentation & Delivery", val: bodyAvg, route: "/voice-assistant" },
      { name: "Problem Solving", val: overallAvg, route: "/daily-challenge" },
    ];
    averages.sort((a, b) => a.val - b.val);

    needsAttentionLabel = averages[0].name;
    needsAttentionVal = Math.round(averages[0].val);
  } else if (scoredSessions.length === 1) {
    const session = scoredSessions[0];
    biggestImprovementLabel = "Baseline Established";
    biggestImprovementVal = `${session.score}%`;

    const tech = typeof session.confidence === 'number' ? session.confidence : session.score;
    const comm = typeof session.delivery === 'number' ? session.delivery : session.score;
    const body = typeof session.body === 'number' ? session.body : session.score;

    const scores = [
      { name: "Technical Reasoning", val: tech, route: "/question-practice" },
      { name: "Communication Skills", val: comm, route: "/voice-assistant" },
      { name: "Presentation & Delivery", val: body, route: "/voice-assistant" },
    ];
    scores.sort((a, b) => a.val - b.val);

    needsAttentionLabel = scores[0].name;
    needsAttentionVal = Math.round(scores[0].val);
  } else {
    // 0 scored sessions
    biggestImprovementLabel = "First Practice Session";
    biggestImprovementVal = "Pending";
    needsAttentionLabel = "Initial Evaluation";
    needsAttentionVal = 0;
  }

  // 6. Dynamic CTA route and label based on Needs Attention
  const getCTAButtonDetails = () => {
    if (needsAttentionLabel.includes("Communication") || needsAttentionLabel.includes("Presentation")) {
      return { label: `Improve ${needsAttentionLabel}`, route: "/voice-assistant" };
    }
    if (needsAttentionLabel.includes("Technical")) {
      return { label: "Practice Technical Questions", route: "/question-practice" };
    }
    if (needsAttentionLabel.includes("Problem") || needsAttentionLabel.includes("Solving")) {
      return { label: "Solve Daily Challenge", route: "/daily-challenge" };
    }
    return { label: "Start Practice Interview", route: "/interview/new" };
  };

  const ctaDetails = getCTAButtonDetails();

  return (
    <Card className="border-border/50 bg-card text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground/90">Your Progress Since Day 1</h3>
        {scoredSessions.length > 0 ? (
          <div className="bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className={diffColorClass}>{diffSign}{Math.abs(ptsDifference)} pts</span>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> New Candidate
          </div>
        )}
      </div>

      {/* Overall Score Progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overall Score</span>
          {scoredSessions.length === 1 && (
            <span className="text-[11px] text-violet-400 font-medium">1st Session Baseline</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-foreground/95">{startingScore}%</span>
          <div className="flex-1 h-2 bg-muted rounded-full relative">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, currentScore)}%` }}
            />
            {/* Knob */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)] transition-all duration-500"
              style={{ left: `${Math.max(5, currentScore)}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <span className="text-2xl font-bold text-foreground/95">{currentScore}%</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recent Interviews Trend</div>
        {chartData.length === 0 ? (
          <div className="h-[180px] w-full flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl bg-muted/10 p-4 mt-2 text-center">
            <TrendingUp className="h-8 w-8 text-violet-500/70 mb-2 animate-bounce" />
            <span className="text-xs text-foreground font-semibold">No interview chart data yet</span>
            <span className="text-[11px] text-muted-foreground max-w-[200px] mt-1">
              Complete your first AI mock or question practice to visualize real score trends.
            </span>
            <button
              onClick={() => navigate("/interview/new")}
              className="mt-3 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors shadow-md"
            >
              Start First Interview
            </button>
          </div>
        ) : (
          <div className="h-[180px] w-full mt-2 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
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
                <Tooltip content={<CustomTooltip />} />
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
        {/* Total Sessions Count */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{totalInterviews}</div>
            <div className="text-[11px] text-muted-foreground">sessions completed</div>
          </div>
        </div>

        {/* Practiced Time */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{practiceTimeText}</div>
            <div className="text-[11px] text-muted-foreground">total practice time</div>
          </div>
        </div>
      </div>

      {/* Dynamic Insights Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Biggest Improvement */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 min-h-[100px]">
          <div className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Biggest improvement</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-medium text-foreground/90 line-clamp-1">{biggestImprovementLabel}</div>
            <div className="text-emerald-400 text-sm font-bold mt-0.5 flex items-center gap-1">
              <span>{biggestImprovementVal}</span>
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-300 min-h-[100px]">
          <div className="text-orange-500 text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Needs attention</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-sm font-medium text-foreground/90 truncate">{needsAttentionLabel}</div>
            <div className="text-muted-foreground text-xs flex items-center gap-1.5">
              <span>Score:</span>
              <span className="text-foreground font-semibold">{needsAttentionVal}%</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, needsAttentionVal)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Practice CTA Button */}
      <button
        onClick={() => navigate(ctaDetails.route)}
        className="w-full py-3 px-4 rounded-xl border border-violet-500/40 text-violet-500 dark:text-violet-400 font-semibold text-sm hover:bg-violet-500/10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm"
      >
        <span>{ctaDetails.label}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </Card>
  );
};
