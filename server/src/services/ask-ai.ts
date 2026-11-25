import type { MatchWarning } from '../../../shared/src/index.js';
import { AiClientError } from '../ai/clause-matcher.js';
import type { Logger } from '../logging/logger.js';

// API.md
export const AI_TIMEOUT_MS = 20_000;

export type AiOutcome<Reply> =
  | { ok: true; reply: Reply }
  | { ok: false; warning: Extract<MatchWarning, 'AI_TIMEOUT' | 'AI_UNAVAILABLE'> };

// A wrong key and an outage look the same to the tenant, but not in the log (BACKEND.md).
function logFailure(logger: Logger, error: unknown): void {
  const known = error instanceof AiClientError;
  logger.error('ai_failure', {
    failure: known ? error.failure : 'UNEXPECTED',
    httpStatus: known ? error.httpStatus : undefined,
  });
}

/**
 * One call to the AI. An AI failure is an expected outcome, so it is returned (API.md). The race
 * ends the wait at 20 seconds even if the client ignores the abort signal.
 */
export async function askAi<Reply>(
  logger: Logger,
  call: (signal: AbortSignal) => Promise<Reply>,
): Promise<AiOutcome<Reply>> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<AiOutcome<Reply>>((resolve) => {
    timer = setTimeout(() => {
      // Resolved before the abort, so the failure that the abort causes cannot win the race.
      resolve({ ok: false, warning: 'AI_TIMEOUT' });
      controller.abort();
    }, AI_TIMEOUT_MS);
  });
  const ask = async (): Promise<AiOutcome<Reply>> => {
    const reply = await call(controller.signal);
    return { ok: true, reply };
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
