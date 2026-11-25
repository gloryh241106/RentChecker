import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import type { ClauseMatcher } from './ai/clause-matcher.js';
import type { PromptReader } from './ai/prompt-reader.js';
import { createAssistantController } from './controllers/assistant-controller.js';
import { createMatchController } from './controllers/match-controller.js';
import type { Logger } from './logging/logger.js';
import { createRequestLogger } from './logging/request-logger.js';
import { createErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createMatchRateLimit } from './middleware/match-rate-limit.js';
import { createAssistantRouter } from './routes/assistant.js';
import { createClausesRouter } from './routes/clauses.js';
import { createHealthRouter } from './routes/health.js';
import { CSP_DIRECTIVES } from './security/csp.js';
import { createAssistantService } from './services/assistant-service.js';
import { createClauseService } from './services/clause-service.js';
import { matchByKeyword } from './services/keyword-matcher.js';
import type { KeywordMatcher } from './services/keyword-matcher.js';
import { mountClient } from './static-client.js';

// 200 KB (API.md).
export const MAX_BODY_BYTES = 204_800;

export interface AppOptions {
  aiConfigured: boolean;
  cloudSaveConfigured: boolean;
  logger: Logger;
  /** Absent when AI is not configured. */
  clauseMatcher?: ClauseMatcher | undefined;
  /** Absent when AI is not configured. */
  promptReader?: PromptReader | undefined;
  /** Set only by tests. Keyword matching has one real implementation. */
  keywordMatcher?: KeywordMatcher;
  staticDir?: string | undefined;
}

// Middleware order is the one in BACKEND.md. The request logger sits before the body
// parser so a rejected body is still logged.
export function createApp(options: AppOptions): Express {
  const { clauseMatcher, promptReader, logger, keywordMatcher = matchByKeyword } = options;
  const clauseService = createClauseService({
    clauseMatcher,
    keywordMatcher,
    logger,
  });
  const assistantService = createAssistantService({ promptReader, logger });
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { useDefaults: false, directives: CSP_DIRECTIVES } }));
  app.use(createRequestLogger(logger));
  app.use(express.json({ limit: MAX_BODY_BYTES }));
  app.use(createClausesRouter(createMatchRateLimit(), createMatchController(clauseService)));
  app.use(
    createAssistantRouter(createMatchRateLimit(), createAssistantController(assistantService)),
  );
  app.use('/api', createHealthRouter(options));
  app.use('/api', notFoundHandler);
  if (options.staticDir) mountClient(app, options.staticDir);
  app.use(createErrorHandler(logger));
  return app;
}
