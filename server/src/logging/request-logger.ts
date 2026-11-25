import { randomUUID } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import type { MatchResponse } from '../../../shared/src/index.js';
import type { Logger } from './logger.js';

type MatchOutcome = Pick<MatchResponse, 'mode' | 'warnings'>;

const matchOutcomes = new WeakMap<Response, MatchOutcome>();

// Copies the two fields that may be logged. The matches hold quotes (NFR-2).
export function noteMatchOutcome(res: Response, { mode, warnings }: MatchOutcome): void {
  matchOutcomes.set(res, { mode, warnings });
}

export function getRequestId(res: Response): string | undefined {
  const id: unknown = res.locals.requestId;
  return typeof id === 'string' ? id : undefined;
}

// The route pattern when one matched, else the path. Never the query string.
function routeOf(req: Request): string {
  const pattern: unknown = req.route?.path;
  if (typeof pattern === 'string') return req.baseUrl + pattern;
  return req.originalUrl.split('?', 1)[0] ?? '';
}

// Logs method, route, status, duration and id, and for a match the mode and warning codes.
// No body, headers or query (NFR-2).
export function createRequestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    res.locals.requestId = requestId;
    res.on('finish', () => {
      logger.info('request', {
        requestId,
        method: req.method,
        route: routeOf(req),
        status: res.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
        ...matchOutcomes.get(res),
      });
    });
    next();
  };
}
