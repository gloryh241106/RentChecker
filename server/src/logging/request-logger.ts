import { randomUUID } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import type { Logger } from './logger.js';

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

// Logs method, route, status, duration and id only. No body, headers or query (NFR-2).
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
      });
    });
    next();
  };
}
