import { setTimeout as wait } from 'node:timers/promises';
import { AiClientError } from './clause-matcher.js';
import type { ClauseMatcher } from './clause-matcher.js';
import type { PromptReader } from './prompt-reader.js';

const OVERLOADED = 503;

// BACKEND.md
export const RETRY_DELAY_MS = 1_000;

const isOverloaded = (error: unknown): boolean =>
  error instanceof AiClientError && error.httpStatus === OVERLOADED;

/**
 * Asks a second time when the model is overloaded, and only then. The signal of the question also
 * ends the wait, so the 20 second limit covers both calls.
 */
async function retryOnce<Reply>(ask: () => Promise<Reply>, signal: AbortSignal): Promise<Reply> {
  try {
    return await ask();
  } catch (error) {
    if (!isOverloaded(error)) throw error;
    await wait(RETRY_DELAY_MS, undefined, { signal });
    return ask();
  }
}

export function retryWhenOverloaded(matcher: ClauseMatcher): ClauseMatcher {
  return {
    findClauses: (question) => retryOnce(() => matcher.findClauses(question), question.signal),
  };
}

export function retryReaderWhenOverloaded(reader: PromptReader): PromptReader {
  return {
    readPrompt: (question) => retryOnce(() => reader.readPrompt(question), question.signal),
  };
}
