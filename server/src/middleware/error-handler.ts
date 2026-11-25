import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors.js';
import { getRequestId } from '../logging/request-logger.js';
import type { Logger } from '../logging/logger.js';

// Express and its body parser mark an error caused by the request with a 4xx status.
const isClientError = (error: unknown): boolean =>
  error instanceof Error &&
  'status' in error &&
  typeof error.status === 'number' &&
  error.status >= 400 &&
  error.status < 500;

const isTooLarge = (error: unknown): boolean =>
  error instanceof Error && 'type' in error && error.type === 'entity.too.large';

// Messages are fixed text. The original message can hold request input, so it is never used.
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isTooLarge(error)) {
    return new AppError('PAYLOAD_TOO_LARGE', 'The request body is larger than 200 KB');
  }
  if (isClientError(error)) {
    return new AppError('VALIDATION_ERROR', 'The request is malformed or is not valid JSON');
  }
  return new AppError('INTERNAL_ERROR', 'Something went wrong. Try again later.');
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', 'No such API route'));
};

// Expected errors show in the request log by status. Only unexpected ones are logged here.
export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const appError = toAppError(error);
    if (appError.code === 'INTERNAL_ERROR') {
      logger.error('unexpected_error', {
        requestId: getRequestId(res),
        code: appError.code,
        errorClass: error instanceof Error ? error.constructor.name : typeof error,
      });
    }
    res.status(appError.status).json(appError.toBody());
  };
}
