import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../errors/ApiError';

const validateBody = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    next(ApiError.badRequest('Validation failed', result.error.issues));
    return;
  }

  req.body = result.data;
  next();
};

export default validateBody;
