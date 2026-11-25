import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  LEASE,
  MARKER,
  PAINT_QUOTE,
  PAINT_SENTENCE,
  body,
  item,
  makeMatchApp,
  matchWith,
  postMatch,
} from '../../test-support/match-harness.js';
import { createGeminiMatcher } from '../ai/gemini-client.js';

const KEY = 'test-key-value-91ab';
const LABEL = 'Repainting-label-44c0';

const throwing = (): never => {
  throw new TypeError(`${LEASE} ${LABEL} ${KEY}`);
};

function geminiReply() {
  const text = JSON.stringify({
    answers: [
      { itemId: 'd1', answer: 'covers', quote: PAINT_QUOTE },
      { itemId: 'd2', answer: 'covers', quote: `${MARKER} invented by the model` },
    ],
  });
  return Response.json({ candidates: [{ content: { parts: [{ text }] } }] });
}

const gemini = (fetchFn: typeof fetch) =>
  createGeminiMatcher({ apiKey: KEY, model: 'test-model' }, fetchFn);
const failing = gemini(() => Promise.reject(new TypeError(`${KEY} ${LEASE}`)));
const working = gemini(() => Promise.resolve(geminiReply()));
const payload = body(item('d1', LABEL), item('d2', LABEL));

describe('API errors, 500', () => {
  it('API errors a keyword matcher that throws gives a generic 500 (T-145)', async () => {
    const { app } = makeMatchApp({ keywordMatcher: throwing });
    const res = await postMatch(app, payload);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Try again later.' },
    });
  });
});

describe('NFR-2 privacy', () => {
  it('NFR-2 no 4xx or 5xx body holds the marker (T-146)', async () => {
    const { app } = makeMatchApp();
    const broken = makeMatchApp({ keywordMatcher: throwing }).app;
    const raw = (text: string) =>
      request(app).post('/api/clauses/match').set('Content-Type', 'application/json').send(text);
    const responses = [
      await raw(`{"leaseText": "${MARKER}`),
      await raw(JSON.stringify(payload).padEnd(204_801, ' ')),
      await postMatch(app, { leaseText: MARKER, items: [item(MARKER, '')] }),
      await postMatch(app, { ...payload, [MARKER]: MARKER }),
      await postMatch(app, { leaseText: [MARKER], items: [item(`${MARKER} `)] }),
      await postMatch(app, body(item(MARKER), item(MARKER))),
      await request(app).post('/api/nothing').send(payload),
      await postMatch(broken, payload),
    ];
    for (let index = 0; index < 18; index += 1) responses.push(await postMatch(app, payload));
    const errors = responses.filter(({ status }) => status >= 400);
    expect(new Set(errors.map(({ status }) => status))).toEqual(new Set([400, 404, 413, 429, 500]));
    for (const { text } of errors) expect(text).not.toContain(MARKER);
  });

  it('NFR-2 no log line holds the marker, a label, a quote or the key (T-147)', async () => {
    const runs = [
      { options: { clauseMatcher: working }, send: payload, status: 200 },
      { options: { clauseMatcher: failing }, send: payload, status: 200 },
      { options: { clauseMatcher: working }, send: { ...payload, [MARKER]: LABEL }, status: 400 },
      { options: { clauseMatcher: failing, keywordMatcher: throwing }, send: payload, status: 500 },
    ];
    for (const { options, send, status } of runs) {
      const { app, lines } = makeMatchApp(options);
      const res = await postMatch(app, send);
      expect(res.status).toBe(status);
      expect(lines.length).toBeGreaterThan(0);
      const output = lines.join('');
      for (const secret of [MARKER, LABEL, PAINT_QUOTE, PAINT_SENTENCE, KEY]) {
        expect(output).not.toContain(secret);
      }
      expect(res.text).not.toContain(KEY);
    }
  });

  it('NFR-2 the request line has the mode and the warning codes only (T-147)', async () => {
    const line = async (options: Parameters<typeof makeMatchApp>[0], send: object = payload) => {
      const { app, lines } = makeMatchApp(options);
      await postMatch(app, send);
      const entry: Record<string, unknown> = JSON.parse(lines.at(-1) ?? '{}');
      return entry;
    };
    const success = await line({ clauseMatcher: working });
    expect(success).toMatchObject({
      event: 'request',
      route: '/api/clauses/match',
      mode: 'ai',
      warnings: ['QUOTE_REJECTED'],
    });
    expect(Object.keys(success).sort()).toEqual(
      'durationMs event level method mode requestId route status time warnings'.split(' '),
    );
    const fallback = { mode: 'keyword', warnings: ['AI_UNAVAILABLE'] };
    expect(await line({ clauseMatcher: failing })).toMatchObject(fallback);
    const invalid = await line({ clauseMatcher: working }, {});
    expect(invalid).toMatchObject({ route: '/api/clauses/match', status: 400 });
    expect(invalid).not.toHaveProperty('mode');
  });
});

describe('API match, sources', () => {
  // The harness also checks every 200 response of the other match tests against the schema.
  it('API match every source is the mode, never user or sample (T-150)', async () => {
    const claimed = { itemId: 'd1', answer: 'covers', quote: PAINT_QUOTE, source: 'user' };
    const ai = await matchWith([claimed, { ...claimed, itemId: 'd2' }], item('d1'), item('d2'));
    const keyword = (await postMatch(makeMatchApp().app, body(item('d1'), item('d2')))).body;
    for (const { mode, matches } of [ai, keyword]) {
      expect(matches.map((match: { source: string }) => match.source)).toEqual([mode, mode]);
    }
    expect([ai.mode, keyword.mode]).toEqual(['ai', 'keyword']);
  });
});
