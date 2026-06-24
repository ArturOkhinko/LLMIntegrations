export interface ModelPricing {
  inputPer1K: number;
  outputPer1K: number;
  currency: string;
}

const pricing: Record<string, ModelPricing> = {
  'claude-sonnet-4-20250514': { inputPer1K: 1.2, outputPer1K: 4.5, currency: 'RUB' },
  'gpt-5-mini': { inputPer1K: 0.07, outputPer1K: 0.6, currency: 'RUB' },
};

export const getPricing = (model: string): ModelPricing | null => pricing[model] ?? null;
