import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MAX_BODY_BYTES, createApp } from './app.js';
import type { AppOptions } from './app.js';
import { createJsonLogger } from './logging/logger.js';

const MARKER = 'LEASE-MARKER-7f3a';

function makeApp(overrides: Partial<AppOptions> = {}) {
  const lines: string[] = [];
  const app = createApp({
    aiConfigured: true,
    cloudSaveConfigured: false,
    logger: createJsonLogger((line) => lines.push(line)),
    ...overrides,
  });
  return { app, lines };
}

const paddedJson = (bytes: number): string => '{"a":1}'.padEnd(bytes, ' ');

describe('API health', () => {
  it('API health reports ok, key set, no database (T-115)', async () => {
    const res = await request(makeApp().app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', aiConfigured: true, cloudSaveConfigured: false });
  });

  it('API health reports aiConfigured false without a key (T-116)', async () => {
    const res = await request(makeApp({ aiConfigured: false }).app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ aiConfigured: false });
  });

  it('API health reports cloudSaveConfigured when a database is configured (T-115)', async () => {
    const res = await request(makeApp({ cloudSaveConfigured: true }).app).get('/api/health');
    expect(res.body).toMatchObject({ cloudSaveConfigured: true });
  });
});

describe('API errors', () => {
  it('API errors unknown GET path returns JSON 404 NOT_FOUND (T-142)', async () => {
    const res = await request(makeApp().app).get('/api/nothing');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'No such API route' } });
  });

  it('API errors unknown path answers every method with NOT_FOUND (T-142)', async () => {
    const { app } = makeApp();
    for (const res of [
      await request(app).post('/api/nothing').send({}),
      await request(app).delete('/api/nothing'),
      await request(app).post('/api/health').send({}),
    ]) {
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });

  it('API errors body of 204,801 bytes is 413, 200,000 bytes is not (T-143)', async () => {
    expect(MAX_BODY_BYTES).toBe(204_800);
    const { app } = makeApp();
    const tooBig = await request(app)
      .post('/api/nothing')
      .set('Content-Type', 'application/json')
      .send(paddedJson(204_801));
    expect(tooBig.status).toBe(413);
    expect(tooBig.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    const fits = await request(app)
      .post('/api/nothing')
      .set('Content-Type', 'application/json')
      .send(paddedJson(200_000));
    expect(fits.status).toBe(404);
  });

  it('API errors malformed JSON is 400 VALIDATION_ERROR without the input (T-146)', async () => {
    const res = await request(makeApp().app)
      .post('/api/nothing')
      .set('Content-Type', 'application/json')
      .send(`{"leaseText": "${MARKER}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body)).not.toContain(MARKER);
    expect(JSON.stringify(res.body)).not.toContain('Unexpected');
  });

  it('API errors a bad charset is 400, not 500', async () => {
    const res = await request(makeApp().app)
      .post('/api/nothing')
      .set('Content-Type', 'application/json; charset=nope')
      .send('{"a":1}');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('API errors a rejected body is still logged, without the marker (T-147)', async () => {
    const { app, lines } = makeApp();
    await request(app)
      .post('/api/nothing')
      .set('Content-Type', 'application/json')
      .send(`{"leaseText": "${MARKER}`);
    expect(lines.join('')).toContain('"status":400');
    expect(lines.join('')).not.toContain(MARKER);
  });
});

describe('API headers', () => {
  it('NFR-1 API sends Helmet headers and a same-origin CSP (T-151)', async () => {
    const res = await request(makeApp().app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    const csp = String(res.headers['content-security-policy']);
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
  });

  it('API headers trust proxy is set to one hop', () => {
    expect(makeApp().app.get('trust proxy')).toBe(1);
  });
});

describe('API static client', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'rentchecker-static-'));
  beforeAll(() => {
    writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>spa</title>');
    writeFileSync(path.join(dir, 'app.js'), 'export {};');
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('API static serves files and the SPA fallback when staticDir is set (T-142)', async () => {
    const { app } = makeApp({ staticDir: dir });
    expect((await request(app).get('/app.js')).status).toBe(200);
    const spa = await request(app).get('/move-out');
    expect(spa.status).toBe(200);
    expect(spa.text).toContain('<title>spa</title>');
  });

  it('API static keeps unknown /api paths as JSON 404 when staticDir is set (T-142)', async () => {
    const res = await request(makeApp({ staticDir: dir }).app).get('/api/nothing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('API static serves nothing without staticDir (T-142)', async () => {
    const res = await request(makeApp().app).get('/move-out');
    expect(res.status).toBe(404);
  });
});
