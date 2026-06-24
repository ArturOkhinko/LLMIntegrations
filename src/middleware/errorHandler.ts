import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import logger from '../utils/logger';

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    logger.warn(
      {
        err: err.message, details: err.details, path: req.path, method: req.method,
      },
      'Request rejected',
    );

    res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled request error');

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
    },
  });
};

export default errorHandler;
