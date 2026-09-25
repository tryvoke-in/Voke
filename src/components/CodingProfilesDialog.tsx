import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link2, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodingProfilesDialogProps {
  profile: any;
  onUpdate?: () => void;
}

export const CodingProfilesDialog: React.FC<CodingProfilesDialogProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!profile || dismissed) return null;

  const missingGithub = !profile.github_url;
  const missingResume = !profile.resume_url;

  if (!missingGithub && !missingResume) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-card border border-emerald-600/20 dark:border-emerald-500/20 p-4 mb-6 shadow-xs hover:shadow-sm transition-all text-card-foreground"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3ED] dark:bg-emerald-500/15 border border-[#CFDDD2] dark:border-emerald-500/30 flex items-center justify-center text-[#0F6B38] dark:text-emerald-400 shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
                <span>Complete Profile Integrations</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF3ED] dark:bg-emerald-500/15 text-[#0F6B38] dark:text-emerald-400 border border-[#CFDDD2] dark:border-emerald-500/30">
                  RECOMMENDED
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect your {missingGithub ? 'GitHub account' : ''}{missingGithub && missingResume ? ' & ' : ''}{missingResume ? 'Resume' : ''} in Profile Settings to enable AI-tailored mock interviews.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/profile', { state: { tab: 'settings' } })}
              className="bg-[#0F6B38] hover:bg-[#0B572D] text-white font-semibold rounded-xl text-xs h-9 px-4 shadow-sm shadow-[#0F6B38]/25 hover:shadow-md hover:shadow-[#0F6B38]/35 flex items-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Go to Settings</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted transition-colors cursor-pointer"
              title="Dismiss reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
