
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'processing';
  content: string;
  timestamp: Date;
  hasImage?: boolean;
  reportId?: number;
}

export type ConnectionHealth = 'connected' | 'disconnected' | 'polling';
