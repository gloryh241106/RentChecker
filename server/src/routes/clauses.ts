import { Router } from 'express';
import type { RequestHandler } from 'express';

// The limit runs first, so an invalid body counts towards it (API.md). The path is complete,
// because Express forgets a mount path before a failed request is logged.
export function createClausesRouter(
  rateLimit: RequestHandler,
  matchController: RequestHandler,
): Router {
  const router = Router();
  router.post('/api/clauses/match', rateLimit, matchController);
  return router;
}
