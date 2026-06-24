import { Response } from 'express';

export const initSse = (res: Response): void => {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
};

export const sendSseData = (res: Response, payload: unknown): void => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const sendSseDone = (res: Response): void => {
  res.write('data: [DONE]\n\n');
};
