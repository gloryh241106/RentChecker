import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const PORT = 3151;
const BASE = `http://localhost:${String(PORT)}`;
const MATCH = `${BASE}/api/clauses/match`;
const HEALTH = `${BASE}/api/health`;

// API.md: leaseText needs 50 to 40,000 characters after trimming.
const LEASE =
  "The tenant shall pay for repainting the walls on leaving, against the painter's bill.";
const VALID_BODY = { leaseText: LEASE, items: [{ id: 'd1', label: 'Repainting' }] };

let server: ChildProcess | undefined;

async function healthStatus(request: APIRequestContext): Promise<number> {
  try {
    return (await request.get(HEALTH)).status();
  } catch {
    return 0;
  }
}

test.describe('T-210 API errors over real HTTP', () => {
  // One server, one port: run it once, on the desktop project.
  test.skip(({ isMobile }) => isMobile === true, 'T-210 starts its own server once');

  test.beforeAll(() => {
    server = spawn(process.execPath, ['dist-server/server/src/index.js'], {
      env: {
        ...process.env,
        PORT: String(PORT),
        GEMINI_API_KEY: '',
        GEMINI_MODEL: '',
        DATABASE_URL: '',
      },
      stdio: 'ignore',
      windowsHide: true,
    });
  });

  test.afterAll(async () => {
    const child = server;
    if (child !== undefined && child.exitCode === null) {
      child.kill();
      await once(child, 'exit');
    }
  });

  test('T-210 API errors health, unknown path, bad body, oversized body and the rate limit', async ({
    request,
  }) => {
    await expect.poll(async () => healthStatus(request), { timeout: 30_000 }).toBe(200);
    await expectHealth(request);
    await expectUnknownPath(request);
    await expectBadBody(request);
    await expectOversizedBody(request);
    await expectRateLimit(request);
  });
});

async function expectHealth(request: APIRequestContext): Promise<void> {
  const health = await request.get(HEALTH);
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({
    status: 'ok',
    aiConfigured: false,
    cloudSaveConfigured: false,
  });
}

async function expectUnknownPath(request: APIRequestContext): Promise<void> {
  const unknown = await request.get(`${BASE}/api/nothing`);
  expect(unknown.status()).toBe(404);
  expect(await unknown.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
}

async function expectBadBody(request: APIRequestContext): Promise<void> {
  const badBody = await request.post(MATCH, {
    headers: { 'content-type': 'application/json' },
    data: '{"leaseText":',
  });
  expect(badBody.status()).toBe(400);
  expect(await badBody.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
}

async function expectOversizedBody(request: APIRequestContext): Promise<void> {
  const tooLarge = await request.post(MATCH, {
    data: { ...VALID_BODY, leaseText: `The tenant shall pay. ${'x'.repeat(205_000)}` },
  });
  expect(tooLarge.status()).toBe(413);
  expect(await tooLarge.json()).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
}

/** 20 match requests are allowed in ten minutes; the 21st is a 429 (API.md). */
async function expectRateLimit(request: APIRequestContext): Promise<void> {
  const first = await request.post(MATCH, { data: VALID_BODY });
  expect(first.status()).toBe(200);
  expect(await first.json()).toMatchObject({
    mode: 'keyword',
    warnings: ['AI_NOT_CONFIGURED'],
    matches: [{ itemId: 'd1', source: 'keyword' }],
  });

  for (let sent = 2; sent <= 20; sent += 1) {
    expect((await request.post(MATCH, { data: VALID_BODY })).status()).toBe(200);
  }
  const limited = await request.post(MATCH, { data: VALID_BODY });
  expect(limited.status()).toBe(429);
  expect(await limited.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } });
}
