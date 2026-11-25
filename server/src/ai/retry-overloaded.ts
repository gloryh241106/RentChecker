import { setTimeout as wait } from 'node:timers/promises';
import { AiClientError } from './clause-matcher.js';
import type { ClauseMatcher } from './clause-matcher.js';

const OVERLOADED = 503;
// BACKEND.md
export const RETRY_DELAY_MS = 1_000;

const isOverloaded = (error: unknown): boolean =>
  error instanceof AiClientError && error.httpStatus === OVERLOADED;

/**
 * Asks a second time when the model is overloaded, and only then. The signal of the question also
 * ends the wait, so the 20 second limit covers both calls.
 */
export function retryWhenOverloaded(matcher: ClauseMatcher): ClauseMatcher {
  return {
    async findClauses(question) {
      try {
        return await matcher.findClauses(question);
      } catch (error) {
        if (!isOverloaded(error)) throw error;
        await wait(RETRY_DELAY_MS, undefined, { signal: question.signal });
        return matcher.findClauses(question);
      }
    },
  };
}
