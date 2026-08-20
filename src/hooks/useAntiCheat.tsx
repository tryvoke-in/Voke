import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface AntiCheatHookReturn {
  violationCount: number;
  AntiCheatOverlay: React.FC;
}

export function useAntiCheat(): AntiCheatHookReturn {
  const [violationCount, setViolationCount] = useState(0);
  const [activeViolationType, setActiveViolationType] = useState<'TAB_SWITCH' | 'COPY_PASTE' | null>(null);

  const [isProctoringDisabled, setIsProctoringDisabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('voke_dev_proctoring_disabled') === 'true';
  });

  // Listen for changes from DevResetWidget
  useEffect(() => {
    const handleChange = () => {
      const disabled = localStorage.getItem('voke_dev_proctoring_disabled') === 'true';
      setIsProctoringDisabled(disabled);
      if (disabled) setActiveViolationType(null);
    };
    window.addEventListener('voke-dev-proctoring-change', handleChange);
    return () => window.removeEventListener('voke-dev-proctoring-change', handleChange);
  }, []);

  const handleViolation = useCallback((type: 'TAB_SWITCH' | 'COPY_PASTE') => {
    if (isProctoringDisabled) return;
    setViolationCount(prev => prev + 1);
    setActiveViolationType(type);
  }, [isProctoringDisabled]);

  const dismissWarning = () => {
    setActiveViolationType(null);
  };

  useEffect(() => {
    // Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      if (isProctoringDisabled) return;
      e.preventDefault();
      handleViolation('COPY_PASTE');
    };

    // Prevent Copy/Cut/Paste
    const handleClipboard = (e: ClipboardEvent) => {
      if (isProctoringDisabled) return;
      e.preventDefault();
      handleViolation('COPY_PASTE');
    };

    // Tab visibility change
    const handleVisibilityChange = () => {
      if (isProctoringDisabled) return;
      if (document.visibilityState === 'hidden') {
        handleViolation('TAB_SWITCH');
      }
    };

    // Add event listeners (capture phase true for strict interception)
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleClipboard, true);
    document.addEventListener('cut', handleClipboard, true);
    document.addEventListener('paste', handleClipboard, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleClipboard, true);
      document.removeEventListener('cut', handleClipboard, true);
      document.removeEventListener('paste', handleClipboard, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
    };
  }, [handleViolation, isProctoringDisabled]);

  const AntiCheatOverlay: React.FC = () => {
    if (!activeViolationType) return null;

    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-3xl p-8 max-w-lg shadow-[0_0_100px_-20px_rgba(244,63,94,0.3)]">
          <ShieldAlert className="w-20 h-20 text-rose-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-black text-rose-500 mb-2 uppercase tracking-wide">
            Proctoring Alert
          </h2>
          
          <div className="bg-rose-500/10 text-rose-200 p-4 rounded-xl mb-8 mt-6">
            <p className="text-lg flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {activeViolationType === 'COPY_PASTE' 
                ? 'Copying, pasting, or right-clicking is strictly disabled during the assessment.'
                : 'Tab switching and leaving the browser window are strictly prohibited.'}
            </p>
          </div>

          <p className="text-zinc-400 text-sm mb-8">
            This violation has been recorded. Continuing to trigger proctoring alerts may result in automatic failure of your interview.
          </p>

          <button 
            onClick={dismissWarning}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            I Understand, Return to Interview
          </button>
        </div>
      </div>
    );
  };

  return { violationCount, AntiCheatOverlay };
}
