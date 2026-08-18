import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, X } from 'lucide-react';
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-fuchsia-500/10 border border-amber-500/20 p-4 mb-6 backdrop-blur-xl shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Complete Profile Integrations
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  RECOMMENDED
                </span>
              </h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Connect your {missingGithub ? 'GitHub account' : ''}{missingGithub && missingResume ? ' & ' : ''}{missingResume ? 'Resume' : ''} in Profile Settings to enable AI-tailored mock interviews.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/profile', { state: { tab: 'settings' } })}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl text-xs h-9 px-4 shadow-md shadow-violet-500/20 flex items-center gap-1 transition-all"
            >
              Go to Settings
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
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
