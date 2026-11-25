import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createErrorHandler } from '../middleware/error-handler.js';
import { createJsonLogger } from './logger.js';
import { createRequestLogger } from './request-logger.js';

const MARKER = 'LEASE-MARKER-9c1d';

function makeApp() {
  const lines: string[] = [];
  const logger = createJsonLogger((line) => lines.push(line));
  const app = express();
  app.use(createRequestLogger(logger));
  app.use(express.json());
  app.get('/api/ok/:id', (_req, res) => {
    res.json({ ok: true });
  });
  app.post('/api/boom', () => {
    throw new TypeError(`database said ${MARKER}`);
  });
  app.use(createErrorHandler(logger));
  const entries = () => lines.map((line): Record<string, unknown> => JSON.parse(line));
  return { app, lines, entries };
}

const getWithSecrets = (app: express.Express) =>
  request(app).get('/api/ok/42?token=SECRET-QUERY').set('Authorization', 'Bearer SECRET-HDR');

describe('NFR-2 request logging', () => {
  it('NFR-2 logs method, route pattern, status, duration and id (T-147)', async () => {
    const { app, entries } = makeApp();
    await getWithSecrets(app);
    const [entry] = entries();
    expect(entry).toMatchObject({ level: 'info', event: 'request', method: 'GET', status: 200 });
    expect(entry?.route).toBe('/api/ok/:id');
    expect(typeof entry?.durationMs).toBe('number');
    expect(typeof entry?.requestId).toBe('string');
  });

  it('NFR-2 log lines hold no query value, header value or body (T-147)', async () => {
    const { app, lines } = makeApp();
    await getWithSecrets(app);
    await request(app).post('/api/ok/42').send({ leaseText: MARKER });
    const all = lines.join('');
    for (const secret of ['SECRET-QUERY', 'SECRET-HDR', MARKER]) {
      expect(all).not.toContain(secret);
    }
  });

  it('NFR-2 a 500 logs only the code and class name, and the body is generic (T-145)', async () => {
    const { app, lines, entries } = makeApp();
    const res = await request(app).post('/api/boom').send({ leaseText: MARKER });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    const body = JSON.stringify(res.body);
    for (const leak of [MARKER, 'TypeError', 'at ']) expect(body).not.toContain(leak);
    const failure = entries().find((entry) => entry.event === 'unexpected_error');
    expect(failure).toMatchObject({ code: 'INTERNAL_ERROR', errorClass: 'TypeError' });
    expect(lines.join('')).not.toContain(MARKER);
  });
});
