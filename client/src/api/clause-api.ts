import type { HealthResponse, MatchRequest, MatchResponse } from '../shared.js';
import type { ApiResult } from './api-error.js';

/** What the client needs from the server for F2. A test passes a fake. */
export interface ClauseApi {
  /** POST /api/clauses/match. One request, no retry (F2-R2). */
  matchClauses(request: MatchRequest, signal: AbortSignal): Promise<ApiResult<MatchResponse>>;
  /** GET /api/health. */
  readHealth(signal: AbortSignal): Promise<ApiResult<HealthResponse>>;
}
