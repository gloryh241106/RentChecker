import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assistantResponseSchema } from '../../../shared/src/index.js';
import type { PromptReading } from '../../../shared/src/index.js';
import { makeMatchApp } from '../../test-support/match-harness.js';
import { AiClientError } from '../ai/clause-matcher.js';
import type { PromptReader } from '../ai/prompt-reader.js';
import { MATCH_LIMIT } from '../middleware/match-rate-limit.js';
import { AI_TIMEOUT_MS } from '../services/ask-ai.js';

const PROMPT = 'My landlord kept 12,000 for painting. PROMPT-MARKER-4b1c';
const PAINTING = { kind: 'deduction', source: '12,000 for painting', label: 'painting' } as const;
const READING: PromptReading = { task: 'check_deductions', facts: [PAINTING], doubts: [] };
const BY_CODE = {
  mode: 'keyword',
  task: 'check_deductions',
  facts: [{ kind: 'deduction', source: 'My landlord kept 12,000 for painting', label: null }],
  doubts: [],
};

type Read = PromptReader['readPrompt'];

function setup(read?: Read) {
  const readPrompt = vi.fn<Read>(read);
  const promptReader = read && { readPrompt };
  return { readPrompt, ...makeMatchApp({ promptReader }) };
}

const answering = (reading: PromptReading) => setup(() => Promise.resolve(reading));

async function post(app: ReturnType<typeof setup>['app'], payload: object = { prompt: PROMPT }) {
  const res = await request(app).post('/api/assistant/read').send(payload);
  if (res.status === 200) expect(assistantResponseSchema.safeParse(res.body).error).toBeUndefined();
  return res;
}

afterEach(() => vi.useRealTimers());

describe('POST /api/assistant/read', () => {
  it('F9-R2 returns the task and the facts, with one AI call (T-246)', async () => {
    const { app, readPrompt } = answering(READING);
    const res = await post(app, { prompt: `  ${PROMPT}  ` });
    expect(res.body).toEqual({ mode: 'ai', warnings: [], ...READING });
    expect(readPrompt).toHaveBeenCalledTimes(1);
    expect(readPrompt.mock.calls[0]?.[0].prompt).toBe(PROMPT);
  });

  it.each([
    ['a number that is not there', { ...PAINTING, source: '45,000' }],
    ['a part of a number', { ...PAINTING, source: '2,000' }],
  ])('F9-AC3 %s is dropped with a warning (T-247)', async (_name, bad) => {
    const { app } = answering({ ...READING, facts: [PAINTING, bad] });
    const res = await post(app);
    expect(res.body.facts).toEqual([PAINTING]);
    expect(res.body.warnings).toEqual(['QUOTE_REJECTED']);
  });

  it('F9-R3 a doubt is checked too, and a label that is not there is ignored (T-247)', async () => {
    const { app } = answering({
      ...READING,
      facts: [{ ...PAINTING, label: 'cleaning' }],
      doubts: [
        { source: '99,999', reason: 'amount' },
        { source: '12,000', reason: 'amount' },
      ],
    });
    const res = await post(app);
    expect(res.body.facts).toEqual([{ ...PAINTING, label: null }]);
    expect(res.body.doubts).toEqual([{ source: '12,000', reason: 'amount' }]);
    expect(res.body.warnings).toEqual(['QUOTE_REJECTED']);
  });

  it('F9-AC4 without a key the prompt is read by code (T-248)', async () => {
    const res = await post(setup().app);
    expect(res.body).toEqual({ ...BY_CODE, warnings: ['AI_NOT_CONFIGURED'] });
  });

  it('F9-AC4 a failing AI service is logged without the prompt (T-248)', async () => {
    const { app, lines } = setup(() => Promise.reject(new AiClientError('HTTP_STATUS', 429)));
    const res = await post(app);
    expect(res.body).toEqual({ ...BY_CODE, warnings: ['AI_UNAVAILABLE'] });
    expect(lines.join('')).toContain('"failure":"HTTP_STATUS","httpStatus":429');
    expect(lines.join('')).not.toContain('PROMPT-MARKER');
  });

  it('F9-AC4 a slow AI service is given up after 20 seconds (T-248)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { app, readPrompt } = setup(() => new Promise(() => undefined));
    const pending = post(app);
    await vi.waitUntil(() => readPrompt.mock.calls.length === 1);
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS);
    expect((await pending).body.warnings).toEqual(['AI_TIMEOUT']);
    expect(readPrompt.mock.calls[0]?.[0].signal.aborted).toBe(true);
  });

  it.each([
    ['too short', { prompt: ' ab ' }, 'prompt must have at least 3 characters'],
    ['too long', { prompt: 'x'.repeat(2_001) }, 'prompt must have at most 2000 characters'],
    ['missing', {}, 'prompt is missing or has the wrong type'],
    ['unknown field', { prompt: PROMPT, leaseText: 'x' }, 'The request body has an unknown field'],
  ])('API a prompt that is %s is rejected (T-249)', async (_name, payload, message) => {
    const { app, readPrompt } = answering(READING);
    const res = await post(app, payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR', message });
    expect(readPrompt).not.toHaveBeenCalled();
  });

  it('API request 21 in 10 minutes is limited, and a match is not (T-249)', async () => {
    const { app, lines } = answering(READING);
    for (let sent = 0; sent < MATCH_LIMIT; sent += 1) await post(app);
    expect((await post(app)).status).toBe(429);
    expect((await request(app).post('/api/clauses/match').send({})).status).toBe(400);
    expect(lines.join('')).not.toContain('PROMPT-MARKER');
    expect(lines[0]).toContain('"route":"/api/assistant/read"');
  });
});
