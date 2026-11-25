import type { MatchRequest } from '../../../shared/src/index.js';

/** What the model said for one item. `unrecognised` is any value F2-R5 does not name. */
export interface AiAnswer {
  itemId: string;
  answer: 'covers' | 'excludes' | 'none' | 'unrecognised';
  quote: string | null;
}

export interface ClauseQuestion extends MatchRequest {
  signal: AbortSignal;
}

/** Answers are validated in shape only. Quotes are checked by the caller (BACKEND.md). */
export interface ClauseMatcher {
  findClauses(question: ClauseQuestion): Promise<readonly AiAnswer[]>;
}

export type AiFailure = 'REQUEST_FAILED' | 'HTTP_STATUS' | 'INVALID_REPLY';

/** Carries a code only. A provider message could repeat the lease or the key (NFR-1, NFR-2). */
export class AiClientError extends Error {
  constructor(
    readonly failure: AiFailure,
    /** Set when Gemini answered with an error status. */
    readonly httpStatus?: number,
  ) {
    super(failure);
    this.name = 'AiClientError';
  }
}
