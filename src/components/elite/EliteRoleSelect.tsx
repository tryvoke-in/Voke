import React, { useState } from 'react';
import { ELITE_ROLES, RoleItem } from '@/data/eliteInterviewData';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Layout, Server, Layers, ChevronRight, Check, ArrowLeft, Code } from 'lucide-react';
import { motion } from 'framer-motion';

interface EliteRoleSelectProps {
  onSelectRole: (role: RoleItem) => void;
  selectedRoleId?: string | null;
  onBack: () => void;
  companyName?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Layout: <Layout className="w-8 h-8 text-indigo-400" />,
  Server: <Server className="w-8 h-8 text-emerald-400" />,
  Layers: <Layers className="w-8 h-8 text-amber-400" />
};

export const EliteRoleSelect: React.FC<EliteRoleSelectProps> = ({
  onSelectRole,
  selectedRoleId,
  onBack,
  companyName
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = ELITE_ROLES.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="border-white/15 bg-zinc-950/80 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs rounded-2xl font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Company Selection
        </Button>
        {companyName && (
          <Badge variant="outline" className="border-violet-500/40 bg-violet-500/10 text-violet-300 text-xs py-1 font-bold">
            Target Company: {companyName}
          </Badge>
        )}
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-xl">
          <Code className="w-4 h-4 text-emerald-400" />
          Step 3 of 4 • Select Engineering Role
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Select Internship Role
        </h1>
        <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
          Select your engineering specialization for {companyName || 'the target company'}.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search role (e.g. Frontend, Backend, Full Stack)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-zinc-950/90 border-white/15 text-white rounded-2xl focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-sm placeholder:text-zinc-500 shadow-2xl"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredRoles.map((role, idx) => {
          const isSelected = selectedRoleId === role.id;
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                onClick={() => onSelectRole(role)}
                className={`relative group cursor-pointer transition-all duration-300 border rounded-3xl bg-zinc-950/80 backdrop-blur-2xl overflow-hidden shadow-2xl h-full flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-2xl shadow-emerald-500/15'
                    : 'border-white/10 hover:border-emerald-500/50 hover:bg-zinc-900/90 hover:scale-[1.03]'
                }`}
              >
                <CardContent className="p-7 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="p-4 rounded-2xl bg-zinc-900 border border-white/15 group-hover:border-emerald-500/40 shadow-inner transition-colors">
                        {ICON_MAP[role.iconName] || <Layout className="w-8 h-8 text-emerald-400" />}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono border-white/15 bg-white/5 text-zinc-300 py-1 font-bold">
                        {role.level}
                      </Badge>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-black text-2xl text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                        <span>{role.title}</span>
                        {isSelected && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    {/* Skills Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                      {role.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-zinc-900 text-zinc-300 border border-white/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-black text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>View Interview Rounds</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No roles match "{searchTerm}". Try searching for Frontend, Backend, or Full Stack.
        </div>
      )}
    </div>
  );
};
