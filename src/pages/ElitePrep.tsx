import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INTERVIEW_TYPES, ELITE_ROLES, TOP_COMPANIES,
  InterviewTypeItem, RoleItem, CompanyItem, InterviewRoundDef, getInterviewRounds
} from '@/data/eliteInterviewData';
import {
  saveSelectedType, getSelectedType,
  saveSelectedRole, getSelectedRole,
  saveSelectedCompany, getSelectedCompany,
  initializeCompanyRoleProgress, getCompanyRoleProgress, CompanyRoleProgress
} from '@/utils/eliteInterviewStorage';
import { EliteNotebookLMMindMap } from '@/components/elite/EliteNotebookLMMindMap';
import { EliteVoiceRoom } from '@/components/elite/EliteVoiceRoom';
import { useInterviewCredits } from '@/hooks/useInterviewCredits';
import { loadUserProfileContext, ProfileContext } from '@/utils/profileContext';
import { Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ViewMode = 'notebook_mindmap' | 'in_interview';

// ── Razorpay loader util ───────────────────────────────────────────────────
const ensureRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const ElitePrep: React.FC = () => {
  const navigate = useNavigate();
  const { credits, isPremium: isPremiumFromHook, loading: creditsLoading, consumeCredit } = useInterviewCredits('elite');

  // Premium state (can be updated after payment)
  const [isPremium, setIsPremium] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('notebook_mindmap');

  // Selections
  const [selectedType, setSelectedType] = useState<InterviewTypeItem | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [activeRound, setActiveRound] = useState<InterviewRoundDef | null>(null);

  const [rounds, setRounds] = useState<InterviewRoundDef[]>([]);
  const [progress, setProgress] = useState<CompanyRoleProgress | null>(null);

  // Profile Context
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Load profile + premium status from DB ─────────────────────────────
  useEffect(() => {
    const initProfile = async () => {
      try {
        const ctx = await loadUserProfileContext();
        setProfileContext(ctx);

        // Secure premium check: query user_subscriptions table (server-granted only)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: subData } = await supabase
            .from('user_subscriptions' as any)
            .select('is_premium')
            .eq('user_id', user.id)
            .maybeSingle();
          setIsPremium(subData ? !!subData.is_premium : false);
        }
      } catch (err) {
        console.error('[ElitePrep] Profile load error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    initProfile();
  }, []);

  // Sync hook isPremium as fallback
  useEffect(() => {
    if (isPremiumFromHook && !isPremium) setIsPremium(true);
  }, [isPremiumFromHook]);

  // ── Razorpay Payment Handler ───────────────────────────────────────────
  const handlePayAndUnlock = async () => {
    setIsPaying(true);
    try {
      const loaded = await ensureRazorpay();
      if (!loaded || !(window as any).Razorpay) {
        toast.error('Payment gateway could not be loaded. Please disable adblocker and try again.');
        setIsPaying(false);
        return;
      }

      // Use getSession for instant local resolution instead of network-dependent getUser
      const userPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000));
      const authResult = await Promise.race([userPromise, timeoutPromise]) as any;
      const user = authResult?.data?.session?.user;

      if (!user) {
        toast.error('You must be logged in to proceed.');
        setIsPaying(false);
        return;
      }

      // Create order on server (never expose secret key to browser)
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: 100,       // ₹1 in paise
          currency: 'INR',
          receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
        },
      });

      if (orderError || !orderData?.id) {
        console.error('Order creation error:', orderError, orderData);
        toast.error('Payment initialization failed.');
        setIsPaying(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || '',
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: 'Voke Elite',
        description: 'Unlock Voke Elite Mock Interview Features',
        image: '/images/voke_logo.png',
        handler: async function (response: any) {
          toast.success('Verifying payment with server...');

          // Verify signature on server (secure — no client-side trust)
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verifyError || !verifyData?.success) {
            toast.error('Payment verification failed: ' + (verifyError?.message || verifyData?.error || 'Invalid signature'));
          } else {
            await supabase.auth.refreshSession();
            setIsPremium(true);
            toast.success('Welcome to Voke Elite! 🎉');
          }
          setIsPaying(false);
        },
        prefill: {
          name: profileContext?.fullName || '',
          email: (await supabase.auth.getUser()).data.user?.email || '',
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
            toast.info('Payment cancelled.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      console.error('Razorpay error:', e);
      toast.error('Payment initialization failed: ' + e.message);
      setIsPaying(false);
    }
  };

  // ── Selection Handlers (dost ka original code — untouched) ─────────────
  const setupRoundsHub = (typeItem: InterviewTypeItem, company: CompanyItem, role: RoleItem) => {
    const generatedRounds = getInterviewRounds(typeItem.id, company.id, role.id);
    setRounds(generatedRounds);
    const prog = initializeCompanyRoleProgress(typeItem.id, company.id, role.id, generatedRounds);
    setProgress(prog);
  };

  const handleSelectType = (typeItem: InterviewTypeItem) => {
    if (selectedType?.id === typeItem.id) {
      setSelectedType(null);
      setSelectedCompany(null);
      setSelectedRole(null);
      setRounds([]);
      setProgress(null);
      return;
    }
    setSelectedType(typeItem);
    saveSelectedType(typeItem.id);
    setSelectedCompany(null);
    setSelectedRole(null);
    setRounds([]);
    setProgress(null);
  };

  const handleSelectCompany = (company: CompanyItem) => {
    if (selectedCompany?.id === company.id) {
      setSelectedCompany(null);
      setSelectedRole(null);
      setRounds([]);
      setProgress(null);
      return;
    }
    setSelectedCompany(company);
    saveSelectedCompany(company.id);
    setSelectedRole(null);
    setRounds([]);
    setProgress(null);
  };

  const handleSelectRole = (role: RoleItem) => {
    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
      setRounds([]);
      setProgress(null);
      return;
    }
    setSelectedRole(role);
    saveSelectedRole(role.id);
    if (selectedType && selectedCompany) {
      setupRoundsHub(selectedType, selectedCompany, role);
    }
  };

  const handleResetSelection = () => {
    setSelectedType(null);
    setSelectedCompany(null);
    setSelectedRole(null);
    setRounds([]);
    setProgress(null);
  };

  const handleStartRound = async (round: InterviewRoundDef) => {
    setActiveRound(round);
    if (credits > 0 || isPremium) {
      await consumeCredit();
    }
    setViewMode('in_interview');
  };

  const handleCompleteRound = (verdict: 'PASSED' | 'FAILED') => {
    if (selectedType && selectedCompany && selectedRole) {
      const updatedProg = getCompanyRoleProgress(selectedType.id, selectedCompany.id, selectedRole.id);
      if (updatedProg) setProgress(updatedProg);
    }
    setViewMode('notebook_mindmap');
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Main View */}
      <main className="flex-1 min-h-0 relative">
        {viewMode === 'notebook_mindmap' && (
          <EliteNotebookLMMindMap
            selectedType={selectedType}
            selectedCompany={selectedCompany}
            selectedRole={selectedRole}
            rounds={rounds}
            progress={progress}
            onSelectType={handleSelectType}
            onSelectCompany={handleSelectCompany}
            onSelectRole={handleSelectRole}
            onStartRound={handleStartRound}
            onResetSelection={handleResetSelection}
            onNavigateDashboard={() => navigate('/dashboard')}
          />
        )}

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && (
          <EliteVoiceRoom
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}
      </main>
    </div>
  );
};

export default ElitePrep;
