import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Code2, Loader2, Sparkles } from 'lucide-react';

interface CodingProfilesDialogProps {
  profile: any;
  onUpdate: () => void;
}

export const CodingProfilesDialog: React.FC<CodingProfilesDialogProps> = ({ profile, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [codeforcesId, setCodeforcesId] = useState('');
  const [leetcodeId, setLeetcodeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile && (!profile.github_url || !profile.codeforces_id || !profile.leetcode_id)) {
      setIsOpen(true);
      setGithubUrl(profile.github_url || '');
      setCodeforcesId(profile.codeforces_id || '');
      setLeetcodeId(profile.leetcode_id || '');
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!githubUrl || !codeforcesId || !leetcodeId) {
      toast.error('Please fill in all profile fields to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          github_url: githubUrl,
          codeforces_id: codeforcesId,
          leetcode_id: leetcodeId,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profiles saved successfully!');
      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profiles');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md overflow-hidden rounded-3xl p-6 md:p-8">
        <DialogHeader className="flex flex-col items-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-2">
            <Code2 className="w-6 h-6 text-violet-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs text-center mt-2">
            Please link your coding profiles so our AI can tailor <br />
            interviews precisely to your experience level.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="github" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">GitHub Profile URL *</Label>
            <Input 
              id="github" 
              placeholder="https://github.com/username" 
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl h-11 text-sm placeholder:text-zinc-600"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="leetcode" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">LeetCode Username *</Label>
            <Input 
              id="leetcode" 
              placeholder="e.g. your_username" 
              value={leetcodeId}
              onChange={(e) => setLeetcodeId(e.target.value)}
              className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl h-11 text-sm placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="codeforces" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Codeforces Handle *</Label>
            <Input 
              id="codeforces" 
              placeholder="e.g. tourist" 
              value={codeforcesId}
              onChange={(e) => setCodeforcesId(e.target.value)}
              className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl h-11 text-sm placeholder:text-zinc-600"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-1.5 transition-all duration-300"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Save Profiles
                <Sparkles className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
