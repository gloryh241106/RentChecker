import type { Express } from 'express';
import { createApp } from './app.js';
import { parseConfig } from './config.js';
import type { AppConfig, Env } from './config.js';
import { createJsonLogger } from './logging/logger.js';
import type { LogSink, Logger } from './logging/logger.js';

export interface Runtime {
  app: Express;
  config: AppConfig;
  logger: Logger;
}

// Shared by server/src/index.ts and api/index.ts, the only files that touch process.
export function createRuntime(env: Env, sink: LogSink): Runtime {
  const config = parseConfig(env);
  const logger = createJsonLogger(sink);
  const app = createApp({
    aiConfigured: config.aiConfigured,
    cloudSaveConfigured: config.cloudSaveConfigured,
    logger,
  });
  return { app, config, logger };
}
