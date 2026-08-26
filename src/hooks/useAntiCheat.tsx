import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, AlertOctagon } from 'lucide-react';

interface AntiCheatHookReturn {
  violationCount: number;
  AntiCheatOverlay: React.FC;
}

interface AntiCheatOptions {
  onTerminate?: () => void;
}

export function useAntiCheat(options?: AntiCheatOptions): AntiCheatHookReturn {
  const [violationCount, setViolationCount] = useState(0);
  const [activeViolationType, setActiveViolationType] = useState<'TAB_SWITCH' | 'COPY_PASTE' | 'INSPECT' | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);

  const [isProctoringDisabled, setIsProctoringDisabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('voke_dev_proctoring_disabled') === 'true';
  });

  // Listen for changes from DevResetWidget
  useEffect(() => {
    const handleChange = () => {
      const disabled = localStorage.getItem('voke_dev_proctoring_disabled') === 'true';
      setIsProctoringDisabled(disabled);
      if (disabled) {
        setActiveViolationType(null);
        setIsTerminated(false);
      }
    };
    window.addEventListener('voke-dev-proctoring-change', handleChange);
    return () => window.removeEventListener('voke-dev-proctoring-change', handleChange);
  }, []);

  const handleViolation = useCallback((type: 'TAB_SWITCH' | 'COPY_PASTE' | 'INSPECT') => {
    if (isProctoringDisabled || isTerminated) return;
    
    setViolationCount(prev => {
      const newCount = prev + 1;
      
      // If it's a tab/window switch and it happens 3 times, terminate immediately
      if (type === 'TAB_SWITCH' && newCount >= 3) {
        setIsTerminated(true);
        if (options?.onTerminate) {
          options.onTerminate();
        }
      }
      return newCount;
    });
    
    setActiveViolationType(type);
  }, [isProctoringDisabled, isTerminated, options]);

  const dismissWarning = () => {
    if (isTerminated) return; // Cannot dismiss if terminated
    setActiveViolationType(null);
  };

  useEffect(() => {
    // 1. Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      if (isProctoringDisabled) return;
      e.preventDefault();
      handleViolation('COPY_PASTE');
    };

    // 2. Prevent Copy/Cut/Paste
    const handleClipboard = (e: ClipboardEvent) => {
      if (isProctoringDisabled) return;
      e.preventDefault();
      handleViolation('COPY_PASTE');
    };

    // 3. Tab visibility change
    const handleVisibilityChange = () => {
      if (isProctoringDisabled) return;
      if (document.visibilityState === 'hidden') {
        handleViolation('TAB_SWITCH');
      }
    };

    // 4. Window blur (On-screen cheat software like Parrot stealing focus)
    const handleWindowBlur = () => {
      if (isProctoringDisabled) return;
      // We count focus loss as a tab switch violation
      handleViolation('TAB_SWITCH');
    };

    // 5. Block Inspect Element Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProctoringDisabled) return;

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
      // Ctrl+Shift+I or Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
      // Ctrl+Shift+J or Cmd+Option+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
      // Ctrl+Shift+C or Cmd+Option+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
      // Ctrl+U or Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
    };

    // Add event listeners (capture phase true for strict interception)
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleClipboard, true);
    document.addEventListener('cut', handleClipboard, true);
    document.addEventListener('paste', handleClipboard, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleClipboard, true);
      document.removeEventListener('cut', handleClipboard, true);
      document.removeEventListener('paste', handleClipboard, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur, true);
    };
  }, [handleViolation, isProctoringDisabled]);

  const AntiCheatOverlay: React.FC = () => {
    if (!activeViolationType && !isTerminated) return null;

    if (isTerminated) {
      return (
        <div className="fixed inset-0 z-[99999] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-rose-950/50 border border-rose-500 rounded-3xl p-10 max-w-lg shadow-[0_0_150px_-20px_rgba(244,63,94,0.6)]">
            <AlertOctagon className="w-24 h-24 text-rose-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl font-black text-rose-500 mb-3 uppercase tracking-widest">
              Terminated
            </h2>
            <div className="bg-rose-500/10 text-rose-200 p-5 rounded-xl mb-8 mt-6 border border-rose-500/20">
              <p className="text-lg font-medium">
                Your interview has been automatically terminated due to repeated proctoring violations.
              </p>
              <p className="text-sm mt-3 opacity-80">
                You switched tabs, lost window focus, or used external tools 3 times.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-3xl p-8 max-w-lg shadow-[0_0_100px_-20px_rgba(244,63,94,0.3)]">
          <ShieldAlert className="w-20 h-20 text-rose-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-black text-rose-500 mb-2 uppercase tracking-wide">
            Proctoring Alert
          </h2>
          
          <div className="bg-rose-500/10 text-rose-200 p-4 rounded-xl mb-6 mt-6">
            <p className="text-lg flex flex-col items-center justify-center gap-3">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {activeViolationType === 'COPY_PASTE' 
                  ? 'Copying, pasting, or right-clicking is strictly disabled.'
                  : activeViolationType === 'INSPECT'
                  ? 'Developer tools and inspecting elements are strictly forbidden.'
                  : 'Tab switching and window blurring are strictly prohibited.'}
              </span>
              {(activeViolationType === 'TAB_SWITCH') && (
                <span className="bg-rose-950 px-3 py-1 rounded-full text-sm font-bold border border-rose-500/30">
                  Warning {violationCount} of 3
                </span>
              )}
            </p>
          </div>

          <p className="text-zinc-400 text-sm mb-8">
            This violation has been recorded. Continuing to trigger proctoring alerts will result in automatic termination of your interview.
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
