import express, { Application, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import chatRoutes from './routes/chat.routes';

const app: Application = express();

app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/', chatRoutes);

app.use(errorHandler);

export default app;
