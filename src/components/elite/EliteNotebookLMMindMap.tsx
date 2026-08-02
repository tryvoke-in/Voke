import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INTERVIEW_TYPES, ELITE_ROLES, TOP_COMPANIES,
  InterviewTypeItem, RoleItem, CompanyItem, InterviewRoundDef, getInterviewRounds
} from '@/data/eliteInterviewData';
import { CompanyRoleProgress, computeFinalRecommendation } from '@/utils/eliteInterviewStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus, Minus, Maximize2, RefreshCw, Lock, Play, CheckCircle2, XCircle,
  Sparkles, ChevronRight, Zap, GraduationCap, Building, Code, ShieldCheck, ZoomIn, ZoomOut, Briefcase, Award, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EliteNotebookLMMindMapProps {
  selectedType: InterviewTypeItem | null;
  selectedCompany: CompanyItem | null;
  selectedRole: RoleItem | null;
  rounds: InterviewRoundDef[];
  progress: CompanyRoleProgress | null;
  onSelectType: (type: InterviewTypeItem) => void;
  onSelectCompany: (company: CompanyItem) => void;
  onSelectRole: (role: RoleItem) => void;
  onStartRound: (round: InterviewRoundDef) => void;
  onResetSelection: () => void;
  onNavigateDashboard: () => void;
}

const TRACK_ICONS: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-5 h-5 text-amber-300" />,
  Briefcase: <Briefcase className="w-5 h-5 text-indigo-300" />,
  Award: <Award className="w-5 h-5 text-emerald-300" />
};

export const EliteNotebookLMMindMap: React.FC<EliteNotebookLMMindMapProps> = ({
  selectedType,
  selectedCompany,
  selectedRole,
  rounds,
  progress,
  onSelectType,
  onSelectCompany,
  onSelectRole,
  onStartRound,
  onResetSelection,
  onNavigateDashboard
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Zoom & Scale control (Defaults to 1.0 = 100% on initial load)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1.0);

  // Dynamic Camera Auto-Focus & Smooth Scroll when user completes a step
  useEffect(() => {
    if (!canvasRef.current) return;

    if (selectedType && selectedCompany && selectedRole) {
      canvasRef.current.scrollTo({ left: 1050, behavior: 'smooth' });
    } else if (selectedType && selectedCompany) {
      canvasRef.current.scrollTo({ left: 550, behavior: 'smooth' });
    } else if (selectedType) {
      canvasRef.current.scrollTo({ left: 220, behavior: 'smooth' });
    } else {
      canvasRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedType, selectedCompany, selectedRole]);

  const passedCount = progress?.rounds.filter(r => r.status === 'passed').length || 0;

  return (
    <div className="h-screen w-screen bg-[#080B11] text-slate-100 flex flex-col overflow-hidden relative font-sans select-none">
      
      {/* ANIMATED AMBIENT GLOW BACKGROUND ORBS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-blue-500/10 to-transparent rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-violet-600/10 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Subtle Dots Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />
      </div>

      {/* FLOATING TOP OVERLAY CONTROLS (VOKE ELITE LOGO ONLY ON LEFT) */}
      <div className="absolute top-5 left-0 right-0 z-20 px-6 flex items-center justify-between pointer-events-none">
        
        {/* Left Corner: Official Voke Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={onNavigateDashboard}>
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <span className="font-extrabold text-xl bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Voke Elite
            </span>
          </div>
        </div>

        {/* Right Corner: Controls, Start Over & Dashboard Link */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Zoom Slider */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 px-3 py-1.5 rounded-full text-xs shadow-xl">
            <ZoomOut className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-200" onClick={handleZoomOut} />
            <input
              type="range"
              min="0.5"
              max="1.25"
              step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20 accent-indigo-400 cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-200" onClick={handleZoomIn} />
            <span className="font-mono text-[10px] text-indigo-400 font-bold ml-1">{Math.round(zoomLevel * 100)}%</span>
          </div>

          {(selectedType || selectedCompany || selectedRole) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetSelection}
              className="border-slate-800 bg-slate-900/80 backdrop-blur-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs rounded-full h-9 font-extrabold shadow-xl"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Start Over
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateDashboard}
            className="border-slate-800 bg-slate-900/80 backdrop-blur-xl text-slate-300 hover:text-white hover:bg-slate-800 rounded-full text-xs font-bold h-9 shadow-xl"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Dashboard
          </Button>
        </div>
      </div>

      {/* CANVAS WORKSPACE AREA WITH NOTEBOOKLM FLOATING TOOLBAR */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto p-8 flex items-center justify-start min-h-0 z-10 scroll-smooth pt-20"
      >
        
        {/* NOTEBOOKLM FLOATING LEFT CANVAS CONTROLS */}
        <div className="fixed left-6 top-24 z-30 flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/60 backdrop-blur-2xl shadow-2xl">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800" />
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* HORIZONTAL MIND MAP NODE TREE CONTAINER WITH ANIMATED CONNECTORS */}
        <div
          className="transition-all duration-500 origin-left flex items-center gap-10 md:gap-14 py-8 px-8 min-w-max"
          style={{ transform: `scale(${zoomLevel})` }}
        >

          {/* ================= LEVEL 0: INTERVIEW TRACK SELECTION NODES (STEP 1) ================= */}
          <div className="flex flex-col gap-3.5 shrink-0 z-10">
            <div className="text-[11px] font-mono font-extrabold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Step 1 • Pick Track Level
            </div>

            {INTERVIEW_TYPES.map((typeItem) => {
              const isSelected = selectedType?.id === typeItem.id;
              const isActive = typeItem.active;

              return (
                <motion.div
                  key={typeItem.id}
                  whileHover={isActive ? { scale: 1.03 } : {}}
                  onClick={() => isActive && onSelectType(typeItem)}
                  className={`p-4 rounded-3xl border flex items-center gap-3.5 transition-all duration-300 min-w-[230px] shadow-2xl backdrop-blur-2xl ${
                    isActive ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950/40'
                  } ${
                    isSelected
                      ? 'border-amber-500/80 bg-gradient-to-r from-amber-500/20 to-slate-900 text-white ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/10 scale-[1.03]'
                      : isActive
                      ? 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-850'
                      : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    {TRACK_ICONS[typeItem.iconName] || <GraduationCap className="w-5 h-5 text-amber-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-xs text-slate-100 truncate">{typeItem.title}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {isActive ? (typeItem.badge || 'ACTIVE TRACK') : 'Unlocks Soon'}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-amber-400 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-30'}`} />
                </motion.div>
              );
            })}
          </div>

          {/* ================= LEVEL 1: COMPANY NODES (UNFOLDS ONLY WHEN TRACK IS SELECTED) ================= */}
          <AnimatePresence>
            {selectedType && (
              <>
                {/* CONNECTOR CURVED LINES LEVEL 0 -> LEVEL 1 */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  className="w-14 md:w-16 h-64 relative shrink-0 origin-left"
                >
                  <svg className="w-full h-full overflow-visible">
                    <path d="M 0 50 C 30 50, 20 20, 56 20" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" strokeDasharray="4 4" />
                    <path d="M 0 50 C 30 50, 20 74, 56 74" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" strokeDasharray="4 4" />
                    <path d="M 0 50 C 30 50, 20 128, 56 128" fill="none" stroke="rgba(245, 158, 11, 0.9)" strokeWidth="3.5" />
                    <path d="M 0 50 C 30 50, 20 182, 56 182" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" strokeDasharray="4 4" />
                    <path d="M 0 50 C 30 50, 20 236, 56 236" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" strokeDasharray="4 4" />
                  </svg>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col gap-3 shrink-0 z-10"
                >
                  <div className="text-[11px] font-mono font-extrabold text-indigo-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> Step 2 • Pick Target Company
                  </div>

                  {TOP_COMPANIES.slice(0, 5).map((company) => {
                    const isSelected = selectedCompany?.id === company.id;
                    return (
                      <motion.div
                        key={company.id}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => onSelectCompany(company)}
                        className={`px-4 py-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all duration-300 min-w-[220px] shadow-xl backdrop-blur-2xl ${
                          isSelected
                            ? 'border-indigo-500/80 bg-gradient-to-r from-indigo-600/20 to-slate-900 text-white ring-2 ring-indigo-500/40 shadow-indigo-500/20 scale-[1.03]'
                            : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-slate-850'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md shrink-0 border border-gray-200 overflow-hidden">
                          <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-xs text-slate-100 truncate">{company.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono font-semibold">{company.tier}</div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-indigo-400 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-30'}`} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ================= LEVEL 2: ROLE NODES (UNFOLDS ONLY WHEN COMPANY IS SELECTED) ================= */}
          <AnimatePresence>
            {selectedType && selectedCompany && (
              <>
                {/* CONNECTOR CURVED LINES LEVEL 1 -> LEVEL 2 */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  className="w-14 md:w-16 h-56 relative shrink-0 origin-left"
                >
                  <svg className="w-full h-full overflow-visible">
                    <path d="M 0 110 C 30 110, 20 30, 56 30" fill="none" stroke="rgba(99, 102, 241, 0.7)" strokeWidth="3" />
                    <path d="M 0 110 C 30 110, 20 110, 56 110" fill="none" stroke="rgba(99, 102, 241, 0.9)" strokeWidth="3.5" />
                    <path d="M 0 110 C 30 110, 20 190, 56 190" fill="none" stroke="rgba(99, 102, 241, 0.7)" strokeWidth="3" />
                  </svg>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col gap-3.5 shrink-0 z-10"
                >
                  <div className="text-[11px] font-mono font-extrabold text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> Step 3 • Pick Role for {selectedCompany.name}
                  </div>

                  {ELITE_ROLES.map((role) => {
                    const isSelected = selectedRole?.id === role.id;

                    return (
                      <motion.div
                        key={role.id}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => onSelectRole(role)}
                        className={`px-4 py-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all duration-300 min-w-[230px] shadow-xl backdrop-blur-2xl ${
                          isSelected
                            ? 'border-emerald-500/80 bg-gradient-to-r from-emerald-600/20 to-slate-900 text-white ring-2 ring-emerald-500/40 shadow-emerald-500/20 scale-[1.03]'
                            : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-slate-850'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <Code className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-xs text-slate-100 truncate">{role.title}</div>
                          <div className="text-[9px] text-emerald-400 font-mono font-semibold">Select Role</div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-30'}`} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ================= LEVEL 3: 4-STAGE PIPELINE NODES (UNFOLDS ONLY WHEN ROLE IS SELECTED) ================= */}
          <AnimatePresence>
            {selectedType && selectedCompany && selectedRole && (
              <>
                {/* CONNECTOR CURVED LINES LEVEL 2 -> LEVEL 3 */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  className="w-14 md:w-16 h-72 relative shrink-0 origin-left"
                >
                  <svg className="w-full h-full overflow-visible">
                    <path d="M 0 144 C 30 144, 20 24, 56 24" fill="none" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="3" />
                    <path d="M 0 144 C 30 144, 20 96, 56 96" fill="none" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="3" />
                    <path d="M 0 144 C 30 144, 20 168, 56 168" fill="none" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="3" />
                    <path d="M 0 144 C 30 144, 20 240, 56 240" fill="none" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="3" />
                  </svg>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col gap-3.5 shrink-0 z-10 min-w-[300px] md:min-w-[340px]"
                >
                  <div className="text-[11px] font-mono font-extrabold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Step 4 • {selectedCompany.name} Pipeline ({passedCount}/4 Cleared)
                  </div>

                  {rounds.map((roundDef) => {
                    const roundProgress = progress?.rounds.find(r => r.roundNumber === roundDef.roundNumber) || {
                      status: roundDef.roundNumber === 1 ? 'unlocked' : 'locked',
                      attempts: 0
                    };

                    const isPassed = roundProgress.status === 'passed';
                    const isFailed = roundProgress.status === 'failed';
                    const isUnlocked = roundProgress.status === 'unlocked';
                    const isLocked = roundProgress.status === 'locked';

                    return (
                      <div
                        key={roundDef.roundId}
                        className={`p-4 rounded-3xl border transition-all duration-300 shadow-2xl space-y-2.5 backdrop-blur-2xl ${
                          isPassed
                            ? 'border-emerald-500/50 bg-emerald-950/20'
                            : isFailed
                            ? 'border-rose-500/50 bg-rose-950/20'
                            : isUnlocked
                            ? 'border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/30'
                            : 'border-slate-800 opacity-50 bg-slate-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-extrabold text-slate-400">
                            Round {roundDef.roundNumber} of 4
                          </span>
                          {isPassed && <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold">PASSED</Badge>}
                          {isFailed && <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-extrabold">FAILED</Badge>}
                          {isUnlocked && <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold animate-pulse">READY</Badge>}
                          {isLocked && <Badge variant="outline" className="border-slate-800 text-slate-500 text-[9px]">LOCKED</Badge>}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-xs text-slate-100">{roundDef.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{roundDef.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono font-bold">{roundDef.questionCount} Questions</span>

                          <div className="flex items-center gap-2">
                            {(isPassed || isFailed) && roundProgress?.sessionId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/voice-interview/results/${roundProgress.sessionId}?from=elite`)}
                                className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 text-xs h-8 rounded-xl px-2.5"
                              >
                                <Sparkles className="w-3 h-3 mr-1 text-violet-400" /> View Analysis
                              </Button>
                            )}

                            {isUnlocked && (
                              <Button
                                size="sm"
                                onClick={() => onStartRound(roundDef)}
                                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs h-8 rounded-xl px-3.5 shadow-lg shadow-amber-500/20"
                              >
                                <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Start Interview
                              </Button>
                            )}

                            {isFailed && (
                              <Button
                                size="sm"
                                onClick={() => onStartRound(roundDef)}
                                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs h-8 rounded-xl px-3.5 shadow-lg shadow-rose-500/20"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-give Round
                              </Button>
                            )}

                            {isPassed && (
                              <Button
                                size="sm"
                                onClick={() => onStartRound(roundDef)}
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-300 text-xs h-8 rounded-xl px-3.5"
                              >
                                Retake
                              </Button>
                            )}

                            {isLocked && (
                              <Button size="sm" disabled variant="outline" className="border-slate-800 text-slate-500 text-xs h-8 rounded-xl px-3.5 cursor-not-allowed">
                                <Lock className="w-3.5 h-3.5 mr-1" /> Locked
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* FINAL RECOMMENDATION SUMMARY CARD (Unfolds when rounds are attempted or completed) */}
                  {progress && progress.rounds.some(r => r.status === 'passed' || r.status === 'failed') && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 backdrop-blur-2xl shadow-2xl space-y-3 mt-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black text-white">Final Recommendation</span>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                          Weighted Engine
                        </Badge>
                      </div>

                      {/* Score Summary & Decision */}
                      {(() => {
                        const rec = computeFinalRecommendation(progress);
                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-2xl border border-white/5">
                              <div>
                                <div className="text-[9px] text-slate-400 uppercase font-bold">Overall Score</div>
                                <div className="text-lg font-black text-amber-300">{rec.overallScore}%</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-slate-400 uppercase font-bold">Hiring Verdict</div>
                                <div className={`text-xs font-black px-2 py-0.5 rounded-lg border ${rec.decisionBadgeColor}`}>
                                  {rec.decision}
                                </div>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-300 leading-relaxed italic">
                              "{rec.decisionDescription}"
                            </p>

                            <div className="text-[9px] text-slate-400 font-mono flex justify-between border-t border-white/5 pt-2">
                              <span>Weights: R1 20% • R2 35% • R3 35% • R4 10%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};
