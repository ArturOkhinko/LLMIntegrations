import { z } from 'zod';

export const ALLOWED_MODELS = ['claude-sonnet-4-20250514', 'gpt-5-mini'] as const;

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(100_000),
});

export const chatRequestSchema = z
  .object({
    model: z.enum(ALLOWED_MODELS),
    max_tokens: z.number().int().positive().max(4096)
      .default(256),
    stream: z.boolean().default(false),
    messages: z.array(messageSchema).min(1),
  })
  .strict();

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
