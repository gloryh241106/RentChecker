import type { z } from 'zod';
import type { ApiResult } from './api-error.js';
import { failure } from './api-error.js';
import { REQUEST_TIMEOUT_MS, fetchJson } from './fetch-json.js';
import type { FetchFunction } from './fetch-json.js';

export interface HttpOptions {
  readonly fetchFunction?: FetchFunction;
  readonly timeoutMs?: number;
}

/** Relative URLs, a 30 second limit, no retry, and every answer checked by Zod. */
export function createHttpCall({
  fetchFunction = (...args) => fetch(...args),
  timeoutMs = REQUEST_TIMEOUT_MS,
}: HttpOptions = {}) {
  return async function call<Schema extends z.ZodType>(
    schema: Schema,
    url: string,
    init: RequestInit,
    signal: AbortSignal,
  ): Promise<ApiResult<z.infer<Schema>>> {
    const result = await fetchJson({ fetchFunction, timeoutMs, url, init, signal });
    if (!result.ok) {
      return result;
    }
    const parsed = schema.safeParse(result.value);
    return parsed.success ? { ok: true, value: parsed.data } : failure({ kind: 'bad_response' });
  };
}

export function jsonPost(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
