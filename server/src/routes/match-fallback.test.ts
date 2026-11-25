import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PAINT_QUOTE,
  PAINT_SENTENCE,
  body,
  fakeMatcher,
  item,
  makeMatchApp,
  postMatch,
} from '../../test-support/match-harness.js';
import type { Script } from '../../test-support/match-harness.js';
import { AiClientError } from '../ai/clause-matcher.js';
import { createRuntime } from '../bootstrap.js';

const KEYWORD_MATCH = { itemId: 'd1', state: 'verified', quote: PAINT_SENTENCE, source: 'keyword' };

const keywordResponse = (warning: string) => ({
  mode: 'keyword',
  warnings: [warning],
  matches: [KEYWORD_MATCH],
});

describe('FR-10 AI failure', () => {
  it.each<[string, Script]>([
    ['rejects', () => Promise.reject(new Error('provider down'))],
    ['answers with an invalid shape', () => Promise.resolve([{ answer: 'covers' }])],
    [
      'throws',
      () => {
        throw new TypeError('bug in the client');
      },
    ],
  ])('FR-10 a client that %s gives AI_UNAVAILABLE (T-128)', async (_name, script) => {
    const matcher = fakeMatcher(script);
    const { app, lines } = makeMatchApp({ clauseMatcher: matcher });
    const res = await postMatch(app, body());
    expect(res.status).toBe(200);
    expect(res.body).toEqual(keywordResponse('AI_UNAVAILABLE'));
    expect(matcher.findClauses).toHaveBeenCalledTimes(1);
    expect(lines.join('')).not.toContain('unexpected_error');
    expect(lines.join('')).toContain('"event":"ai_failure","failure":"UNEXPECTED"');
    expect(lines.join('')).not.toContain('provider down');
  });

  it('FR-10 the log tells a refused key from an outage (T-128)', async () => {
    const script = () => Promise.reject(new AiClientError('HTTP_STATUS', 403));
    const { app, lines } = makeMatchApp({ clauseMatcher: fakeMatcher(script) });
    await postMatch(app, body());
    expect(lines.join('')).toContain('"failure":"HTTP_STATUS","httpStatus":403');
  });

  it('FR-10 a failure gives only verified or unconfirmed, source keyword (T-128)', async () => {
    const clauseMatcher = fakeMatcher(() => Promise.reject(new Error('x')));
    const payload = body(item('d1'), item('d2', 'Pet fee'), item('d3', 'Parking'));
    const { matches } = (await postMatch(makeMatchApp({ clauseMatcher }).app, payload)).body;
    expect(matches).toEqual([
      KEYWORD_MATCH,
      { itemId: 'd2', state: 'unconfirmed', quote: null, source: 'keyword' },
      { itemId: 'd3', state: 'unconfirmed', quote: null, source: 'keyword' },
    ]);
  });
});

describe('FR-10 AI not configured', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([{}, { GEMINI_API_KEY: 'test-key' }, { GEMINI_MODEL: 'test-model' }])(
    'AI_NOT_CONFIGURED uses keywords and calls no AI (T-131, F2-AC7) %#',
    async (env) => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const { app } = createRuntime(env, () => undefined);
      const res = await postMatch(app, body());
      expect(res.status).toBe(200);
      expect(res.body).toEqual(keywordResponse('AI_NOT_CONFIGURED'));
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('API match uses the AI client when key and model are set (T-118)', async () => {
    const text = JSON.stringify({
      answers: [{ itemId: 'd1', answer: 'covers', quote: PAINT_QUOTE }],
    });
    const reply = { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] };
    const fetchSpy = vi.fn(() => Promise.resolve(Response.json(reply)));
    vi.stubGlobal('fetch', fetchSpy);
    const env = { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'test-model' };
    const res = await postMatch(createRuntime(env, () => undefined).app, body());
    expect(res.body).toMatchObject({ mode: 'ai', warnings: [] });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('FR-10 keyword mode over HTTP', () => {
  it('FR-10 Repainting finds the painting sentence (T-132, F2-AC8)', async () => {
    const res = await postMatch(makeMatchApp().app, body());
    expect(res.body.matches).toEqual([KEYWORD_MATCH]);
    expect(body().leaseText).toContain(res.body.matches[0].quote);
  });

  it.each([
    ['a negation', 'The tenant shall not pay for painting. The rest is agreed between us.'],
    ['a tie', 'The tenant pays for painting. The landlord pays for painting. All agreed here.'],
    ['no score', 'This lease has nothing about that work. It is only here to be long enough.'],
  ])('FR-10 %s is unconfirmed with a null quote (T-133, F2-AC9, F2-AC10)', async (_name, text) => {
    const payload = { leaseText: text, items: [item('d1')] };
    const res = await postMatch(makeMatchApp().app, payload);
    expect(res.body.matches).toEqual([
      { itemId: 'd1', state: 'unconfirmed', quote: null, source: 'keyword' },
    ]);
  });
});
