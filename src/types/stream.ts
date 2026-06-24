import { TokenUsage } from './chat';
import { Cost } from './cost';

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'usage'; usage: TokenUsage; cost?: Cost };
