import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please link your coding profiles so our AI can tailor interviews to your experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="github">GitHub Profile URL</Label>
            <Input 
              id="github" 
              placeholder="https://github.com/username" 
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="leetcode">LeetCode Username</Label>
            <Input 
              id="leetcode" 
              placeholder="e.g. your_username" 
              value={leetcodeId}
              onChange={(e) => setLeetcodeId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codeforces">Codeforces Handle</Label>
            <Input 
              id="codeforces" 
              placeholder="e.g. tourist" 
              value={codeforcesId}
              onChange={(e) => setCodeforcesId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : 'Save Profiles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
