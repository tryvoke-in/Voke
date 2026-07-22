export enum LiveStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface AudioVisualizerState {
  isUserSpeaking: boolean;
  isAiSpeaking: boolean;
  volume: number;
}

export interface MessageLog {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}
