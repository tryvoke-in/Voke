import React, { useState } from 'react';
import {
  INTERVIEW_TYPES, ELITE_ROLES, TOP_COMPANIES,
  InterviewTypeItem, RoleItem, CompanyItem, InterviewRoundDef, getInterviewRounds
} from '@/data/eliteInterviewData';
import { CompanyRoleProgress } from '@/utils/eliteInterviewStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  GraduationCap, Building, Code, Sparkles, Check, ArrowRight, Search,
  Lock, CheckCircle2, XCircle, Play, RefreshCw, Layers, ShieldCheck, Zap, Award, ChevronRight, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EliteCommandStudioProps {
  selectedType: InterviewTypeItem;
  selectedCompany: CompanyItem;
  selectedRole: RoleItem;
  rounds: InterviewRoundDef[];
  progress: CompanyRoleProgress;
  onSelectType: (type: InterviewTypeItem) => void;
  onSelectCompany: (company: CompanyItem) => void;
  onSelectRole: (role: RoleItem) => void;
  onStartRound: (round: InterviewRoundDef) => void;
}

const ROLE_ICONS: Record<string, string> = {
  frontend: '🎨',
  backend: '⚙️',
  fullstack: '⚡'
};

export const EliteCommandStudio: React.FC<EliteCommandStudioProps> = ({
  selectedType,
  selectedCompany,
  selectedRole,
  rounds,
  progress,
  onSelectType,
  onSelectCompany,
  onSelectRole,
  onStartRound
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = TOP_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const passedCount = progress?.rounds.filter(r => r.status === 'passed').length || 0;
  const progressPercent = Math.round((passedCount / rounds.length) * 100);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      
      {/* TOP COMPACT STUDIO BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/90 backdrop-blur-2xl border border-white/15 p-5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-violet-600 p-0.5 shadow-xl shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white">Elite Target Interview Studio</span>
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] uppercase font-bold">
                {selectedType.title}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Select your target company & role on the left to configure your 4-stage mock interview pipeline on the right.
            </p>
          </div>
        </div>

        {/* Selected Target Summary Pill */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-white/15 px-4 py-2 rounded-2xl shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white p-1 shadow-md overflow-hidden shrink-0 border border-gray-200">
            <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-full h-full object-contain" />
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-white">{selectedCompany.name}</div>
            <div className="text-[10px] text-amber-400 font-mono font-bold">{selectedRole.title}</div>
          </div>
          <div className="w-px h-6 bg-white/15 mx-1" />
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-400">Pipeline</div>
            <div className="text-xs font-black text-emerald-400">{passedCount}/4 Cleared</div>
          </div>
        </div>
      </div>

      {/* DUAL-PANEL STUDIO DASHBOARD (LEFT: CONFIGURATOR, RIGHT: PIPELINE RADAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: CONFIGURATION SUITE (COMPANIES & ROLES) */}
        <div className="lg:col-span-5 space-y-5 bg-zinc-950/80 backdrop-blur-2xl border border-white/15 p-5 md:p-6 rounded-3xl shadow-2xl">
          
          {/* TRACK SELECTOR TAB STRIP */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> 1. Select Track
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => t.active && onSelectType(t)}
                  className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                    t.active ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  } ${
                    selectedType.id === t.id
                      ? 'border-amber-500 bg-amber-500/15 text-white shadow-lg shadow-amber-500/10'
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.title.split(' ')[0]} {t.active ? '' : '⏳'}
                </button>
              ))}
            </div>
          </div>

          {/* ROLE SELECTOR CHIPS */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" /> 2. Select Engineering Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ELITE_ROLES.map(role => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => onSelectRole(role)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-base mb-1">{ROLE_ICONS[role.id] || '💻'}</div>
                    <div className="font-extrabold text-xs text-white leading-tight">{role.title.replace(' Developer', '')}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Internship</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMPANY SEARCH & GRID */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-violet-400 font-mono flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> 3. Select Target Company
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">{filteredCompanies.length} Companies</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-zinc-900 border-white/10 text-white rounded-xl text-xs placeholder:text-zinc-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredCompanies.map(company => {
                const isSelected = selectedCompany.id === company.id;
                return (
                  <div
                    key={company.id}
                    onClick={() => onSelectCompany(company)}
                    className={`p-3 rounded-2xl border bg-zinc-900 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/20 ring-1 ring-violet-500/40 shadow-xl shadow-violet-500/10'
                        : 'border-white/10 hover:border-violet-500/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white p-1.5 shadow-md shrink-0 border border-gray-200 overflow-hidden">
                      <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-white truncate flex items-center gap-1">
                        {company.name}
                        {isSelected && <Check className="w-3 h-3 text-violet-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{company.tier}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: 4-STAGE PIPELINE RADAR & ROUNDS HUB */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* HEADER EMBLEM CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-2xl flex items-center justify-center shrink-0 border border-gray-200">
                  <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-2xl text-white">{selectedCompany.name}</span>
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                      {selectedRole.title}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    4-Stage pure voice & video interview pipeline tailored for {selectedCompany.name}.
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Pipeline Clearance</span>
                <span className="text-2xl font-black text-white">{passedCount} / {rounds.length} <span className="text-xs text-zinc-400">Rounds</span></span>
              </div>
            </div>
          </div>

          {/* 4 STAGE CARDS GRID */}
          <div className="space-y-4">
            {rounds.map((roundDef, idx) => {
              const roundProgress = progress?.rounds.find(r => r.roundNumber === roundDef.roundNumber) || {
                status: roundDef.roundNumber === 1 ? 'unlocked' : 'locked',
                attempts: 0
              };

              const isPassed = roundProgress.status === 'passed';
              const isFailed = roundProgress.status === 'failed';
              const isUnlocked = roundProgress.status === 'unlocked';
              const isLocked = roundProgress.status === 'locked';

              return (
                <motion.div
                  key={roundDef.roundId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className={`border rounded-3xl bg-zinc-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all ${
                      isPassed
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : isFailed
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : isUnlocked
                        ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30'
                        : 'border-white/10 opacity-50'
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border shadow-lg ${
                          isPassed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : isFailed
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : isUnlocked
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-zinc-900 border-white/10 text-zinc-600'
                        }">
                          {isPassed && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                          {isFailed && <XCircle className="w-6 h-6 text-rose-400" />}
                          {isUnlocked && <Play className="w-6 h-6 text-amber-400 fill-amber-400" />}
                          {isLocked && <Lock className="w-5 h-5 text-zinc-500" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-extrabold text-zinc-400 uppercase tracking-wider">
                              Stage {roundDef.roundNumber}
                            </span>
                            {isPassed && <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold">PASSED ({roundProgress.score}%)</Badge>}
                            {isFailed && <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-extrabold">FAILED (Attempt {roundProgress.attempts})</Badge>}
                            {isUnlocked && <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold animate-pulse">READY TO ATTEMPT</Badge>}
                            {isLocked && <Badge variant="outline" className="border-white/10 text-zinc-500 text-[9px]">LOCKED</Badge>}
                          </div>

                          <h4 className="font-extrabold text-base text-white">{roundDef.title}</h4>
                          <p className="text-xs text-zinc-400 line-clamp-2">{roundDef.description}</p>
                          
                          <div className="flex flex-wrap gap-1 pt-1">
                            {roundDef.focusAreas.map((area, aIdx) => (
                              <span key={aIdx} className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-900 text-zinc-300 border border-white/10">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500 font-semibold hidden md:block">
                          {roundDef.questionCount} Questions • ~{roundDef.durationMins}m
                        </span>

                        {isUnlocked && (
                          <Button
                            size="sm"
                            onClick={() => onStartRound(roundDef)}
                            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs px-5 h-10 rounded-xl shadow-lg shadow-amber-500/20"
                          >
                            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start Stage {roundDef.roundNumber}
                          </Button>
                        )}

                        {isFailed && (
                          <Button
                            size="sm"
                            onClick={() => onStartRound(roundDef)}
                            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs px-5 h-10 rounded-xl shadow-lg shadow-rose-500/20"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-give Stage {roundDef.roundNumber}
                          </Button>
                        )}

                        {isPassed && (
                          <Button
                            size="sm"
                            onClick={() => onStartRound(roundDef)}
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-extrabold text-xs px-5 h-10 rounded-xl"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retake Stage
                          </Button>
                        )}

                        {isLocked && (
                          <Button
                            size="sm"
                            disabled
                            variant="outline"
                            className="border-white/10 text-zinc-500 font-semibold text-xs px-5 h-10 rounded-xl cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" /> Pass Stage {roundDef.roundNumber - 1} First
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
