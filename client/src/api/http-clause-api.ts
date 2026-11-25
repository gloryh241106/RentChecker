import { healthResponseSchema, matchResponseSchema } from '../shared.js';
import type { ClauseApi } from './clause-api.js';
import { createHttpCall, jsonPost } from './http-call.js';
import type { HttpOptions } from './http-call.js';

/** The real API of F2. */
export function createHttpClauseApi(options: HttpOptions = {}): ClauseApi {
  const call = createHttpCall(options);
  return {
    matchClauses: (request, signal) =>
      call(matchResponseSchema, '/api/clauses/match', jsonPost(request), signal),
    readHealth: (signal) => call(healthResponseSchema, '/api/health', { method: 'GET' }, signal),
  };
}
