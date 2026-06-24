import { ApiError } from '../errors/ApiError';
import { anthropicProvider } from './anthropic.provider';
import { openaiProvider } from './openai.provider';
import { Provider } from './types';

const registry: Record<string, Provider> = {
  'claude-sonnet-4-20250514': anthropicProvider,
  'gpt-5-mini': openaiProvider,
};

export const resolveProvider = (model: string): Provider => {
  const provider = registry[model];

  if (!provider) {
    throw ApiError.badRequest(`Unsupported model: ${model}`);
  }

  return provider;
};
