import { Router } from 'express';

export interface HealthFlags {
  aiConfigured: boolean;
  cloudSaveConfigured: boolean;
}

export function createHealthRouter(flags: HealthFlags): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiConfigured: flags.aiConfigured,
      cloudSaveConfigured: flags.cloudSaveConfigured,
    });
  });
  return router;
}
