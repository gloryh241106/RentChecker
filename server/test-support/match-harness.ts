import type { Express } from 'express';
import request from 'supertest';
import { expect, vi } from 'vitest';
import { matchResponseSchema } from '../../shared/src/index.js';
import { aiReplySchema } from '../src/ai/answers.js';
import type { ClauseMatcher, ClauseQuestion } from '../src/ai/clause-matcher.js';
import { createApp } from '../src/app.js';
import type { AppOptions } from '../src/app.js';
import { createJsonLogger } from '../src/logging/logger.js';

export const MARKER = 'LEASE-MARKER-7f3a';
export const PAINT_SENTENCE = 'The tenant shall pay for painting on exit.';
export const PAINT_QUOTE = 'The tenant shall pay for painting on exit';
export const PET_QUOTE = 'Pets are welcome and no pet fee is due';
export const LEASE = `${MARKER} agreement for the flat.\n${PAINT_SENTENCE}\n${PET_QUOTE}.`;

/** Raw answers as a model would write them. They go through the same schema as a real reply. */
export type Script = (question: ClauseQuestion) => Promise<unknown[]>;

export function fakeMatcher(script: Script) {
  const findClauses = vi.fn<ClauseMatcher['findClauses']>(async (question) => {
    const answers = await script(question);
    return aiReplySchema.parse({ answers }).answers;
  });
  return { findClauses };
}

export const answering = (...answers: unknown[]) => fakeMatcher(() => Promise.resolve(answers));

export const item = (id: string, label = 'Repainting') => ({ id, label });

export const body = (...items: { id: string; label: string }[]) => ({
  leaseText: LEASE,
  items: items.length > 0 ? items : [item('d1')],
});

export function makeMatchApp(overrides: Partial<AppOptions> = {}) {
  const lines: string[] = [];
  const app = createApp({
    aiConfigured: overrides.clauseMatcher !== undefined,
    cloudSaveConfigured: false,
    logger: createJsonLogger((line) => lines.push(line)),
    ...overrides,
  });
  return { app, lines };
}

/** T-150: every 200 is checked against the response schema, which allows no other source. */
export async function postMatch(app: Express, payload: object) {
  const res = await request(app).post('/api/clauses/match').send(payload);
  if (res.status === 200) expect(matchResponseSchema.safeParse(res.body).error).toBeUndefined();
  return res;
}

/** One match run against a fake that gives these answers for the default lease. */
export async function matchWith(answers: unknown[], ...items: { id: string; label: string }[]) {
  const clauseMatcher = answering(...answers);
  const res = await postMatch(makeMatchApp({ clauseMatcher }).app, body(...items));
  expect(res.status).toBe(200);
  return res.body;
}
