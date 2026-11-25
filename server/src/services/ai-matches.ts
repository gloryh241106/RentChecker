import { isQuoteInLease } from '../../../shared/src/index.js';
import type { ClauseMatch, MatchRequest, MatchResponse } from '../../../shared/src/index.js';
import type { AiAnswer } from '../ai/clause-matcher.js';

const QUOTED_STATE = { covers: 'verified', excludes: 'excludes' } as const;

interface Judged {
  match: ClauseMatch;
  quoteRejected: boolean;
}

// F2-R5, F2-R6. `answer` is undefined when the model skipped the item.
function judge(itemId: string, answer: AiAnswer | undefined, leaseText: string): Judged {
  const unquoted = (state: 'none' | 'unconfirmed', quoteRejected = false): Judged => ({
    match: { itemId, state, quote: null, source: 'ai' },
    quoteRejected,
  });
  if (answer === undefined || answer.answer === 'unrecognised') return unquoted('unconfirmed');
  if (answer.answer === 'none') return unquoted('none');
  // F2-R4: shown as returned, trimmed.
  const quote = answer.quote?.trim() ?? '';
  if (!isQuoteInLease(quote, leaseText)) return unquoted('unconfirmed', true);
  const state = QUOTED_STATE[answer.answer];
  return { match: { itemId, state, quote, source: 'ai' }, quoteRejected: false };
}

// F2-R6: the first answer for an ID is used. IDs not in the request are never looked up.
function firstAnswers(answers: readonly AiAnswer[]): Map<string, AiAnswer> {
  const byId = new Map<string, AiAnswer>();
  for (const answer of answers) {
    if (!byId.has(answer.itemId)) byId.set(answer.itemId, answer);
  }
  return byId;
}

/** Exactly one match per item, in request order (API.md). */
export function buildAiResponse(
  { leaseText, items }: MatchRequest,
  answers: readonly AiAnswer[],
): MatchResponse {
  const byId = firstAnswers(answers);
  const judged = items.map(({ id }) => judge(id, byId.get(id), leaseText));
  return {
    mode: 'ai',
    // F2-R5: one warning however many quotes fail.
    warnings: judged.some(({ quoteRejected }) => quoteRejected) ? ['QUOTE_REJECTED'] : [],
    matches: judged.map(({ match }) => match),
  };
}
