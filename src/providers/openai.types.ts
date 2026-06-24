export interface OpenAiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cost?: number;
  completion_cost?: number;
  total_cost?: number;
}

export interface OpenAiChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface OpenAiCompletionResponse {
  id: string;
  model: string;
  choices: OpenAiChoice[];
  usage: OpenAiUsage;
}

export interface OpenAiStreamChoice {
  delta: { content?: string };
}

export interface OpenAiStreamChunk {
  choices: OpenAiStreamChoice[];
  usage?: OpenAiUsage;
}
