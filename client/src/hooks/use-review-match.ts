import { useMemo } from 'react';
import type { ClauseApi } from '../api/clause-api.js';
import { REVIEW_TOPICS } from '../shared.js';
import type { ClauseMatch } from '../shared.js';
import { planMatch } from './match-request.js';
import { useMatchRun } from './use-match-run.js';
import type { ClauseMatching } from './use-match-run.js';

export const REVIEW_FINISHED_TEXT = 'Review finished.';
export const REVIEW_FAILED_TEXT = 'Review failed.';
const MESSAGES = { finished: REVIEW_FINISHED_TEXT, failed: REVIEW_FAILED_TEXT };

/** F4-R1: each topic is one item, with its fixed id and the topic name as label. */
const TOPIC_ITEMS = REVIEW_TOPICS.map(({ id, name }) => ({ id, label: name }));

interface Options {
  readonly api: ClauseApi;
  readonly leaseText: string;
  /** The `review/apply` action. */
  readonly applyMatches: (matches: readonly ClauseMatch[]) => void;
  readonly announce: (message: string) => void;
}

/** FR-14, F4-R2. The same run as F2, over the ten topics. */
export function useReviewMatch({ leaseText, ...rest }: Options): ClauseMatching {
  // The list is never empty, so the blocker for an empty list cannot show.
  const plan = useMemo(() => planMatch(leaseText, TOPIC_ITEMS, ''), [leaseText]);
  return useMatchRun({ ...rest, plan, messages: MESSAGES });
}
