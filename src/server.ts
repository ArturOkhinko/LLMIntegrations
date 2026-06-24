import app from './app';
import config from './config';
import logger from './utils/logger';

const server = app.listen(config.port, () => {
  logger.info(`Server listening on http://localhost:${config.port}`);
});

const shutdown = (signal: string): void => {
  logger.info(`${signal} received, shutting down`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default server;
