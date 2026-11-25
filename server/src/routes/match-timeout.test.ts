import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAINT_QUOTE,
  body,
  fakeMatcher,
  makeMatchApp,
  postMatch,
} from '../../test-support/match-harness.js';
import type { Script } from '../../test-support/match-harness.js';

beforeEach(() => {
  // Only the timers the service uses. The HTTP server needs the rest to be real.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
});

// Starts a request and waits, without moving time, until the fake has been called.
async function start(script: Script) {
  let reportCall: (signal: AbortSignal) => void = () => undefined;
  const called = new Promise<AbortSignal>((resolve) => {
    reportCall = resolve;
  });
  const matcher = fakeMatcher((question) => {
    reportCall(question.signal);
    return script(question);
  });
  const { app } = makeMatchApp({ clauseMatcher: matcher });
  const response = postMatch(app, body());
  return { matcher, response, signal: await called };
}

describe('AI timeout', () => {
  it('NFR-3 a client that ignores the abort times out at 20 s (T-129)', async () => {
    const { matcher, response, signal } = await start(() => new Promise(() => undefined));
    const onAbort = vi.fn();
    signal.addEventListener('abort', onAbort);
    await vi.advanceTimersByTimeAsync(19_999);
    expect(onAbort).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    const res = await response;
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ mode: 'keyword', warnings: ['AI_TIMEOUT'] });
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(matcher.findClauses).toHaveBeenCalledTimes(1);
  });

  it('AI_TIMEOUT a client that rejects on abort is a timeout, not unavailable (T-129)', async () => {
    const { response } = await start(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
    );
    await vi.advanceTimersByTimeAsync(20_000);
    expect((await response).body.warnings).toEqual(['AI_TIMEOUT']);
  });

  it('AI_TIMEOUT an answer at 19.9 s is used and the timer is cleared (T-130)', async () => {
    const { response, signal } = await start(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([{ itemId: 'd1', answer: 'covers', quote: PAINT_QUOTE }]);
          }, 19_900);
        }),
    );
    await vi.advanceTimersByTimeAsync(19_900);
    expect((await response).body).toMatchObject({ mode: 'ai', warnings: [] });
    expect(vi.getTimerCount()).toBe(0);
    expect(signal.aborted).toBe(false);
  });

  it('AI_UNAVAILABLE a failure clears the timer (T-128)', async () => {
    const { response } = await start(() => Promise.reject(new Error('x')));
    expect((await response).body.warnings).toEqual(['AI_UNAVAILABLE']);
    expect(vi.getTimerCount()).toBe(0);
  });
});
