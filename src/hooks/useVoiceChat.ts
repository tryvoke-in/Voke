import { useMemo } from "react";

interface UseVoiceChatOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}

/**
 * Lightweight, build-safe stub for voice chat.
 *
 * This keeps the API used in InterviewNew.tsx but does not rely on
 * any browser-only APIs during build/SSR, so Vercel can compile.
 */
export function useVoiceChat({ onTranscript, onError }: UseVoiceChatOptions = {}) {
  // In the future you can implement real speech recognition / TTS here.
  // For now we provide no-op implementations that are safe on the server.

  return useMemo(
    () => ({
      isListening: false,
      speak: (text: string) => {
        // Optional: you can implement Text-to-Speech on the client here.
        // We keep it a no-op to avoid any runtime issues.
        void text;
      },
      stopListening: () => {
        // No-op stub
      },
      stopSpeaking: () => {
        // No-op stub
      },
    }),
    [onTranscript, onError]
  );
}
