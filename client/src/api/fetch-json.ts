import type { ApiResult } from './api-error.js';
import { failure } from './api-error.js';
import { errorForStatus } from './status-error.js';

export type FetchFunction = typeof fetch;

/** F2: the client gives up after 30 seconds, above the server's 20. */
export const REQUEST_TIMEOUT_MS = 30_000;

interface Call {
  readonly fetchFunction: FetchFunction;
  readonly timeoutMs: number;
  readonly url: string;
  readonly init: RequestInit;
  readonly signal: AbortSignal;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

/** Sends one request and returns the JSON body of a 2xx answer, or a typed error. */
export async function fetchJson(call: Call): Promise<ApiResult<unknown>> {
  const { fetchFunction, timeoutMs, url, init, signal } = call;
  const limit = new AbortController();
  const stop = (): void => limit.abort();
  const timer = setTimeout(stop, timeoutMs);
  signal.addEventListener('abort', stop);
  try {
    if (signal.aborted) {
      return failure({ kind: 'aborted' });
    }
    const response = await fetchFunction(url, { ...init, signal: limit.signal });
    const body = await readBody(response);
    if (!response.ok) {
      return failure(errorForStatus(response.status, body));
    }
    return body === undefined ? failure({ kind: 'bad_response' }) : { ok: true, value: body };
  } catch {
    // A timeout is a failure to answer, so it is a network error, not a user abort.
    return failure({ kind: signal.aborted ? 'aborted' : 'network' });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', stop);
  }
}
