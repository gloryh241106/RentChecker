import type { MatchRequest, MatchWarning } from '../../../shared/src/index.js';
import { AiClientError } from '../ai/clause-matcher.js';
import type { AiAnswer, ClauseMatcher } from '../ai/clause-matcher.js';
import type { Logger } from '../logging/logger.js';

// API.md
export const AI_TIMEOUT_MS = 20_000;

export type AiOutcome =
  | { ok: true; answers: readonly AiAnswer[] }
  | { ok: false; warning: Extract<MatchWarning, 'AI_TIMEOUT' | 'AI_UNAVAILABLE'> };

export interface AiAccess {
  clauseMatcher: ClauseMatcher;
  logger: Logger;
}

// A wrong key and an outage look the same to the tenant, but not in the log (BACKEND.md).
function logFailure(logger: Logger, error: unknown): void {
  const known = error instanceof AiClientError;
  logger.error('ai_failure', {
    failure: known ? error.failure : 'UNEXPECTED',
    httpStatus: known ? error.httpStatus : undefined,
  });
}

/**
 * One call, no retry. An AI failure is an expected outcome, so it is returned (API.md). The race
 * ends the wait at 20 seconds even if the matcher ignores the abort signal.
 */
export async function askAi(
  { clauseMatcher, logger }: AiAccess,
  request: MatchRequest,
): Promise<AiOutcome> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<AiOutcome>((resolve) => {
    timer = setTimeout(() => {
      // Resolved before the abort, so the failure that the abort causes cannot win the race.
      resolve({ ok: false, warning: 'AI_TIMEOUT' });
      controller.abort();
    }, AI_TIMEOUT_MS);
  });
  const ask = async (): Promise<AiOutcome> => {
    const answers = await clauseMatcher.findClauses({ ...request, signal: controller.signal });
    return { ok: true, answers };
  };
  try {
    return await Promise.race([ask(), timeout]);
  } catch (error) {
    logFailure(logger, error);
    return { ok: false, warning: 'AI_UNAVAILABLE' };
  } finally {
    clearTimeout(timer);
  }
}
