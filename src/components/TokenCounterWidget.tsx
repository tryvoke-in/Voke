import React, { useEffect, useState } from 'react';
import { useTokenCounter } from '@/contexts/TokenContext';
import { Activity, X, Play, Square, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AUTHORIZED_EMAILS, isLocalhost } from '@/utils/devTools';

export const TokenCounterWidget: React.FC = () => {
  const { isTracking, tokenData, startTracking, stopTracking, resetCounter } = useTokenCounter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const checkDev = async () => {
      if (isLocalhost) {
        setIsDev(true);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase();
      if (email && AUTHORIZED_EMAILS.includes(email)) {
        setIsDev(true);
      }
    };
    checkDev();
  }, []);

  if (!isDev) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Open Token Counter"
      >
        <Activity size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-[#0d0e17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Activity size={18} className="text-violet-400" />
          Token Tracker
        </div>
        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Status & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-sm font-medium text-zinc-300">
              {isTracking ? 'Recording' : 'Paused'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!isTracking ? (
              <button onClick={startTracking} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors">
                <Play size={16} />
              </button>
            ) : (
              <button onClick={stopTracking} className="p-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors">
                <Square size={16} />
              </button>
            )}
            <button onClick={resetCounter} className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors" title="Reset Counter">
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Input Tokens</div>
            <div className="text-lg font-black text-amber-400">{tokenData.inputTokens.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Output Tokens</div>
            <div className="text-lg font-black text-violet-400">{tokenData.outputTokens.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Usage</div>
          <div className="text-2xl font-black text-white tracking-tight">{tokenData.totalTokens.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
