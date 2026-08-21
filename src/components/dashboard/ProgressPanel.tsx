import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { FileText, Clock, TrendingUp, ArrowRight, Zap, Target, AlertCircle, CheckCircle2, Sparkles, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 4. Calculate total practice stats dynamically
  const totalInterviews = allSessions.length;

  let totalSeconds = 0;
  allSessions.forEach(s => {
    if (s.total_duration_seconds && Number(s.total_duration_seconds) > 0) {
      totalSeconds += Number(s.total_duration_seconds);
    } else if (s.duration_seconds && Number(s.duration_seconds) > 0) {
      totalSeconds += Number(s.duration_seconds);
    } else if (s.duration_minutes && Number(s.duration_minutes) > 0) {
      totalSeconds += Number(s.duration_minutes) * 60;
    } else if (s.completed_at && s.created_at) {
      const diff = (new Date(s.completed_at).getTime() - new Date(s.created_at).getTime()) / 1000;
      if (diff > 0 && diff < 14400) totalSeconds += diff;
    }
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

  return (
    <Card className={`border-border/50 bg-card text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl p-5 flex flex-col justify-between space-y-3.5 ${
      !isExpanded ? "min-h-[382px]" : ""
    }`}>
      {/* Overall Score Progression */}
      <div id="tour-overall-score" className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overall Score</span>
          {ptsDifference !== 0 && (
            <span className={`text-xs font-bold ${ptsDifference > 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {ptsDifference > 0 ? `+${ptsDifference}%` : `${ptsDifference}%`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground/95 min-w-[56px]">{currentScore}%</span>
          <div className="flex-1 h-2.5 bg-muted/60 rounded-full relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              style={{ width: `${Math.max(2, currentScore)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recent Interviews Trend</div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-[160px] w-full flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl bg-muted/10 p-4 mt-1 text-center">
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
          <div className="h-[160px] w-full mt-1 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 15, left: 0, bottom: 5 }}>
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
                  stroke="#2ee696ff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#000', stroke: '#2ee696ff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#000', stroke: '#2ee696ff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Collapsible Stats & Insights (Expands smoothly above the Details button) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden space-y-4"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Total Sessions Count */}
              <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
                <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{totalInterviews}</div>
                  <div className="text-[11px] text-muted-foreground">Interviews</div>
                </div>
              </div>

              {/* Practiced Time */}
              <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:border-violet-500/30 transition-all duration-300">
                <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{practiceTimeText}</div>
                  <div className="text-[11px] text-muted-foreground">Time Practiced</div>
                </div>
              </div>
            </div>

            {/* Dynamic Insights Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Biggest Improvement */}
              <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col hover:border-emerald-500/30 transition-all duration-300 min-h-[100px]">
                <div className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Biggest improvement</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-foreground/90 line-clamp-1">{biggestImprovementLabel}</div>
                </div>
              </div>

              {/* Needs Attention */}
              <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col hover:border-orange-500/30 transition-all duration-300 min-h-[100px]">
                <div className="text-orange-500 text-xs font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Needs attention</span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="text-sm font-medium text-foreground/90 truncate">{needsAttentionLabel}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Button (Placed at the bottom) */}
      <button
        id="tour-view-details-btn"
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full py-3 px-4 rounded-xl border border-blue-500/40 text-blue-500 dark:text-blue-400 font-semibold text-sm hover:bg-blue-500/10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm"
      >
        <span>{isExpanded ? "Hide Details" : "View Details"}</span>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
    </Card>
  );
};
