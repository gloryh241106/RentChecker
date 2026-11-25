import type { MatchRequest, MatchResponse, MatchWarning } from '../../../shared/src/index.js';
import type { ClauseMatcher } from '../ai/clause-matcher.js';
import { buildAiResponse } from './ai-matches.js';
import { askAi } from './ask-ai.js';
import type { Logger } from '../logging/logger.js';
import type { KeywordMatcher } from './keyword-matcher.js';

export interface ClauseService {
  match(request: MatchRequest): Promise<MatchResponse>;
}

export interface ClauseServiceOptions {
  /** Absent when AI is not configured. */
  clauseMatcher?: ClauseMatcher | undefined;
  keywordMatcher: KeywordMatcher;
  logger: Logger;
}

export function createClauseService(options: ClauseServiceOptions): ClauseService {
  const { clauseMatcher, keywordMatcher, logger } = options;

  // F2-R7
  const byKeyword = (request: MatchRequest, warning: MatchWarning): MatchResponse => ({
    mode: 'keyword',
    warnings: [warning],
    matches: keywordMatcher(request),
  });

  return {
    async match(request) {
      if (!clauseMatcher) return byKeyword(request, 'AI_NOT_CONFIGURED');
      const outcome = await askAi({ clauseMatcher, logger }, request);
      return outcome.ok
        ? buildAiResponse(request, outcome.answers)
        : byKeyword(request, outcome.warning);
    },
  };
}
