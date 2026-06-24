import { resolveProvider } from '../providers/registry';
import { ChatRequestDto } from '../schemas/chat.schema';
import { ChatMessage, ChatResult, TokenUsage } from '../types/chat';
import { Cost } from '../types/cost';
import { calculateCost } from '../utils/cost';
import usageLogger from '../utils/usageLogger';
import { estimateTokens } from '../utils/tokenEstimator';

const TOKENIZER = 'tiktoken/o200k_base';

const resolveCost = (
  model: string,
  usage: TokenUsage,
  providerCost?: Cost,
): Cost | null => providerCost ?? calculateCost(model, usage);

const logUsage = (model: string, usage: TokenUsage, cost: Cost | null): void => {
  usageLogger.info(
    {
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      cost,
    },
    'Chat completed',
  );
};

const logApproximateUsage = (model: string, usage: TokenUsage, cost: Cost | null): void => {
  usageLogger.warn(
    {
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      cost,
      approximate: true,
      method: TOKENIZER,
    },
    'Stream incomplete: approximate usage',
  );
};

const estimateUsage = (messages: ChatMessage[], outputText: string): TokenUsage => {
  const inputTokens = messages.reduce((sum, message) => sum + estimateTokens(message.content), 0);
  const outputTokens = estimateTokens(outputText);

  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
};

export const sendChat = async (dto: ChatRequestDto): Promise<ChatResult> => {
  const provider = resolveProvider(dto.model);
  const result = await provider.createMessage(dto);
  const cost = resolveCost(dto.model, result.usage, result.cost);

  logUsage(dto.model, result.usage, cost);

  return { ...result, cost: cost ?? undefined };
};

export async function* streamChat(
  dto: ChatRequestDto,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const provider = resolveProvider(dto.model);
  let usage: TokenUsage | null = null;
  let providerCost: Cost | undefined;
  let outputText = '';

  try {
    for await (const event of provider.streamMessage(dto, signal)) {
      if (event.type === 'delta') {
        outputText += event.text;
        yield event.text;
      } else {
        usage = event.usage;
        providerCost = event.cost;
      }
    }
  } finally {
    if (usage) {
      logUsage(dto.model, usage, resolveCost(dto.model, usage, providerCost));
    } else {
      const estimated = estimateUsage(dto.messages, outputText);
      logApproximateUsage(dto.model, estimated, calculateCost(dto.model, estimated));
    }
  }
}
