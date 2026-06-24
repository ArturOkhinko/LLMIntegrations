import config from '../config';
import { ChatRequestDto } from '../schemas/chat.schema';
import { ChatResult } from '../types/chat';
import { Cost } from '../types/cost';
import { StreamEvent } from '../types/stream';
import { AnthropicMessageResponse, AnthropicStreamEvent } from './anthropic.types';
import { postJson, streamSse } from './httpClient';
import { Provider } from './types';

interface AnthropicCostFields {
  input_cost?: number;
  output_cost?: number;
  total_cost?: number;
}

const toProviderCost = (usage: AnthropicCostFields): Cost | undefined => {
  if (usage.total_cost === undefined) {
    return undefined;
  }

  return {
    inputCost: usage.input_cost ?? 0,
    outputCost: usage.output_cost ?? 0,
    totalCost: usage.total_cost,
    currency: 'RUB',
    source: 'provider',
  };
};

const MESSAGES_ENDPOINT = '/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const buildUrl = (): string => `${config.llm.baseUrl}${MESSAGES_ENDPOINT}`;

const buildHeaders = (): Record<string, string> => ({
  'x-api-key': config.llm.apiKey,
  'anthropic-version': ANTHROPIC_VERSION,
});

const extractText = (content: AnthropicMessageResponse['content']): string => content
  .filter((block) => block.type === 'text')
  .map((block) => block.text)
  .join('');

const toChatResult = (response: AnthropicMessageResponse): ChatResult => ({
  model: response.model,
  content: extractText(response.content),
  usage: {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  },
  cost: toProviderCost(response.usage),
});

const createMessage = async (dto: ChatRequestDto): Promise<ChatResult> => {
  const response = await postJson<AnthropicMessageResponse>(buildUrl(), buildHeaders(), {
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
    },
    signal,
  );

  let inputTokens = 0;
  let outputTokens = 0;
  let cost: Cost | undefined;

  for await (const event of events) {
    const parsed = event as AnthropicStreamEvent;

    if (parsed.type === 'message_start') {
      inputTokens = parsed.message.usage.input_tokens;
      outputTokens = parsed.message.usage.output_tokens;
    } else if (parsed.type === 'content_block_delta' && parsed.delta.type === 'text_delta') {
      yield { type: 'delta', text: parsed.delta.text ?? '' };
    } else if (parsed.type === 'message_delta') {
      outputTokens = parsed.usage.output_tokens;
      cost = toProviderCost(parsed.usage);
    }
  }

  yield {
    type: 'usage',
    usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
    cost,
  };
}

export const anthropicProvider: Provider = {
  createMessage,
  streamMessage,
};
