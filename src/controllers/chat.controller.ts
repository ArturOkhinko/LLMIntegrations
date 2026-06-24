import { Request, Response, NextFunction } from 'express';
import { ChatRequestDto } from '../schemas/chat.schema';
import { sendChat, streamChat } from '../services/chat.service';
import { initSse, sendSseData, sendSseDone } from '../utils/sse';

const isWritable = (res: Response): boolean => !res.writableEnded && !res.destroyed;

const handleNormal = async (dto: ChatRequestDto, res: Response): Promise<void> => {
  const result = await sendChat(dto);

  res.status(200).json({
    model: result.model,
    content: result.content,
    usage: result.usage,
    cost: result.cost ?? null,
  });
};

const handleStream = async (
  dto: ChatRequestDto,
  res: Response,
  signal: AbortSignal,
): Promise<void> => {
  for await (const text of streamChat(dto, signal)) {
    if (!res.headersSent) {
      initSse(res);
    }
    sendSseData(res, { text });
  }

  if (!res.headersSent) {
    initSse(res);
  }

  sendSseDone(res);
  res.end();
};

const handleChat = async (
  req: Request<unknown, unknown, ChatRequestDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const dto = req.body;

  if (!dto.stream) {
    try {
      await handleNormal(dto, res);
    } catch (err) {
      next(err);
    }
    return;
  }

  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    await handleStream(dto, res, abortController.signal);
  } catch (err) {
    if (abortController.signal.aborted) {
      return;
    }

    if (!res.headersSent) {
      next(err);
    } else if (isWritable(res)) {
      sendSseData(res, { error: 'stream_failed' });
      res.end();
    }
  }
};

export default handleChat;
