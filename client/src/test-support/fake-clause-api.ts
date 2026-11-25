import type { ApiResult } from '../api/api-error.js';
import type { ClauseApi } from '../api/clause-api.js';
import type { HealthResponse, MatchRequest, MatchResponse } from '../shared.js';

type MatchAnswer = ApiResult<MatchResponse> | Promise<ApiResult<MatchResponse>>;

const HEALTH: HealthResponse = { status: 'ok', aiConfigured: true, cloudSaveConfigured: false };

/** A ClauseApi for tests. It records what was sent and answers as the test says. */
export class FakeClauseApi implements ClauseApi {
  readonly requests: MatchRequest[] = [];
  readonly signals: AbortSignal[] = [];
  healthCalls = 0;
  health: ApiResult<HealthResponse> = { ok: true, value: HEALTH };
  /** Called for each match request. The default is a keyword answer with no matches found. */
  answer: (request: MatchRequest) => MatchAnswer = (request) => ({
    ok: true,
    value: {
      mode: 'keyword',
      warnings: [],
      matches: request.items.map(({ id }) => ({
        itemId: id,
        state: 'unconfirmed',
        quote: null,
        source: 'keyword',
      })),
    },
  });

  setAiConfigured(isConfigured: boolean): void {
    this.health = { ok: true, value: { ...HEALTH, aiConfigured: isConfigured } };
  }

  matchClauses(request: MatchRequest, signal: AbortSignal): Promise<ApiResult<MatchResponse>> {
    this.requests.push(request);
    this.signals.push(signal);
    return Promise.resolve(this.answer(request));
  }

  readHealth(): Promise<ApiResult<HealthResponse>> {
    this.healthCalls += 1;
    return Promise.resolve(this.health);
  }
}
