import { Cost } from './cost';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  model: string;
  content: string;
  usage: TokenUsage;
  cost?: Cost;
}
