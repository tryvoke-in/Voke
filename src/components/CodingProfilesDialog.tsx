import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface CodingProfilesDialogProps {
  profile: any;
  onUpdate: () => void;
}

export const CodingProfilesDialog: React.FC<CodingProfilesDialogProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && (!profile.github_url || !profile.codeforces_id || !profile.leetcode_id)) {
      setIsOpen(true);
    }
  }, [profile]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md overflow-hidden rounded-3xl p-6 md:p-8">
        <DialogHeader className="flex flex-col items-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Action Required
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-center mt-3 text-sm leading-relaxed">
            Please complete your profile to unlock the full potential of Voke. 
            <br /><br />
            Without linking your GitHub, LeetCode, and Codeforces data, the AI cannot properly tailor your mock interviews to your actual skill level.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 sm:justify-center">
          <Button 
            onClick={() => {
              setIsOpen(false);
              navigate('/profile', { state: { tab: 'settings' } });
            }} 
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-1.5 transition-all duration-300"
          >
            Go to Settings
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
