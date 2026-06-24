import path from 'path';
import pino from 'pino';
import config from '../config';

const usageLogPath = path.resolve(process.cwd(), config.usageLogFile);

const usageLogger = pino(
  {
    base: { service: 'llm-integrations', kind: 'usage' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    targets: [
      {
        target: 'pino/file',
        options: { destination: usageLogPath, mkdir: true },
      },
    ],
  }),
);

export default usageLogger;
