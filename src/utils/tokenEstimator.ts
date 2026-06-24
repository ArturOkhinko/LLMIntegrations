import { get_encoding as getEncoding, Tiktoken } from 'tiktoken';

let encoder: Tiktoken | null = null;

const getEncoder = (): Tiktoken => {
  if (!encoder) {
    encoder = getEncoding('o200k_base');
  }

  return encoder;
};

export const estimateTokens = (text: string): number => {
  if (text.length === 0) {
    return 0;
  }

  return getEncoder().encode(text).length;
};
