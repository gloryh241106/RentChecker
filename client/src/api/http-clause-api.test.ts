import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MatchRequest } from '../shared.js';
import { createHttpClauseApi } from './http-clause-api.js';

const REQUEST: MatchRequest = {
  leaseText: 'The tenant shall pay for painting on exit. Nothing else applies here.',
  items: [{ id: 'd1', label: 'Repainting' }],
};
const MATCH = { itemId: 'd1', state: 'verified', quote: 'pay for painting', source: 'ai' };
const BODY = { mode: 'ai', warnings: [], matches: [MATCH] };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function errorBody(code: string, extra: object = {}): unknown {
  return { error: { code, message: 'x', ...extra } };
}

function apiWith(fetchFunction: typeof fetch) {
  return createHttpClauseApi({ fetchFunction });
}

/** A fetch that never answers and rejects when it is aborted, like a real one. */
function hangingFetch() {
  return vi.fn(
    (_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')));
      }),
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('API client', () => {
  it('FR-8 posts the request to a relative URL and returns the validated answer', async () => {
    const fetchFunction = vi.fn(() => Promise.resolve(json(BODY)));
    const result = await apiWith(fetchFunction).matchClauses(REQUEST, new AbortController().signal);
    expect(result).toEqual({ ok: true, value: BODY });
    const [url, init] = fetchFunction.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/clauses/match');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(REQUEST);
  });

  it.each([
    ['400', 400, errorBody('VALIDATION_ERROR', { fields: ['items.0.label'] }), 'validation'],
    ['413', 413, errorBody('PAYLOAD_TOO_LARGE'), 'too_large'],
    ['429', 429, errorBody('RATE_LIMITED'), 'rate_limited'],
    ['500', 500, errorBody('INTERNAL_ERROR'), 'server'],
    ['a status with no JSON body', 502, undefined, 'server'],
    ['503', 503, errorBody('STORAGE_UNAVAILABLE'), 'storage_unavailable'],
    ['401', 401, errorBody('UNAUTHORIZED'), 'unauthorized'],
    ['404 CASE_NOT_FOUND', 404, errorBody('CASE_NOT_FOUND'), 'case_not_found'],
    ['404 NOT_FOUND', 404, errorBody('NOT_FOUND'), 'server'],
    ['409', 409, errorBody('REVISION_CONFLICT', { currentRevision: 2 }), 'conflict'],
  ])('T-167 %s becomes the %s error kind', async (_name, status, body, kind) => {
    const fetchFunction = vi.fn(() => Promise.resolve(json(body, status)));
    const result = await apiWith(fetchFunction).matchClauses(REQUEST, new AbortController().signal);
    expect(result.ok === false && result.error.kind).toBe(kind);
  });

  it('T-167 a 400 keeps the field paths for display', async () => {
    const body = errorBody('VALIDATION_ERROR', { fields: ['items.0.label'] });
    const result = await apiWith(() => Promise.resolve(json(body, 400))).matchClauses(
      REQUEST,
      new AbortController().signal,
    );
    expect(result).toEqual({
      ok: false,
      error: { kind: 'validation', fields: ['items.0.label'] },
    });
  });

  it('T-167 a rejected fetch is a network error, tried once', async () => {
    const fetchFunction = vi.fn(() => Promise.reject(new TypeError('offline')));
    const result = await apiWith(fetchFunction).matchClauses(REQUEST, new AbortController().signal);
    expect(result).toEqual({ ok: false, error: { kind: 'network' } });
    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });

  it('T-167 no answer for 30 seconds ends the call, with no retry', async () => {
    const fetchFunction = hangingFetch();
    const pending = apiWith(fetchFunction).matchClauses(REQUEST, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(fetchFunction.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ ok: false, error: { kind: 'network' } });
    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });

  it('FRONTEND a cancelled call is aborted, not a network error', async () => {
    const caller = new AbortController();
    const pending = apiWith(hangingFetch()).matchClauses(REQUEST, caller.signal);
    caller.abort();
    expect(await pending).toEqual({ ok: false, error: { kind: 'aborted' } });
  });

  it.each([
    ['a body that fails the schema', json({ mode: 'ai', warnings: [], matches: [] })],
    ['a keyword answer with an ai source', json({ ...BODY, mode: 'keyword' })],
    ['a body that is not JSON', new Response('<html>', { status: 200 })],
  ])('T-167 %s is a bad_response', async (_name, response) => {
    const result = await apiWith(() => Promise.resolve(response)).matchClauses(
      REQUEST,
      new AbortController().signal,
    );
    expect(result).toEqual({ ok: false, error: { kind: 'bad_response' } });
  });

  it('F2-R3 reads health from a relative URL and validates it', async () => {
    const health = { status: 'ok', aiConfigured: false, cloudSaveConfigured: false };
    const fetchFunction = vi.fn((_url: unknown) => Promise.resolve(json(health)));
    const api = apiWith(fetchFunction);
    expect(await api.readHealth(new AbortController().signal)).toEqual({ ok: true, value: health });
    expect(fetchFunction.mock.calls[0]?.[0]).toBe('/api/health');
    const bad = await apiWith(() => Promise.resolve(json({ status: 'ok' }))).readHealth(
      new AbortController().signal,
    );
    expect(bad).toEqual({ ok: false, error: { kind: 'bad_response' } });
  });
});
