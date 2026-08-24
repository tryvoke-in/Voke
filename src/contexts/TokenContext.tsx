import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TokenData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface TokenContextType {
  isTracking: boolean;
  tokenData: TokenData;
  startTracking: () => void;
  stopTracking: () => void;
  resetCounter: () => void;
  addTokens: (input: number, output: number) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'voke_token_counter_state';

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.isTracking || false;
    }
    return false;
  });

  const [tokenData, setTokenData] = useState<TokenData>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.tokenData || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ isTracking, tokenData }));
  }, [isTracking, tokenData]);

  const startTracking = () => setIsTracking(true);
  const stopTracking = () => setIsTracking(false);
  const resetCounter = () => setTokenData({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });

  const addTokens = (input: number, output: number) => {
    if (!isTracking) return;
    setTokenData(prev => ({
      inputTokens: prev.inputTokens + input,
      outputTokens: prev.outputTokens + output,
      totalTokens: prev.totalTokens + input + output,
    }));
  };

  useEffect(() => {
    const handleAddTokens = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        addTokens(customEvent.detail.input || 0, customEvent.detail.output || 0);
      }
    };
    window.addEventListener('voke:add-tokens', handleAddTokens);
    return () => window.removeEventListener('voke:add-tokens', handleAddTokens);
  }, [isTracking]);

  return (
    <TokenContext.Provider value={{ isTracking, tokenData, startTracking, stopTracking, resetCounter, addTokens }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenCounter = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenCounter must be used within a TokenProvider');
  }
  return context;
};
