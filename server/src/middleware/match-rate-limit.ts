import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { AppError } from '../errors.js';

// API.md
export const MATCH_LIMIT = 20;
export const MATCH_WINDOW_MS = 10 * 60 * 1000;

// Each call has its own in-memory counter, so each app instance counts alone (BACKEND.md).
export function createMatchRateLimit(): RequestHandler {
  return rateLimit({
    limit: MATCH_LIMIT,
    windowMs: MATCH_WINDOW_MS,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError('RATE_LIMITED', 'Too many match requests. Try again in a few minutes.'));
    },
  });
}
