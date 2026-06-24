import { ChatRequestDto } from '../schemas/chat.schema';
import { ChatResult } from '../types/chat';
import { StreamEvent } from '../types/stream';

export interface Provider {
  createMessage(dto: ChatRequestDto): Promise<ChatResult>;
  streamMessage(dto: ChatRequestDto, signal: AbortSignal): AsyncGenerator<StreamEvent>;
}
