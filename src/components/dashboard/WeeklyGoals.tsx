import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Flame, Target, Mic, Users, FileText, Code, CheckCircle2, 
  Circle, Plus, Trash2, CheckSquare, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GoalItem {
  id: string;
  text: string;
  category: "coding" | "voice" | "peer" | "resume";
  current: number;
  target: number;
  completed: boolean;
}

const DEFAULT_GOALS: GoalItem[] = [
  { id: "goal-1", text: "Solve 5 coding questions", category: "coding", current: 3, target: 5, completed: false },
  { id: "goal-2", text: "Complete 1 AI Voice mock interview", category: "voice", current: 0, target: 1, completed: false },
  { id: "goal-3", text: "Conduct 1 Peer Match session", category: "peer", current: 1, target: 1, completed: true },
  { id: "goal-4", text: "Optimize resume match score", category: "resume", current: 1, target: 1, completed: true },
  { id: "goal-5", text: "Complete 1 Daily Coding Challenge", category: "coding", current: 0, target: 1, completed: false }
];

export const WeeklyGoals = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<"coding" | "voice" | "peer" | "resume">("coding");

  // Load from local storage or default
  useEffect(() => {
    const saved = localStorage.getItem("voke_weekly_goals");
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        setGoals(DEFAULT_GOALS);
      }
    } else {
      setGoals(DEFAULT_GOALS);
    }
  }, []);

  // Save to local storage
  const saveGoals = (updatedGoals: GoalItem[]) => {
    setGoals(updatedGoals);
    localStorage.setItem("voke_weekly_goals", JSON.stringify(updatedGoals));
  };

  const toggleGoal = (id: string) => {
    const updated = goals.map(g => {
      if (g.id === id) {
        const nextCompleted = !g.completed;
        return {
          ...g,
          completed: nextCompleted,
          current: nextCompleted ? g.target : 0
        };
      }
      return g;
    });
    saveGoals(updated);
  };

  const incrementGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = goals.map(g => {
      if (g.id === id && g.current < g.target) {
        const nextCurrent = g.current + 1;
        return {
          ...g,
          current: nextCurrent,
          completed: nextCurrent === g.target
        };
      }
      return g;
    });
    saveGoals(updated);
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal: GoalItem = {
      id: `goal-${Date.now()}`,
      text: newGoalText.trim(),
      category: newGoalCategory,
      current: 0,
      target: newGoalCategory === "coding" ? 5 : 1,
      completed: false
    };

    saveGoals([...goals, newGoal]);
    setNewGoalText("");
  };

  const deleteGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = goals.filter(g => g.id !== id);
    saveGoals(updated);
  };

  const resetWeekly = () => {
    saveGoals(DEFAULT_GOALS);
  };

  const completedCount = goals.filter(g => g.completed).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case "coding":
        return { icon: Code, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
      case "voice":
        return { icon: Mic, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
      case "peer":
        return { icon: Users, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
      case "resume":
        return { icon: FileText, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" };
      default:
        return { icon: Target, color: "text-gray-500 bg-gray-500/10 border-gray-500/20" };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900/50 dark:bg-gradient-to-br dark:from-indigo-950/50 dark:to-purple-950/20 backdrop-blur-xl border-gray-100 dark:border-white/5 overflow-hidden relative group">
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Target className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                Weekly Target Tracker
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Track and build consistency for coding mocks and matching
              </CardDescription>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetWeekly}
              className="text-xs h-8 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Reset Targets
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Consistency Streak & Progress Summary */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Weekly Progress
                </span>
                <span className="text-violet-600 dark:text-violet-400">
                  {completedCount} / {totalCount} completed ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-gray-200 dark:bg-white/10" />
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-2.5 rounded-lg shadow-sm">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Activity Streak</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">7 Days Consistency</div>
              </div>
            </div>
          </div>

          {/* Goal List */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {goals.map((goal) => {
                const Cat = getCategoryDetails(goal.category);
                const IconComponent = Cat.icon;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                      goal.completed
                        ? "bg-emerald-500/5 border-emerald-500/20 text-gray-500 dark:text-gray-400 line-through"
                        : "bg-white dark:bg-[#0f111a]/45 border-gray-100 dark:border-white/5 hover:border-violet-500/30 hover:bg-gray-50/50 dark:hover:bg-white/5 text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Check Circle */}
                      <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {goal.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-violet-500" />
                        )}
                      </div>

                      {/* Icon Prefix */}
                      <div className={`p-1.5 rounded-lg border shrink-0 ${Cat.color}`}>
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>

                      {/* Text */}
                      <span className="text-sm font-medium leading-none truncate pr-2">
                        {goal.text}
                      </span>
                    </div>

                    {/* Progress Control and Delete Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      {!goal.completed && goal.target > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => incrementGoal(goal.id, e)}
                          className="h-7 w-7 text-[10px] font-bold border border-violet-500/20 text-violet-500 hover:bg-violet-500/10 hover:text-violet-600 rounded-md"
                          title="Increment Progress"
                        >
                          {goal.current}/{goal.target}
                        </Button>
                      )}
                      
                      {goal.completed && (
                        <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                          Done
                        </span>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => deleteGoal(goal.id, e)}
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Add Goal Form */}
          <form onSubmit={addGoal} className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <input
              type="text"
              placeholder="Add a custom target..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              className="flex-1 h-9 px-3 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500/50"
            />
            
            <div className="flex gap-2">
              <select
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value as any)}
                className="h-9 px-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
              >
                <option value="coding" className="dark:bg-[#1a1a23]">Coding</option>
                <option value="voice" className="dark:bg-[#1a1a23]">AI Voice</option>
                <option value="peer" className="dark:bg-[#1a1a23]">Peer Match</option>
                <option value="resume" className="dark:bg-[#1a1a23]">Resume</option>
              </select>

              <Button type="submit" size="sm" className="h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium gap-1 rounded-lg">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>
    </motion.div>
  );
};
