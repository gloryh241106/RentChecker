import { Server } from 'node:http';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

describe('API Vercel entry', () => {
  it('API Vercel entry exports the app and opens no port (T-115)', async () => {
    const listen = vi.spyOn(Server.prototype, 'listen');
    const entry = await import('../../api/index.js');
    expect(listen).not.toHaveBeenCalled();
    listen.mockRestore();
    const res = await request(entry.default).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
