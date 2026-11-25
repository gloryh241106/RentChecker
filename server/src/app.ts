import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import type { Logger } from './logging/logger.js';
import { createRequestLogger } from './logging/request-logger.js';
import { createErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createHealthRouter } from './routes/health.js';
import { CSP_DIRECTIVES } from './security/csp.js';
import { mountClient } from './static-client.js';

// 200 KB (API.md).
export const MAX_BODY_BYTES = 204_800;

export interface AppOptions {
  aiConfigured: boolean;
  cloudSaveConfigured: boolean;
  logger: Logger;
  staticDir?: string;
}

// Middleware order is the one in BACKEND.md. The request logger sits before the body
// parser so a rejected body is still logged.
export function createApp(options: AppOptions): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { useDefaults: false, directives: CSP_DIRECTIVES } }));
  app.use(createRequestLogger(options.logger));
  app.use(express.json({ limit: MAX_BODY_BYTES }));
  app.use('/api', createHealthRouter(options));
  app.use('/api', notFoundHandler);
  if (options.staticDir) mountClient(app, options.staticDir);
  app.use(createErrorHandler(options.logger));
  return app;
}
