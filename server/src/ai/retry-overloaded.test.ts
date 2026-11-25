import { describe, expect, it, vi } from 'vitest';
import { item } from '../../test-support/match-harness.js';
import { AiClientError } from './clause-matcher.js';
import type { AiAnswer, ClauseMatcher } from './clause-matcher.js';
import { RETRY_DELAY_MS, retryWhenOverloaded } from './retry-overloaded.js';

const ANSWERS: readonly AiAnswer[] = [{ itemId: 'd1', answer: 'none', quote: null }];
const overloaded = () => new AiClientError('HTTP_STATUS', 503);

/** A matcher that gives each outcome in turn. An error is thrown. */
function scripted(...outcomes: (Error | readonly AiAnswer[])[]) {
  const findClauses = vi.fn<ClauseMatcher['findClauses']>(() => {
    const next = outcomes.shift();
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next ?? []);
  });
  return { findClauses, matcher: retryWhenOverloaded({ findClauses }) };
}

const ask = (matcher: ClauseMatcher, signal = new AbortController().signal) =>
  matcher.findClauses({ leaseText: 'A lease', items: [item('d1')], signal });

describe('retry when Gemini is overloaded', () => {
  it('asks again after 503 and returns the second answer (T-218)', async () => {
    const { matcher, findClauses } = scripted(overloaded(), ANSWERS);
    expect(await ask(matcher)).toEqual(ANSWERS);
    expect(findClauses).toHaveBeenCalledTimes(2);
    expect(findClauses.mock.calls[0]).toEqual(findClauses.mock.calls[1]);
  });

  it('waits before the second call (T-218)', async () => {
    const { matcher } = scripted(overloaded(), ANSWERS);
    const startedAt = performance.now();
    await ask(matcher);
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(RETRY_DELAY_MS - 50);
  });

  it('gives up after a second 503 (T-218)', async () => {
    const { matcher, findClauses } = scripted(overloaded(), overloaded(), ANSWERS);
    await expect(ask(matcher)).rejects.toMatchObject({ httpStatus: 503 });
    expect(findClauses).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['429', new AiClientError('HTTP_STATUS', 429)],
    ['500', new AiClientError('HTTP_STATUS', 500)],
    ['invalid reply', new AiClientError('INVALID_REPLY')],
    ['failed request', new AiClientError('REQUEST_FAILED')],
    ['unexpected error', new TypeError('unexpected')],
  ])('does not ask again after %s (T-219)', async (_name, error) => {
    const { matcher, findClauses } = scripted(error, ANSWERS);
    await expect(ask(matcher)).rejects.toBe(error);
    expect(findClauses).toHaveBeenCalledTimes(1);
  });

  it('AI_TIMEOUT an abort during the wait ends it without a second call (T-219)', async () => {
    const { matcher, findClauses } = scripted(overloaded(), ANSWERS);
    const controller = new AbortController();
    const pending = ask(matcher, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(findClauses).toHaveBeenCalledTimes(1);
  });
});
