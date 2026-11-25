import { setTimeout as wait } from 'node:timers/promises';
import type { ClauseMatcher } from './clause-matcher.js';
import type { PromptReader } from './prompt-reader.js';
import { RETRY_DELAY_MS, isOverloaded } from './retry-overloaded.js';

// BACKEND.md
export const SLOW_AFTER_MS = 5_000;

type Ask<Reply> = (signal: AbortSignal) => Promise<Reply>;
type FirstRound = 'done' | 'overloaded' | 'slow';

async function watch(first: Promise<unknown>, signal: AbortSignal): Promise<FirstRound> {
  const ended = first.then(
    (): FirstRound => 'done',
    (error: unknown): FirstRound => (isOverloaded(error) ? 'overloaded' : 'done'),
  );
  return Promise.race([ended, wait<FirstRound>(SLOW_AFTER_MS, 'slow', { signal })]);
}

async function firstValidAnswer<Reply>(rounds: readonly Promise<Reply>[]): Promise<Reply> {
  try {
    return await Promise.any(rounds);
  } catch (error) {
    throw error instanceof AggregateError ? error.errors[0] : error;
  }
}

/** Asks a second time when the first round ends overloaded, or next to it when it is slow. */
async function askInRounds<Reply>(ask: Ask<Reply>, callerSignal: AbortSignal): Promise<Reply> {
  const finished = new AbortController();
  const signal = AbortSignal.any([callerSignal, finished.signal]);
  try {
    const first = ask(signal);
    const state = await watch(first, signal);
    if (state === 'done') return await first;
    if (state === 'overloaded') await wait(RETRY_DELAY_MS, undefined, { signal });
    return await firstValidAnswer([first, ask(signal)]);
  } finally {
    // Ends the round that lost and every wait, so nothing runs on after the answer.
    finished.abort();
  }
}

export function withSecondRound(matcher: ClauseMatcher): ClauseMatcher {
  return {
    findClauses: (question) =>
      askInRounds((signal) => matcher.findClauses({ ...question, signal }), question.signal),
  };
}

export function withSecondReadingRound(reader: PromptReader): PromptReader {
  return {
    readPrompt: (question) =>
      askInRounds((signal) => reader.readPrompt({ ...question, signal }), question.signal),
  };
}
