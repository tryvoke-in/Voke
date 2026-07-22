import React, { useState } from 'react';
import { TOP_COMPANIES, CompanyItem } from '@/data/eliteInterviewData';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight, ArrowLeft, Check, Sparkles, Building, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface EliteCompanySelectProps {
  onSelectCompany: (company: CompanyItem) => void;
  selectedCompanyId?: string | null;
  onBack: () => void;
  typeName?: string;
}

const TIER_COLORS: Record<string, string> = {
  FAANG: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10',
  Unicorn: 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/10',
  FinTech: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10',
  Enterprise: 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-500/10',
  'AI Pioneer': 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40 shadow-lg shadow-fuchsia-500/10'
};

export const EliteCompanySelect: React.FC<EliteCompanySelectProps> = ({
  onSelectCompany,
  selectedCompanyId,
  onBack,
  typeName
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = TOP_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="border-white/15 bg-zinc-950/80 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs rounded-2xl font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Track Selection
        </Button>
        {typeName && (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs py-1 font-bold">
            Track: {typeName}
          </Badge>
        )}
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-amber-500/10 to-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-black uppercase tracking-wider shadow-xl">
          <Building className="w-4 h-4 text-violet-400" />
          Step 2 of 4 • Select Target Company
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Choose Target Tech Company
        </h1>
        <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
          Select the company where you want to practice your mock interview rounds.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search company (e.g. Google, Meta, Stripe)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-zinc-950/90 border-white/15 text-white rounded-2xl focus:border-amber-500 focus:ring-amber-500/20 transition-all text-sm placeholder:text-zinc-500 shadow-2xl"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company, idx) => {
          const isSelected = selectedCompanyId === company.id;
          return (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card
                onClick={() => onSelectCompany(company)}
                className={`relative group cursor-pointer transition-all duration-300 border rounded-3xl bg-zinc-950/80 backdrop-blur-2xl overflow-hidden shadow-2xl ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 shadow-2xl shadow-amber-500/15'
                    : 'border-white/10 hover:border-amber-500/50 hover:bg-zinc-900/90 hover:scale-[1.03]'
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Top Row: Logo + Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 p-3 shadow-2xl flex items-center justify-center overflow-hidden shrink-0 border border-white/15 ring-1 ring-white/10">
                      <img
                        src={company.logo}
                        alt={`${company.name} logo`}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=18181b&color=fff&size=64`;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-black tracking-wider uppercase px-3 py-1 border ${TIER_COLORS[company.tier] || 'bg-white/5 text-zinc-300'}`}>
                      {company.tier}
                    </Badge>
                  </div>

                  {/* Company Info */}
                  <div>
                    <h3 className="font-black text-2xl text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                      <span>{company.name}</span>
                      {isSelected && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                      {company.description}
                    </p>
                  </div>

                  {/* Bottom details */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono text-[11px]">{company.hq}</span>
                    <span className="text-amber-400 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Next: Select Role <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No companies found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
};
