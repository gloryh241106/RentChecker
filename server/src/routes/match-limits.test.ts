import type { Express } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { body, makeMatchApp, postMatch } from '../../test-support/match-harness.js';

const WINDOW_MS = 10 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

async function statuses(count: number, send: () => Promise<{ status: number }>) {
  const seen: number[] = [];
  for (let index = 0; index < count; index += 1) seen.push((await send()).status);
  return seen;
}

const all = (count: number, status: number): number[] => Array<number>(count).fill(status);

const matchFrom = (app: Express, address: string) =>
  request(app).post('/api/clauses/match').set('X-Forwarded-For', address).send(body());

describe('API errors, rate limit', () => {
  it('API health is not limited after 20 match requests (T-117)', async () => {
    const { app } = makeMatchApp();
    expect(await statuses(20, () => postMatch(app, body()))).toEqual(all(20, 200));
    expect(await statuses(25, () => request(app).get('/api/health'))).toEqual(all(25, 200));
  });

  it('API errors the 21st request is 429, then 10 minutes later 200 (T-144)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { app } = makeMatchApp();
    expect(await statuses(20, () => postMatch(app, body()))).toEqual(all(20, 200));
    vi.setSystemTime(Date.now() + WINDOW_MS - 1000);
    const limited = await postMatch(app, body());
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many match requests. Try again in a few minutes.',
      },
    });
    vi.setSystemTime(Date.now() + 1000);
    expect((await postMatch(app, body())).status).toBe(200);
  });

  it('API errors an invalid body counts towards the limit (T-144)', async () => {
    const { app } = makeMatchApp();
    expect(await statuses(20, () => postMatch(app, {}))).toEqual(all(20, 400));
    expect((await postMatch(app, {})).status).toBe(429);
  });

  it('API errors each client is counted by its last forwarded address (T-144)', async () => {
    const { app } = makeMatchApp();
    // A client can write earlier hops itself, so a changing one must not reset its count.
    let hop = 0;
    const send = () => matchFrom(app, `10.0.0.${String((hop += 1))}, 203.0.113.7`);
    expect(await statuses(20, send)).toEqual(all(20, 200));
    expect((await send()).status).toBe(429);
    expect((await matchFrom(app, '203.0.113.8')).status).toBe(200);
  });

  it('API errors two apps do not share a counter (T-144)', async () => {
    const first = makeMatchApp().app;
    await statuses(21, () => postMatch(first, body()));
    expect((await postMatch(makeMatchApp().app, body())).status).toBe(200);
  });
});

describe('API errors, body size', () => {
  const sendBytes = (bytes: number) =>
    request(makeMatchApp().app)
      .post('/api/clauses/match')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body()).padEnd(bytes, ' '));

  it('API errors a match body of 204,801 bytes is 413, 200,000 is not (T-143)', async () => {
    const tooBig = await sendBytes(204_801);
    expect(tooBig.status).toBe(413);
    expect(tooBig.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect((await sendBytes(200_000)).status).toBe(200);
  });
});
