import type { Express } from 'express';
import { createGeminiMatcher } from './ai/gemini-client.js';
import { createGeminiPromptReader } from './ai/gemini-prompt-reader.js';
import { retryReaderWhenOverloaded, retryWhenOverloaded } from './ai/retry-overloaded.js';
import { createApp } from './app.js';
import { parseConfig } from './config.js';
import type { Env } from './config.js';
import { createJsonLogger } from './logging/logger.js';
import type { LogSink, Logger } from './logging/logger.js';

// The AI key stays inside createRuntime, so an entry file cannot log it (NFR-1).
export interface Runtime {
  app: Express;
  port: number;
  logger: Logger;
}

// Shared by server/src/index.ts and api/index.ts, the only files that touch process.
export function createRuntime(env: Env, sink: LogSink): Runtime {
  const { ai, aiConfigured, cloudSaveConfigured, port, staticDir } = parseConfig(env);
  const logger = createJsonLogger(sink);
  const app = createApp({
    aiConfigured,
    cloudSaveConfigured,
    logger,
    staticDir,
    clauseMatcher: ai && retryWhenOverloaded(createGeminiMatcher(ai, fetch)),
    promptReader: ai && retryReaderWhenOverloaded(createGeminiPromptReader(ai, fetch)),
  });
  return { app, port, logger };
}
