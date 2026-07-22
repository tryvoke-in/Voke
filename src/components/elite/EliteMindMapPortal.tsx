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
  GraduationCap, Building, Code, Sparkles, Check, ArrowRight, ArrowDown,
  ChevronDown, Search, Lock, CheckCircle2, XCircle, Play, RefreshCw, Layers, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EliteMindMapPortalProps {
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

export const EliteMindMapPortal: React.FC<EliteMindMapPortalProps> = ({
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
  const [activeNode, setActiveNode] = useState<'track' | 'company' | 'role' | 'rounds'>('company');
  const [companySearch, setCompanySearch] = useState('');

  const filteredCompanies = TOP_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.tier.toLowerCase().includes(companySearch.toLowerCase())
  );

  const passedCount = progress?.rounds.filter(r => r.status === 'passed').length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      
      {/* MIND MAP CANVAS HEADER */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Interactive Mind Map Configurator
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Elite Interview Node Pipeline
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 max-w-xl mx-auto">
          Click any node below to customize your interview track, target organization, role, and round stage.
        </p>
      </div>

      {/* NOTEBOOKLM-STYLE VISUAL MIND MAP NODE TREE */}
      <div className="flex flex-col items-center gap-6 relative">

        {/* ==================== NODE 1: TRACK NODE ==================== */}
        <div className="w-full max-w-2xl relative">
          <Card
            onClick={() => setActiveNode(activeNode === 'track' ? 'company' : 'track')}
            className={`cursor-pointer transition-all duration-300 border rounded-3xl bg-zinc-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden ${
              activeNode === 'track'
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                : 'border-white/15 hover:border-amber-500/40'
            }`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider">Node 1 • Track</div>
                  <h3 className="text-lg font-black text-white">{selectedType.title}</h3>
                  <p className="text-xs text-zinc-400">{selectedType.subtitle}</p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-3 py-1">
                CONFIGURE TRACK <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${activeNode === 'track' ? 'rotate-180' : ''}`} />
              </Badge>
            </CardContent>
          </Card>

          {/* Track Selector Sub-Drawer */}
          <AnimatePresence>
            {activeNode === 'track' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {INTERVIEW_TYPES.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (t.active) {
                        onSelectType(t);
                        setActiveNode('company');
                      }
                    }}
                    className={`p-4 rounded-2xl border bg-zinc-950/90 text-left transition-all ${
                      t.active ? 'cursor-pointer hover:border-amber-500/50' : 'opacity-50 cursor-not-allowed'
                    } ${selectedType.id === t.id ? 'border-amber-500 bg-amber-500/10' : 'border-white/10'}`}
                  >
                    <div className="font-extrabold text-xs text-white">{t.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">{t.subtitle}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GLOWING CONNECTOR ARROW 1 -> 2 */}
        <div className="flex flex-col items-center text-amber-400/80 animate-pulse my-[-4px]">
          <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-violet-500" />
          <ArrowDown className="w-5 h-5 text-violet-400 -mt-1" />
        </div>

        {/* ==================== NODE 2: COMPANY NODE ==================== */}
        <div className="w-full max-w-2xl relative">
          <Card
            onClick={() => setActiveNode(activeNode === 'company' ? 'role' : 'company')}
            className={`cursor-pointer transition-all duration-300 border rounded-3xl bg-zinc-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden ${
              activeNode === 'company'
                ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30'
                : 'border-white/15 hover:border-violet-500/40'
            }`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white p-2 border border-gray-200 shadow-xl flex items-center justify-center shrink-0">
                  <img
                    src={selectedCompany.logo}
                    alt={selectedCompany.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-extrabold text-violet-400 uppercase tracking-wider">Node 2 • Target Company</div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {selectedCompany.name}
                    <Badge variant="outline" className="border-violet-500/40 bg-violet-500/10 text-violet-300 text-[9px]">
                      {selectedCompany.tier}
                    </Badge>
                  </h3>
                  <p className="text-xs text-zinc-400">{selectedCompany.description}</p>
                </div>
              </div>
              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-extrabold px-3 py-1">
                SWITCH COMPANY <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${activeNode === 'company' ? 'rotate-180' : ''}`} />
              </Badge>
            </CardContent>
          </Card>

          {/* Company Selector Sub-Drawer */}
          <AnimatePresence>
            {activeNode === 'company' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 rounded-3xl bg-zinc-950 border border-white/15 space-y-3"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Search company (Google, Meta, Stripe)..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-9 h-9 bg-zinc-900 border-white/10 text-white rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredCompanies.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCompany(c);
                        setActiveNode('role');
                      }}
                      className={`p-2.5 rounded-xl border bg-zinc-900 flex items-center gap-2 cursor-pointer hover:border-violet-500/60 transition-all ${
                        selectedCompany.id === c.id ? 'border-violet-500 bg-violet-500/20' : 'border-white/10'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white p-1 shrink-0 overflow-hidden">
                        <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-bold text-white truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GLOWING CONNECTOR ARROW 2 -> 3 */}
        <div className="flex flex-col items-center text-violet-400/80 animate-pulse my-[-4px]">
          <div className="w-0.5 h-6 bg-gradient-to-b from-violet-500 to-emerald-500" />
          <ArrowDown className="w-5 h-5 text-emerald-400 -mt-1" />
        </div>

        {/* ==================== NODE 3: ROLE NODE ==================== */}
        <div className="w-full max-w-2xl relative">
          <Card
            onClick={() => setActiveNode(activeNode === 'role' ? 'rounds' : 'role')}
            className={`cursor-pointer transition-all duration-300 border rounded-3xl bg-zinc-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden ${
              activeNode === 'role'
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                : 'border-white/15 hover:border-emerald-500/40'
            }`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-wider">Node 3 • Engineering Role</div>
                  <h3 className="text-lg font-black text-white">{selectedRole.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-1">{selectedRole.skills.join(', ')}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-3 py-1">
                SWITCH ROLE <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${activeNode === 'role' ? 'rotate-180' : ''}`} />
              </Badge>
            </CardContent>
          </Card>

          {/* Role Selector Sub-Drawer */}
          <AnimatePresence>
            {activeNode === 'role' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {ELITE_ROLES.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onSelectRole(r);
                      setActiveNode('rounds');
                    }}
                    className={`p-4 rounded-2xl border bg-zinc-950/90 text-left cursor-pointer hover:border-emerald-500/60 transition-all ${
                      selectedRole.id === r.id ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/10'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-white">{r.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{r.skills.slice(0, 3).join(', ')}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GLOWING CONNECTOR ARROW 3 -> 4 */}
        <div className="flex flex-col items-center text-emerald-400/80 animate-pulse my-[-4px]">
          <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 via-amber-400 to-amber-500" />
          <ArrowDown className="w-6 h-6 text-amber-400 -mt-1" />
        </div>

        {/* ==================== NODE 4: INTERVIEW ROUNDS PIPELINE ==================== */}
        <div className="w-full max-w-4xl space-y-4">
          <div className="text-center">
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-4 py-1 uppercase tracking-widest shadow-xl">
              Node 4 • Stage-Gated Rounds Pipeline ({passedCount}/4 Cleared)
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Card
                  key={roundDef.roundId}
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
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-extrabold text-zinc-400">
                        Round {roundDef.roundNumber} of 4
                      </span>
                      {isPassed && <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">PASSED</Badge>}
                      {isFailed && <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold">FAILED (Retry)</Badge>}
                      {isUnlocked && <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold animate-pulse">READY</Badge>}
                      {isLocked && <Badge variant="outline" className="border-white/10 text-zinc-500 text-[9px]">LOCKED</Badge>}
                    </div>

                    <h4 className="font-extrabold text-base text-white">{roundDef.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2">{roundDef.description}</p>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">{roundDef.questionCount} Questions</span>

                      {isUnlocked && (
                        <Button
                          size="sm"
                          onClick={() => onStartRound(roundDef)}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl px-4"
                        >
                          <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Start Round {roundDef.roundNumber}
                        </Button>
                      )}

                      {isFailed && (
                        <Button
                          size="sm"
                          onClick={() => onStartRound(roundDef)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl px-4"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-give Round {roundDef.roundNumber}
                        </Button>
                      )}

                      {isPassed && (
                        <Button
                          size="sm"
                          onClick={() => onStartRound(roundDef)}
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-300 text-xs rounded-xl"
                        >
                          Retake Round
                        </Button>
                      )}

                      {isLocked && (
                        <Button size="sm" disabled variant="outline" className="border-white/10 text-zinc-500 text-xs rounded-xl">
                          <Lock className="w-3 h-3 mr-1" /> Locked
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
