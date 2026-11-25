import type { EvidenceState } from '../schemas/evidence.js';
import type { LeaseReviewItem } from '../schemas/lease-review.js';
import { REVIEW_TOPICS } from './topics.js';

/** F4-R3, UI.md. D-30 in the words of the review page. */
export const TOPIC_OUTCOME_NAMES: Readonly<Record<EvidenceState, string>> = {
  verified: 'Found',
  none: 'Not found',
  unconfirmed: 'Could not confirm',
  excludes: 'Lease may rule this out',
};

/** F4-R3, F4-R6. A topic with no stored item has not been confirmed. */
export function topicOutcome(item: Pick<LeaseReviewItem, 'state'> | undefined): EvidenceState {
  return item?.state ?? 'unconfirmed';
}

/** F4-R3. Every outcome but Found shows the question. */
export function showsQuestion(outcome: EvidenceState): boolean {
  return outcome !== 'verified';
}

/** F4-R5. The questions of every topic that is not Found, in topic order. */
export function questionsToAsk(items: readonly LeaseReviewItem[]): string[] {
  return REVIEW_TOPICS.filter(({ id }) =>
    showsQuestion(topicOutcome(items.find((item) => item.topicId === id))),
  ).map(({ question }) => question);
}
