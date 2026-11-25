import { Router } from 'express';
import type { RequestHandler } from 'express';

// The limit runs first and the path is complete, as for the match route.
export function createAssistantRouter(
  rateLimit: RequestHandler,
  assistantController: RequestHandler,
): Router {
  const router = Router();
  router.post('/api/assistant/read', rateLimit, assistantController);
  return router;
}
