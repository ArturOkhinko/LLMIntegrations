import { getPricing } from '../config/pricing';
import { TokenUsage } from '../types/chat';
import { Cost } from '../types/cost';

const PER_THOUSAND = 1000;

export const calculateCost = (model: string, usage: TokenUsage): Cost | null => {
  const pricing = getPricing(model);

  if (!pricing) {
    return null;
  }

  const inputCost = (usage.inputTokens / PER_THOUSAND) * pricing.inputPer1K;
  const outputCost = (usage.outputTokens / PER_THOUSAND) * pricing.outputPer1K;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: pricing.currency,
    source: 'calculated',
  };
};
