import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, AlertOctagon } from 'lucide-react';

interface AntiCheatHookReturn {
  violationCount: number;
  AntiCheatOverlay: React.FC;
}

interface AntiCheatOptions {
  onTerminate?: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

export function useAntiCheat(options?: AntiCheatOptions): AntiCheatHookReturn {
  const [violationCount, setViolationCount] = useState(0);
  const [activeViolationType, setActiveViolationType] = useState<'TAB_SWITCH' | 'COPY_PASTE' | 'INSPECT' | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);

  const [isProctoringDisabled, setIsProctoringDisabled] = useState<boolean>(() => {
    return options?.disabled ?? (typeof window !== 'undefined' && localStorage.getItem('voke_dev_proctoring_disabled') === 'true');
  });

  useEffect(() => {
    if (options?.disabled !== undefined) {
      setIsProctoringDisabled(options.disabled);
    }
  }, [options?.disabled]);

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
    if (isProctoringDisabled || isTerminated || options?.isActive === false) return;
    
    setViolationCount(prev => {
      const newCount = prev + 1;
      
      // Auto-terminate on 3rd tab switch
      if (type === 'TAB_SWITCH' && newCount >= 3) {
        setIsTerminated(true);
        if (options?.onTerminate) {
          options.onTerminate();
        }
      }
      
      return newCount;
    });
    
    setActiveViolationType(type);
  }, [isProctoringDisabled, isTerminated, options?.isActive, options?.onTerminate]);

  const dismissWarning = useCallback(() => {
    setActiveViolationType(null);
  }, []);

  useEffect(() => {
    if (isProctoringDisabled || options?.isActive === false) return;

    // 1. Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('COPY_PASTE');
    };

    // 2. Prevent Copy/Cut/Paste
    const handleClipboard = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      handleViolation('COPY_PASTE');
    };

    // 3. Detect Tab Switching via Visibility API
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation('TAB_SWITCH');
      }
    };

    // 4. Block Inspect Element Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
      // Ctrl+Shift+I/J/C or Cmd+Option+I/J/C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
      // Ctrl+U or Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        handleViolation('INSPECT');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleClipboard, true);
    document.addEventListener('cut', handleClipboard, true);
    document.addEventListener('paste', handleClipboard, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleClipboard, true);
      document.removeEventListener('cut', handleClipboard, true);
      document.removeEventListener('paste', handleClipboard, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleViolation, isProctoringDisabled, options?.isActive]);

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
