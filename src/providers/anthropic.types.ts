export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  input_cost?: number;
  output_cost?: number;
  total_cost?: number;
}

export interface AnthropicTextBlock {
  type: string;
  text: string;
}

export interface AnthropicMessageResponse {
  id: string;
  model: string;
  role: 'assistant';
  content: AnthropicTextBlock[];
  stop_reason: string | null;
  usage: AnthropicUsage;
}

export interface AnthropicStreamMessageStart {
  type: 'message_start';
  message: { usage: AnthropicUsage };
}

export interface AnthropicStreamContentDelta {
  type: 'content_block_delta';
  delta: { type: string; text?: string };
}

export interface AnthropicStreamMessageDelta {
  type: 'message_delta';
  usage: {
    output_tokens: number;
    input_cost?: number;
    output_cost?: number;
    total_cost?: number;
  };
}

export type AnthropicStreamEvent =
  | AnthropicStreamMessageStart
  | AnthropicStreamContentDelta
  | AnthropicStreamMessageDelta;
