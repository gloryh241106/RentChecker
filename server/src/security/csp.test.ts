import { readFileSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { createJsonLogger } from '../logging/logger.js';

const directives = (policy: string): string[] =>
  policy
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

function vercelCsp(): string {
  const file = path.resolve(import.meta.dirname, '../../../vercel.json');
  const text = JSON.stringify(JSON.parse(readFileSync(file, 'utf8')));
  const match = /"key":"Content-Security-Policy","value":"([^"]*)"/.exec(text);
  return match?.[1] ?? '';
}

describe('NFR-1 CSP', () => {
  it('NFR-1 vercel.json sends the same CSP as Helmet (T-151)', async () => {
    const app = createApp({
      aiConfigured: false,
      cloudSaveConfigured: false,
      logger: createJsonLogger(() => undefined),
    });
    const res = await request(app).get('/api/health');
    const helmetPolicy = String(res.headers['content-security-policy']);
    expect(directives(vercelCsp())).toEqual(directives(helmetPolicy));
    expect(directives(helmetPolicy).length).toBeGreaterThan(5);
  });
});
