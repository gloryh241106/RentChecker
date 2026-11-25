import { errorResponseSchema } from '../shared.js';
import type { ApiError } from './api-error.js';

function fieldsOf(body: unknown): readonly string[] {
  const parsed = errorResponseSchema.safeParse(body);
  return parsed.success ? (parsed.data.error.fields ?? []) : [];
}

function codeOf(body: unknown): string | null {
  const parsed = errorResponseSchema.safeParse(body);
  return parsed.success ? parsed.data.error.code : null;
}

/** The API.md error table. Anything not listed is a server error. */
export function errorForStatus(status: number, body: unknown): ApiError {
  switch (status) {
    case 400:
      return { kind: 'validation', fields: fieldsOf(body) };
    case 401:
      return { kind: 'unauthorized' };
    case 404:
      return codeOf(body) === 'CASE_NOT_FOUND' ? { kind: 'case_not_found' } : { kind: 'server' };
    case 409:
      return { kind: 'conflict' };
    case 413:
      return { kind: 'too_large' };
    case 429:
      return { kind: 'rate_limited' };
    case 503:
      return { kind: 'storage_unavailable' };
    default:
      return { kind: 'server' };
  }
}
