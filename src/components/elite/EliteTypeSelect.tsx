import React from 'react';
import { INTERVIEW_TYPES, InterviewTypeItem } from '@/data/eliteInterviewData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Briefcase, Award, ChevronRight, Check, Sparkles, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface EliteTypeSelectProps {
  onSelectType: (typeItem: InterviewTypeItem) => void;
  selectedTypeId?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-9 h-9 text-amber-400" />,
  Briefcase: <Briefcase className="w-9 h-9 text-indigo-400" />,
  Award: <Award className="w-9 h-9 text-emerald-400" />
};

export const EliteTypeSelect: React.FC<EliteTypeSelectProps> = ({
  onSelectType,
  selectedTypeId
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Step 1 of 4 • Select Interview Track
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Select Interview Level Track
        </h1>
        <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
          Choose the career stage benchmark for your target company mock interview.
        </p>
      </div>

      {/* Track Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INTERVIEW_TYPES.map((typeItem, idx) => {
          const isSelected = selectedTypeId === typeItem.id;
          const isActive = typeItem.active;

          return (
            <motion.div
              key={typeItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <Card
                onClick={() => isActive && onSelectType(typeItem)}
                className={`relative group transition-all duration-300 border rounded-3xl bg-zinc-950/80 backdrop-blur-2xl overflow-hidden shadow-2xl h-full flex flex-col justify-between ${
                  isActive ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                } ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 shadow-2xl shadow-amber-500/15'
                    : isActive
                    ? 'border-white/10 hover:border-amber-500/50 hover:bg-zinc-900/90 hover:scale-[1.03]'
                    : 'border-white/5 bg-zinc-950/40'
                }`}
              >
                <CardContent className="p-7 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="p-4 rounded-2xl bg-zinc-900 border border-white/15 shadow-inner">
                        {ICON_MAP[typeItem.iconName] || <GraduationCap className="w-9 h-9 text-amber-400" />}
                      </div>

                      {typeItem.badge ? (
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-wider py-1">
                          {typeItem.badge}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold py-1">
                          ACTIVE TRACK
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-black text-2xl text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                        <span>{typeItem.title}</span>
                        {isSelected && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                      </h3>
                      <div className="text-xs font-bold text-amber-400/90 mt-1">
                        {typeItem.subtitle}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {typeItem.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-black">
                    {isActive ? (
                      <span className="text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Select Track & Continue <ChevronRight className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Unlocks Soon
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
