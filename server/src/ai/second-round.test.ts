import { describe, expect, it, vi } from 'vitest';
import type { PromptReading } from '../../../shared/src/index.js';
import { item } from '../../test-support/match-harness.js';
import { AiClientError } from './clause-matcher.js';
import type { AiAnswer, ClauseMatcher } from './clause-matcher.js';
import { SLOW_AFTER_MS, withSecondReadingRound, withSecondRound } from './second-round.js';

vi.mock('node:timers/promises', () => ({
  setTimeout: (delay: number, value: unknown, { signal }: { signal: AbortSignal }) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(value), delay / 100);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason as Error);
      });
    }),
}));

const answered = (itemId: string): AiAnswer[] => [{ itemId, answer: 'none', quote: null }];
const failed = (status: number) => new AiClientError('HTTP_STATUS', status);
const BEFORE_SLOW = 0;
const AFTER_SLOW = SLOW_AFTER_MS / 100 + 40;

interface Step {
  after: number;
  outcome: AiAnswer[] | Error;
}

/** A matcher whose calls settle in turn, each after its own delay. */
function scripted(...steps: Step[]) {
  const signals: AbortSignal[] = [];
  const findClauses = vi.fn<ClauseMatcher['findClauses']>(({ signal }) => {
    signals.push(signal);
    const step = steps.shift();
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason as Error));
      if (!step) return;
      const { after, outcome } = step;
      setTimeout(() => (outcome instanceof Error ? reject(outcome) : resolve(outcome)), after);
    });
  });
  return { findClauses, signals, matcher: withSecondRound({ findClauses }) };
}

const ask = (matcher: ClauseMatcher, signal = new AbortController().signal) =>
  matcher.findClauses({ leaseText: 'A lease', items: [item('d1')], signal });

describe('second round when Gemini is slow or overloaded', () => {
  it('a quick answer needs one call (T-263)', async () => {
    const { matcher, findClauses } = scripted({ after: BEFORE_SLOW, outcome: answered('a') });
    expect(await ask(matcher)).toEqual(answered('a'));
    expect(findClauses).toHaveBeenCalledTimes(1);
  });

  it('a quick failure is passed on after one call (T-263)', async () => {
    const error = failed(429);
    const { matcher, findClauses } = scripted({ after: BEFORE_SLOW, outcome: error });
    await expect(ask(matcher)).rejects.toBe(error);
    expect(findClauses).toHaveBeenCalledTimes(1);
  });

  it('asks again when the first round ends overloaded (T-263)', async () => {
    const { matcher, findClauses } = scripted(
      { after: BEFORE_SLOW, outcome: failed(503) },
      { after: BEFORE_SLOW, outcome: answered('b') },
    );
    expect(await ask(matcher)).toEqual(answered('b'));
    expect(findClauses).toHaveBeenCalledTimes(2);
  });

  it('gives up when both rounds end overloaded (T-263)', async () => {
    const { matcher, findClauses } = scripted(
      { after: BEFORE_SLOW, outcome: failed(503) },
      { after: BEFORE_SLOW, outcome: failed(503) },
      { after: BEFORE_SLOW, outcome: answered('c') },
    );
    await expect(ask(matcher)).rejects.toMatchObject({ httpStatus: 503 });
    expect(findClauses).toHaveBeenCalledTimes(2);
  });

  it('the second call answers while the first hangs, and the first is aborted (T-263)', async () => {
    const { matcher, findClauses, signals } = scripted(
      { after: 60_000, outcome: answered('a') },
      { after: 0, outcome: answered('b') },
    );
    expect(await ask(matcher)).toEqual(answered('b'));
    expect(findClauses).toHaveBeenCalledTimes(2);
    expect(signals.every(({ aborted }) => aborted)).toBe(true);
  });

  it('the first call may still answer after the second fails (T-263)', async () => {
    const { matcher } = scripted(
      { after: AFTER_SLOW, outcome: answered('a') },
      { after: 0, outcome: failed(503) },
    );
    expect(await ask(matcher)).toEqual(answered('a'));
  });

  it('the failure of the first call counts when both fail (T-263)', async () => {
    const { matcher } = scripted(
      { after: AFTER_SLOW, outcome: failed(500) },
      { after: 0, outcome: failed(503) },
    );
    await expect(ask(matcher)).rejects.toMatchObject({ httpStatus: 500 });
  });

  it('AI_TIMEOUT an abort of the caller ends every call (T-263)', async () => {
    const { matcher, findClauses, signals } = scripted();
    const controller = new AbortController();
    const pending = ask(matcher, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(findClauses).toHaveBeenCalledTimes(1);
    expect(signals[0]?.aborted).toBe(true);
  });

  it('a prompt is read again in the same way (T-263)', async () => {
    const reading: PromptReading = { task: 'ask_lease', facts: [], doubts: [] };
    const readPrompt = vi
      .fn<(question: { prompt: string }) => Promise<PromptReading>>()
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValueOnce(reading);
    const question = { prompt: 'Who pays?', signal: new AbortController().signal };
    expect(await withSecondReadingRound({ readPrompt }).readPrompt(question)).toEqual(reading);
    expect(readPrompt.mock.calls.map(([{ prompt }]) => prompt)).toEqual(['Who pays?', 'Who pays?']);
  });
});
