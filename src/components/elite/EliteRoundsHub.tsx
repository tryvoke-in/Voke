import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { CompanyRoleProgress } from '@/utils/eliteInterviewStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2, XCircle, Play, RefreshCw, Award, ShieldCheck, Sparkles, ArrowLeft, Layers, Building, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface EliteRoundsHubProps {
  interviewType: InterviewTypeItem;
  company: CompanyItem;
  role: RoleItem;
  rounds: InterviewRoundDef[];
  progress: CompanyRoleProgress;
  onStartRound: (round: InterviewRoundDef) => void;
  onChangeType: () => void;
  onChangeCompany: () => void;
  onChangeRole: () => void;
}

export const EliteRoundsHub: React.FC<EliteRoundsHubProps> = ({
  interviewType,
  company,
  role,
  rounds,
  progress,
  onStartRound,
  onChangeType,
  onChangeCompany,
  onChangeRole
}) => {
  const navigate = useNavigate();
  const passedCount = progress.rounds.filter(r => r.status === 'passed').length;
  const progressPercent = Math.round((passedCount / rounds.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Quick Switch Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/90 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onChangeType}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Config Studio
          </Button>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-semibold">{company.name}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-400 font-extrabold">{role.title}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onChangeCompany}
          className="border-white/10 bg-zinc-900 text-zinc-300 text-xs rounded-xl hover:bg-zinc-800 font-semibold"
        >
          Change Target Selection
        </Button>
      </div>

      {/* Modern Glass Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/15 p-7 md:p-9 shadow-2xl">
        {/* Ambient Gradient Orbs */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-zinc-900 p-4 shadow-2xl flex items-center justify-center overflow-hidden border border-white/15 shrink-0 ring-1 ring-white/10">
              <img
                src={company.logo}
                alt={company.name}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=18181b&color=fff&size=64`;
                }}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5">
                  {company.tier}
                </Badge>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-black px-2.5 py-0.5">
                  {interviewType.title}
                </Badge>
                <Badge variant="outline" className="border-violet-500/40 bg-violet-500/10 text-violet-300 text-[10px] font-black px-2.5 py-0.5">
                  {role.level}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {company.name} • {role.title}
              </h1>

              <p className="text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed">
                4 sequential interview rounds with 8-9 questions per round. Pass each round to unlock the next stage.
              </p>
            </div>
          </div>

          {/* Progress Circular Meter Card */}
          <div className="w-full md:w-auto bg-zinc-900/90 border border-white/15 rounded-3xl p-6 flex flex-col items-center justify-center min-w-[240px] text-center shadow-2xl ring-1 ring-white/10">
            <div className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Pipeline Progress
            </div>
            <div className="text-3xl font-black text-white my-1">
              {passedCount} / {rounds.length} <span className="text-xs font-semibold text-zinc-400">Rounds</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 mt-3 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-md shadow-amber-400/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Sequential Rounds List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            Interview Rounds Timeline
          </h2>
          <span className="text-xs text-zinc-400 font-mono">Pass to Unlock Next Stage</span>
        </div>

        <div className="space-y-4">
          {rounds.map((roundDef, idx) => {
            const roundProgress = progress.rounds.find(r => r.roundNumber === roundDef.roundNumber) || {
              status: roundDef.roundNumber === 1 ? 'unlocked' : 'locked',
              attempts: 0
            };

            const isPassed = roundProgress.status === 'passed';
            const isFailed = roundProgress.status === 'failed';
            // TEMPORARY TESTING UNLOCK: Unlocking Round 2 directly
            const isUnlocked = roundProgress.status === 'unlocked' || roundDef.roundNumber === 2;
            const isLocked = roundProgress.status === 'locked' && roundDef.roundNumber !== 2;

            return (
              <motion.div
                key={roundDef.roundId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 border rounded-3xl bg-zinc-950/80 backdrop-blur-2xl shadow-2xl ${
                    isPassed
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : isFailed
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : isUnlocked
                      ? 'border-amber-500/50 bg-amber-500/5 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/20'
                      : 'border-white/5 opacity-60 bg-zinc-950/40'
                  }`}
                >
                  <CardContent className="p-6 md:p-7">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                      {/* Left Details */}
                      <div className="flex items-start gap-5 flex-1">
                        <div className="shrink-0 mt-1">
                          {isPassed && (
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                              <CheckCircle2 className="w-7 h-7" />
                            </div>
                          )}
                          {isFailed && (
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                              <XCircle className="w-7 h-7" />
                            </div>
                          )}
                          {isUnlocked && (
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20 animate-pulse">
                              <Play className="w-7 h-7 fill-amber-400" />
                            </div>
                          )}
                          {isLocked && (
                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
                              <Lock className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-wider">
                              Round {roundDef.roundNumber}
                            </span>
                            {isPassed && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] py-0.5">
                                PASSED {roundProgress.score ? `(${roundProgress.score}%)` : ''}
                              </Badge>
                            )}
                            {isFailed && (
                              <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-[10px] py-0.5">
                                FAILED (Attempt {roundProgress.attempts})
                              </Badge>
                            )}
                            {isUnlocked && (
                              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-[10px] py-0.5 animate-pulse">
                                READY TO ATTEMPT
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px]">
                                LOCKED
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                            {roundDef.title}
                          </h3>

                          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                            {roundDef.description}
                          </p>

                          {/* Focus chips */}
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {roundDef.focusAreas.map((area, aIdx) => (
                              <span key={aIdx} className="px-3 py-1 rounded-xl text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-white/10">
                                {area}
                              </span>
                            ))}
                          </div>

                          {/* Persistent Post-Round AI Feedback Report */}
                          {(isPassed || isFailed) && (
                            <div className="mt-4 p-4 rounded-2xl bg-zinc-900/90 border border-white/15 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-amber-400" />
                                  AI Round Performance & Feedback Report
                                </span>
                                {roundProgress.score && (
                                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                                    isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    Score: {roundProgress.score}%
                                  </span>
                                )}
                              </div>

                              {roundProgress.feedback && (
                                <p className="text-xs text-zinc-300 italic leading-relaxed bg-zinc-950/70 p-3 rounded-xl border border-white/10">
                                  "{roundProgress.feedback}"
                                </p>
                              )}

                              {roundProgress.feedbackDetails && (
                                <div className="space-y-3 pt-1">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/10 text-center">
                                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Communication</div>
                                      <div className="text-xs font-black text-violet-300 mt-0.5">{roundProgress.feedbackDetails.communicationScore}%</div>
                                    </div>
                                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/10 text-center">
                                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Confidence</div>
                                      <div className="text-xs font-black text-amber-300 mt-0.5">{roundProgress.feedbackDetails.confidenceScore}%</div>
                                    </div>
                                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/10 text-center">
                                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Technical Depth</div>
                                      <div className="text-xs font-black text-emerald-300 mt-0.5">{roundProgress.feedbackDetails.technicalScore}%</div>
                                    </div>
                                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/10 text-center">
                                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Authenticity</div>
                                      <div className="text-xs font-black text-sky-300 mt-0.5">{roundProgress.feedbackDetails.resumeAuthenticityScore}%</div>
                                    </div>
                                  </div>

                                  {roundProgress.feedbackDetails.strengths && roundProgress.feedbackDetails.strengths.length > 0 && (
                                    <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl space-y-1 text-left">
                                      <div className="text-[10px] font-extrabold text-emerald-400 uppercase">Key Strengths</div>
                                      <ul className="space-y-1">
                                        {roundProgress.feedbackDetails.strengths.map((str, sIdx) => (
                                          <li key={sIdx} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                                            <span className="text-emerald-400 font-bold">•</span> {str}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {roundProgress.feedbackDetails.improvements && roundProgress.feedbackDetails.improvements.length > 0 && (
                                    <div className="bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl space-y-1 text-left">
                                      <div className="text-[10px] font-extrabold text-amber-400 uppercase">Areas for Improvement</div>
                                      <ul className="space-y-1">
                                        {roundProgress.feedbackDetails.improvements.map((imp, iIdx) => (
                                          <li key={iIdx} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                                            <span className="text-amber-400 font-bold">•</span> {imp}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2 shrink-0">
                        <div className="text-right text-xs font-mono font-bold text-zinc-400 mb-1 hidden md:block">
                          {roundDef.questionCount} Questions • ~{roundDef.durationMins}m
                        </div>

                        {isUnlocked && (
                          <Button
                            size="lg"
                            onClick={() => onStartRound(roundDef)}
                            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm px-7 h-12 rounded-2xl shadow-2xl shadow-amber-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all"
                          >
                            <Play className="w-4 h-4 mr-2 fill-current" />
                            Start Round {roundDef.roundNumber}
                          </Button>
                        )}

                        {isFailed && (
                          <Button
                            size="lg"
                            onClick={() => onStartRound(roundDef)}
                            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm px-7 h-12 rounded-2xl shadow-2xl shadow-rose-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-give Round {roundDef.roundNumber} Interview
                          </Button>
                        )}

                        {(isPassed || isFailed) && roundProgress?.sessionId && (
                          <Button
                            size="lg"
                            onClick={() => navigate(`/voice-interview/results/${roundProgress.sessionId}?from=elite`)}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm px-7 h-12 rounded-2xl shadow-xl shadow-purple-600/25 hover:scale-[1.03] active:scale-[0.97] transition-all"
                          >
                            <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                            View Score & Analysis
                          </Button>
                        )}

                        {isPassed && (
                          <Button
                            size="lg"
                            onClick={() => onStartRound(roundDef)}
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-black text-sm px-7 h-12 rounded-2xl"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retake Round {roundDef.roundNumber}
                          </Button>
                        )}

                        {isLocked && (
                          <Button
                            size="lg"
                            disabled
                            variant="outline"
                            className="border-white/10 bg-white/5 text-zinc-500 font-semibold text-sm px-7 h-12 rounded-2xl cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Pass Round {roundDef.roundNumber - 1} First
                          </Button>
                        )}
                      </div>

                    </div>
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
