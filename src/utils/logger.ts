import path from 'path';
import pino, { TransportTargetOptions } from 'pino';
import config from '../config';

const logFilePath = path.resolve(process.cwd(), config.logFile);

const fileTarget: TransportTargetOptions = {
  target: 'pino/file',
  level: config.logLevel,
  options: { destination: logFilePath, mkdir: true },
};

const prettyTarget: TransportTargetOptions = {
  target: 'pino-pretty',
  level: config.logLevel,
  options: { destination: 1, colorize: true, translateTime: 'SYS:standard' },
};

const targets: TransportTargetOptions[] = config.nodeEnv === 'production'
  ? [fileTarget]
  : [fileTarget, prettyTarget];

const logger = pino(
  {
    level: config.logLevel,
    base: { service: 'llm-integrations' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({ targets }),
);

export default logger;
