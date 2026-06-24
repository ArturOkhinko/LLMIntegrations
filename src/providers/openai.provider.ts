import config from '../config';
import { ChatRequestDto } from '../schemas/chat.schema';
import { ChatResult, TokenUsage } from '../types/chat';
import { Cost } from '../types/cost';
import { StreamEvent } from '../types/stream';
import { OpenAiCompletionResponse, OpenAiStreamChunk, OpenAiUsage } from './openai.types';
import { postJson, streamSse } from './httpClient';
import { Provider } from './types';

const COMPLETIONS_ENDPOINT = '/v1/chat/completions';

const buildUrl = (): string => `${config.llm.baseUrl}${COMPLETIONS_ENDPOINT}`;

const buildHeaders = (): Record<string, string> => ({
  authorization: `Bearer ${config.llm.apiKey}`,
});

const extractText = (choices: OpenAiCompletionResponse['choices']): string => choices
  .map((choice) => choice.message.content)
  .join('');

const toUsage = (usage: OpenAiUsage): TokenUsage => ({
  inputTokens: usage.prompt_tokens,
  outputTokens: usage.completion_tokens,
  totalTokens: usage.total_tokens,
});

const toProviderCost = (usage: OpenAiUsage): Cost | undefined => {
  if (usage.total_cost === undefined) {
    return undefined;
  }

  return {
    inputCost: usage.prompt_cost ?? 0,
    outputCost: usage.completion_cost ?? 0,
    totalCost: usage.total_cost,
    currency: 'RUB',
    source: 'provider',
  };
};

const toChatResult = (response: OpenAiCompletionResponse): ChatResult => ({
  model: response.model,
  content: extractText(response.choices),
  usage: toUsage(response.usage),
  cost: toProviderCost(response.usage),
});

const createMessage = async (dto: ChatRequestDto): Promise<ChatResult> => {
  const response = await postJson<OpenAiCompletionResponse>(buildUrl(), buildHeaders(), {
    model: dto.model,
    max_tokens: dto.max_tokens,
    messages: dto.messages,
    stream: false,
  });

  return toChatResult(response);
};

async function* streamMessage(
  dto: ChatRequestDto,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const events = streamSse(
    buildUrl(),
    buildHeaders(),
    {
      model: dto.model,
      max_tokens: dto.max_tokens,
      messages: dto.messages,
      stream: true,
      stream_options: { include_usage: true },
    },
    signal,
  );

  let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let cost: Cost | undefined;

  for await (const event of events) {
    const chunk = event as OpenAiStreamChunk;
    const content = chunk.choices?.[0]?.delta?.content;

    if (content) {
      yield { type: 'delta', text: content };
    }

    if (chunk.usage) {
      usage = toUsage(chunk.usage);
      cost = toProviderCost(chunk.usage);
    }
  }

  yield { type: 'usage', usage, cost };
}

export const openaiProvider: Provider = {
  createMessage,
  streamMessage,
};
