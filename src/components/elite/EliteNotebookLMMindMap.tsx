import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  INTERVIEW_TYPES, ELITE_ROLES, TOP_COMPANIES, DIFFICULTY_LEVELS,
  InterviewTypeItem, RoleItem, CompanyItem, DifficultyItem, InterviewRoundDef, getInterviewRounds
} from '@/data/eliteInterviewData';
import { CompanyRoleProgress, computeFinalRecommendation } from '@/utils/eliteInterviewStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus, Minus, Maximize2, RefreshCw, RotateCcw, Lock, Play, CheckCircle2, XCircle, HelpCircle,
  Target, FileText, ChevronRight, Zap, GraduationCap, Building, Code, ShieldCheck, ZoomIn, ZoomOut, Briefcase, Award, LogOut,
  Flame, Sliders, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EliteNotebookLMMindMapProps {
  selectedType: InterviewTypeItem | null;
  selectedCompany: CompanyItem | null;
  selectedRole: RoleItem | null;
  selectedDifficulty: DifficultyItem | null;
  rounds: InterviewRoundDef[];
  progress: CompanyRoleProgress | null;
  onSelectType: (type: InterviewTypeItem) => void;
  onSelectCompany: (company: CompanyItem) => void;
  onSelectRole: (role: RoleItem) => void;
  onSelectDifficulty: (difficulty: DifficultyItem) => void;
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
  selectedDifficulty,
  rounds,
  progress,
  onSelectType,
  onSelectCompany,
  onSelectRole,
  onSelectDifficulty,
  onStartRound,
  onResetSelection,
  onNavigateDashboard
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Zoom & Scale control (Defaults to 1.0 = 100% on initial load)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('voke_dev_unlock_all_rounds') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleDevUnlockChange = () => {
      try {
        setIsDevUnlocked(localStorage.getItem('voke_dev_unlock_all_rounds') === 'true');
      } catch {}
    };
    window.addEventListener('voke-dev-unlock-change', handleDevUnlockChange);
    window.addEventListener('storage', handleDevUnlockChange);
    return () => {
      window.removeEventListener('voke-dev-unlock-change', handleDevUnlockChange);
      window.removeEventListener('storage', handleDevUnlockChange);
    };
  }, []);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1.0);

  // Click & Drag Canvas Pan Navigation
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('.cursor-pointer')) return;

    if (!canvasRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !canvasRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    canvasRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    canvasRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  // Trackpad & Mouse Wheel Horizontal / Vertical Scrolling Listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // If user scrolls horizontally or holds shift
      if (Math.abs(e.deltaX) > 0) {
        canvas.scrollLeft += e.deltaX;
      } else if (e.shiftKey) {
        canvas.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Auto-scroll canvas right to reveal newly opened stages smoothly
  useEffect(() => {
    if ((selectedRole || selectedDifficulty) && canvasRef.current) {
      const timer = setTimeout(() => {
        canvasRef.current?.scrollTo({
          left: canvasRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [selectedRole?.id, selectedDifficulty?.id]);

  const passedCount = progress?.rounds.filter(r => r.status === 'passed').length || 0;

  return (
    <div className="h-screen w-screen bg-[#090D16] text-slate-100 flex flex-col overflow-hidden relative font-sans select-none">
      
      {/* CLEAN SUBTLE DOTS GRID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
      </div>

      {/* FLOATING TOP OVERLAY CONTROLS (VOKE ELITE LOGO ONLY ON LEFT) */}
      <div className="absolute top-5 left-0 right-0 z-20 px-6 flex items-center justify-between pointer-events-none">
        
        {/* Left Corner: Official Voke Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onNavigateDashboard}>
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg text-white tracking-tight">
              Voke Elite
            </span>
          </div>
        </div>

        {/* Right Corner: Controls, Start Over & Dashboard Link */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Zoom Slider */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full text-xs shadow-sm">
            <ZoomOut className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-200" onClick={handleZoomOut} />
            <input
              type="range"
              min="0.5"
              max="1.25"
              step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20 accent-slate-400 cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-200" onClick={handleZoomIn} />
            <span className="font-mono text-[10px] text-slate-400 font-bold ml-1">{Math.round(zoomLevel * 100)}%</span>
          </div>

          {(selectedType || selectedCompany || selectedRole || selectedDifficulty) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetSelection}
              className="border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 text-xs rounded-full h-8 font-semibold shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Start Over
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateDashboard}
            className="border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full text-xs font-semibold h-8 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Dashboard
          </Button>
        </div>
      </div>

      {/* CANVAS WORKSPACE AREA WITH NOTEBOOKLM FLOATING TOOLBAR */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex-1 relative overflow-auto z-10 pt-24 pb-36 px-10 min-h-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        
        {/* NOTEBOOKLM FLOATING LEFT CANVAS CONTROLS */}
        <div className="fixed left-6 top-24 z-30 flex flex-col gap-2 p-1.5 rounded-xl bg-slate-900/95 border border-slate-800 shadow-sm">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Zoom Out (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800" />
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* HORIZONTAL MIND MAP NODE TREE CONTAINER WITH CONNECTORS */}
        <div
          className="origin-left inline-flex items-start gap-10 md:gap-14 py-6 min-w-max"
          style={{ transform: `scale(${zoomLevel})` }}
        >

          {/* LEFT STAGES CONTAINER (STEP 1, STEP 2, STEP 3) */}
          <div className="inline-flex items-center gap-10 md:gap-14 shrink-0 min-h-[calc(100vh-200px)] self-start">

            {/* ================= LEVEL 0: INTERVIEW TRACK SELECTION NODES (STEP 1) ================= */}
            <div className="flex flex-col gap-3 shrink-0 z-10">
              <div className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Step 1 • Pick Track Level
              </div>

              {INTERVIEW_TYPES.map((typeItem) => {
                const isSelected = selectedType?.id === typeItem.id;
                const isActive = typeItem.active;

                return (
                  <motion.div
                    key={typeItem.id}
                    whileHover={isActive ? { scale: 1.01 } : {}}
                    onClick={() => isActive && onSelectType(typeItem)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors duration-150 min-w-[230px] ${
                      isActive ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed border-slate-800/60 bg-slate-950/40'
                    } ${
                      isSelected
                        ? 'border-amber-500 bg-slate-900 text-white shadow-sm'
                        : isActive
                        ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900'
                        : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        : 'bg-slate-800/80 border border-slate-700/60 text-slate-400'
                    }`}>
                      {TRACK_ICONS[typeItem.iconName] || <GraduationCap className="w-4 h-4 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-100 truncate">{typeItem.title}</div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        {isActive ? (typeItem.badge || 'ACTIVE TRACK') : 'Unlocks Soon'}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100 text-amber-400' : 'text-slate-600 opacity-40'}`} />
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
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-14 md:w-16 h-64 relative shrink-0 origin-left"
                  >
                    <svg className="w-full h-full overflow-visible">
                      <path d="M 0 50 C 30 50, 20 20, 56 20" fill="none" stroke="#232B3B" strokeWidth="1.5" />
                      <path d="M 0 50 C 30 50, 20 74, 56 74" fill="none" stroke="#232B3B" strokeWidth="1.5" />
                      <path d="M 0 50 C 30 50, 20 128, 56 128" fill="none" stroke="#3E4C66" strokeWidth="1.5" />
                      <path d="M 0 50 C 30 50, 20 182, 56 182" fill="none" stroke="#232B3B" strokeWidth="1.5" />
                      <path d="M 0 50 C 30 50, 20 236, 56 236" fill="none" stroke="#232B3B" strokeWidth="1.5" />
                    </svg>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-3 shrink-0 z-10"
                  >
                    <div className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> Step 2 • Pick Target Company
                    </div>

                    {TOP_COMPANIES.slice(0, 5).map((company) => {
                      const isSelected = selectedCompany?.id === company.id;
                      return (
                        <motion.div
                          key={company.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => onSelectCompany(company)}
                          className={`px-3.5 py-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors duration-150 min-w-[220px] ${
                            isSelected
                              ? 'border-indigo-500 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-white p-1 shrink-0 border border-slate-700 overflow-hidden">
                            <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-100 truncate">{company.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono font-medium">{company.tier}</div>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100 text-indigo-400' : 'text-slate-600 opacity-40'}`} />
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
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-14 md:w-16 h-56 relative shrink-0 origin-left"
                  >
                    <svg className="w-full h-full overflow-visible">
                      <path d="M 0 110 C 30 110, 20 30, 56 30" fill="none" stroke="#232B3B" strokeWidth="1.5" />
                      <path d="M 0 110 C 30 110, 20 110, 56 110" fill="none" stroke="#3E4C66" strokeWidth="1.5" />
                      <path d="M 0 110 C 30 110, 20 190, 56 190" fill="none" stroke="#232B3B" strokeWidth="1.5" />
                    </svg>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-3 shrink-0 z-10"
                  >
                    <div className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-slate-400" /> Step 3 • Pick Role for {selectedCompany.name}
                    </div>

                    {ELITE_ROLES.map((role) => {
                      const isSelected = selectedRole?.id === role.id;

                      return (
                        <motion.div
                          key={role.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => onSelectRole(role)}
                          className={`px-3.5 py-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors duration-150 min-w-[230px] ${
                            isSelected
                              ? 'border-emerald-500 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800/80 border border-slate-700/60 text-slate-400'
                          }`}>
                            <Code className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-100 truncate">{role.title}</div>
                            <div className="text-[9px] text-slate-400 font-mono font-medium">Select Role</div>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100 text-emerald-400' : 'text-slate-600 opacity-40'}`} />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ================= LEVEL 3: DIFFICULTY NODES (STEP 4 - UNFOLDS ONLY WHEN ROLE IS SELECTED) ================= */}
            <AnimatePresence>
              {selectedType && selectedCompany && selectedRole && (
                <>
                  {/* CONNECTOR CURVED LINES LEVEL 2 -> LEVEL 3 */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-14 md:w-16 h-56 relative shrink-0 origin-left"
                  >
                    <svg className="w-full h-full overflow-visible">
                      {/* Top branch to Easy (Emerald) */}
                      <path
                        d="M 0 110 C 30 110, 20 30, 56 30"
                        fill="none"
                        stroke={selectedDifficulty?.id === 'easy' ? '#10b981' : 'rgba(16, 185, 129, 0.45)'}
                        strokeWidth={selectedDifficulty?.id === 'easy' ? '2' : '1.5'}
                      />
                      {/* Middle branch to Medium (Amber) */}
                      <path
                        d="M 0 110 C 30 110, 20 110, 56 110"
                        fill="none"
                        stroke={selectedDifficulty?.id === 'medium' ? '#f59e0b' : 'rgba(245, 158, 11, 0.45)'}
                        strokeWidth={selectedDifficulty?.id === 'medium' ? '2' : '1.5'}
                      />
                      {/* Bottom branch to Hard (Rose) */}
                      <path
                        d="M 0 110 C 30 110, 20 190, 56 190"
                        fill="none"
                        stroke={selectedDifficulty?.id === 'hard' ? '#f43f5e' : 'rgba(244, 63, 94, 0.45)'}
                        strokeWidth={selectedDifficulty?.id === 'hard' ? '2' : '1.5'}
                      />
                    </svg>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-3 shrink-0 z-10"
                  >
                    <div className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" /> Step 4 • Pick Difficulty Level
                    </div>

                    {DIFFICULTY_LEVELS.map((diffItem) => {
                      const isSelected = selectedDifficulty?.id === diffItem.id;
                      const isEasy = diffItem.id === 'easy';
                      const isMedium = diffItem.id === 'medium';
                      const isHard = diffItem.id === 'hard';

                      return (
                        <motion.div
                          key={diffItem.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => onSelectDifficulty(diffItem)}
                          className={`px-3.5 py-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors duration-150 min-w-[245px] ${
                            isSelected
                              ? isEasy
                                ? 'border-emerald-500 bg-emerald-950/20 text-white shadow-sm ring-1 ring-emerald-500/30'
                                : isMedium
                                ? 'border-amber-500 bg-amber-950/20 text-white shadow-sm ring-1 ring-amber-500/30'
                                : 'border-rose-500 bg-rose-950/20 text-white shadow-sm ring-1 ring-rose-500/30'
                              : isEasy
                              ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-900'
                              : isMedium
                              ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-900'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-rose-500/40 hover:bg-slate-900'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                            isEasy
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : isMedium
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}>
                            {isEasy && <Target className="w-4 h-4" />}
                            {isMedium && <Sliders className="w-4 h-4" />}
                            {isHard && <Flame className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-100">{diffItem.title}</span>
                              <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                                isEasy
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : isMedium
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              }`}>
                                {diffItem.title}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{diffItem.subtitle}</div>
                          </div>

                          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected
                              ? isEasy
                                ? 'text-emerald-400 translate-x-0.5 opacity-100'
                                : isMedium
                                ? 'text-amber-400 translate-x-0.5 opacity-100'
                                : 'text-rose-400 translate-x-0.5 opacity-100'
                              : 'text-slate-600 opacity-40'
                          }`} />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ================= LEVEL 4: 4-STAGE PIPELINE NODES (STEP 5 - UNFOLDS ONLY WHEN DIFFICULTY IS SELECTED) ================= */}
          <AnimatePresence>
            {selectedType && selectedCompany && selectedRole && selectedDifficulty && (
              <>
                {/* CONNECTOR CURVED LINES LEVEL 3 -> LEVEL 4 */}
                {(() => {
                  const diffStartY = selectedDifficulty.id === 'easy' ? 45 : selectedDifficulty.id === 'medium' ? 115 : 185;
                  const diffColor = selectedDifficulty.id === 'easy' ? '#10b981' : selectedDifficulty.id === 'medium' ? '#f59e0b' : '#f43f5e';

                  return (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="w-14 md:w-16 relative shrink-0 origin-left self-start mt-10"
                      style={{ height: '760px' }}
                    >
                      <svg className="w-full h-full overflow-visible">
                        {/* Anchor circle at selected difficulty node output */}
                        <circle cx="0" cy={diffStartY} r="3" fill={diffColor} />
                        {/* Curve to Round 1 */}
                        <path
                          d={`M 0 ${diffStartY} C 30 ${diffStartY}, 20 85, 56 85`}
                          fill="none"
                          stroke={diffColor}
                          strokeWidth="2"
                        />
                        {/* Curve to Round 2 */}
                        <path
                          d={`M 0 ${diffStartY} C 30 ${diffStartY}, 20 280, 56 280`}
                          fill="none"
                          stroke={isDevUnlocked || (progress?.rounds?.some(r => r.roundNumber === 1 && r.status === 'passed')) ? diffColor : 'rgba(71, 85, 105, 0.45)'}
                          strokeWidth="1.5"
                        />
                        {/* Curve to Round 3 */}
                        <path
                          d={`M 0 ${diffStartY} C 30 ${diffStartY}, 20 475, 56 475`}
                          fill="none"
                          stroke={isDevUnlocked || (progress?.rounds?.some(r => r.roundNumber === 2 && r.status === 'passed')) ? diffColor : 'rgba(71, 85, 105, 0.45)'}
                          strokeWidth="1.5"
                        />
                        {/* Curve to Round 4 */}
                        <path
                          d={`M 0 ${diffStartY} C 30 ${diffStartY}, 20 670, 56 670`}
                          fill="none"
                          stroke={isDevUnlocked || (progress?.rounds?.some(r => r.roundNumber === 3 && r.status === 'passed')) ? diffColor : 'rgba(71, 85, 105, 0.45)'}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </motion.div>
                  );
                })()}

                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-6 shrink-0 z-10 w-[680px] md:w-[760px] self-start pt-8 pb-32 mr-10"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-2 px-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                        selectedDifficulty.id === 'easy'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : selectedDifficulty.id === 'medium'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                        Step 5 • {selectedCompany.name} Pipeline
                      </span>
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                        selectedDifficulty.id === 'easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : selectedDifficulty.id === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      }`}>
                        {selectedDifficulty.title} Level
                      </span>
                      <span className="text-slate-500 font-mono text-xs font-medium">({passedCount}/4 Cleared)</span>
                    </div>
                    {isDevUnlocked && (
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-semibold">
                        DEV UNLOCKED
                      </span>
                    )}
                  </div>

                  {rounds.map((roundDef) => {
                    const roundProgress = progress?.rounds.find(r => r.roundNumber === roundDef.roundNumber) || {
                      status: (roundDef.roundNumber === 1 || isDevUnlocked) ? 'unlocked' : 'locked',
                      attempts: 0
                    };

                    const isPassed = roundProgress.status === 'passed';
                    const isFailed = roundProgress.status === 'failed';
                    const isUnlocked = !isPassed && !isFailed && (isDevUnlocked || roundProgress.status === 'unlocked' || roundDef.roundNumber === 1);
                    const isLocked = !isDevUnlocked && roundProgress.status === 'locked' && roundDef.roundNumber > 1 && !isPassed && !isFailed;

                    const isDiffEasy = selectedDifficulty.id === 'easy';
                    const isDiffMedium = selectedDifficulty.id === 'medium';
                    const isDiffHard = selectedDifficulty.id === 'hard';

                    return (
                      <div
                        key={roundDef.roundId}
                        className={`p-6 md:px-7 md:py-6 rounded-2xl border transition-colors duration-150 ${
                          isPassed
                            ? 'border-emerald-500/40 bg-slate-900/90'
                            : isFailed
                            ? 'border-rose-500/40 bg-slate-900/90'
                            : isUnlocked
                            ? isDiffEasy
                              ? 'border-emerald-500/60 bg-emerald-950/10 shadow-sm'
                              : isDiffMedium
                              ? 'border-amber-500/60 bg-amber-950/10 shadow-sm'
                              : 'border-rose-500/60 bg-rose-950/10 shadow-sm'
                            : 'border-slate-800/80 bg-slate-950/50 opacity-60'
                        }`}
                      >
                        {/* TOP ROW: ROUND NUMBER + DIFFICULTY + STATUS */}
                        <div className="flex items-center justify-between gap-4 mb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full inline-block ${
                              isPassed
                                ? 'bg-emerald-400'
                                : isFailed
                                ? 'bg-rose-400'
                                : isUnlocked
                                ? isDiffEasy
                                  ? 'bg-emerald-400'
                                  : isDiffMedium
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                                : 'bg-slate-600'
                            }`} />
                            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                              Round {roundDef.roundNumber} of 4
                            </span>
                            {selectedDifficulty && (
                              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                                isDiffEasy
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : isDiffMedium
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              }`}>
                                {selectedDifficulty.title}
                              </span>
                            )}
                          </div>
                          <div>
                            {isPassed && (
                              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PASSED
                              </span>
                            )}
                            {isFailed && (
                              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-rose-400" /> FAILED
                              </span>
                            )}
                            {isUnlocked && (
                              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 ${
                                isDiffEasy
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isDiffMedium
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}>
                                <Zap className="w-3.5 h-3.5" /> READY
                              </span>
                            )}
                            {isLocked && (
                              <span className="px-3 py-1 rounded-lg text-xs font-mono font-medium text-slate-500 bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-600" /> LOCKED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* TITLE & DESCRIPTION */}
                        <div className="space-y-1.5 my-3">
                          <h4 className="font-bold text-base md:text-[17px] text-white tracking-tight leading-snug">
                            {roundDef.title}
                          </h4>
                          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl">
                            {roundDef.description}
                          </p>
                        </div>

                        {/* BOTTOM ACTIONS BAR WITH PROPER MARGINS */}
                        <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-medium bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 shrink-0">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="whitespace-nowrap">{roundDef.questionCount} Questions</span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {(isPassed || isFailed) && (
                              <button
                                onClick={() => {
                                  if (roundProgress?.sessionId) {
                                    navigate(`/voice-interview/results/${roundProgress.sessionId}?from=elite`);
                                  } else {
                                    toast.info(`Round ${roundDef.roundNumber} Result: ${roundProgress?.feedback || (roundProgress as any)?.reason || (isPassed ? 'Passed' : 'Failed with score ' + (roundProgress?.score || 0) + '%')}`);
                                  }
                                }}
                                className="h-10 px-4 rounded-xl font-medium text-xs flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="whitespace-nowrap">View Feedback</span>
                              </button>
                            )}

                            {isUnlocked && (
                              <button
                                onClick={() => onStartRound(roundDef)}
                                className={`h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                  isDiffEasy
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                    : isDiffMedium
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                                <span className="whitespace-nowrap">Start Interview</span>
                              </button>
                            )}

                            {isFailed && (
                              <button
                                onClick={() => onStartRound(roundDef)}
                                className="h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Re-give Round</span>
                              </button>
                            )}

                            {isPassed && (
                              <button
                                onClick={() => onStartRound(roundDef)}
                                className="h-10 px-4.5 rounded-xl font-medium text-xs flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="whitespace-nowrap">Retake Round</span>
                              </button>
                            )}

                            {isLocked && (
                              <div className="h-10 px-4 rounded-xl font-medium text-xs flex items-center gap-2 bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60 select-none whitespace-nowrap shrink-0">
                                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="whitespace-nowrap">Locked</span>
                              </div>
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
                      className="p-5 md:px-6 md:py-5 rounded-2xl border border-slate-800 bg-slate-900/95 space-y-3 mt-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-white">Final Recommendation</span>
                        </div>
                        <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-mono font-medium uppercase">
                          Weighted Engine
                        </Badge>
                      </div>

                      {/* Score Summary & Decision */}
                      {(() => {
                        const rec = computeFinalRecommendation(progress);
                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5">
                              <div>
                                <div className="text-[9px] text-slate-400 uppercase font-bold">Overall Score</div>
                                <div className="text-lg font-black text-amber-300">{rec.overallScore}%</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-slate-400 uppercase font-bold">Hiring Verdict</div>
                                <div className={`text-xs font-black px-2.5 py-1 rounded-lg border ${rec.decisionBadgeColor}`}>
                                  {rec.decision}
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-300 leading-relaxed italic">
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
