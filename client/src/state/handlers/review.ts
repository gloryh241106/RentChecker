import { isReviewTopicId } from '../../shared.js';
import type { ClauseMatch, LeaseReviewItem, Workspace } from '../../shared.js';
import type { EvidenceOverride, HandlersFor } from '../actions.js';
import { overrideFields } from './override-fields.js';

function toItem({ itemId, ...match }: ClauseMatch): LeaseReviewItem {
  return { topicId: itemId, ...match };
}

function withItem(items: readonly LeaseReviewItem[], item: LeaseReviewItem): LeaseReviewItem[] {
  return [...items.filter(({ topicId }) => topicId !== item.topicId), item];
}

/** F4-R7, as F1-R15: only a changed text clears the outcomes, overrides included. */
function setText(state: Workspace, { text }: { readonly text: string }): Workspace {
  return text === state.reviewLeaseText
    ? state
    : { ...state, reviewLeaseText: text, leaseReview: [] };
}

/** F2-R6, F2-R14. A match for an unknown topic, or over an override, is ignored. */
function applyMatches(
  state: Workspace,
  { matches }: { readonly matches: readonly ClauseMatch[] },
): Workspace {
  const leaseReview = matches.reduce((items, match) => {
    const isOverridden = items.some(
      ({ topicId, source }) => topicId === match.itemId && source === 'user',
    );
    return !isReviewTopicId(match.itemId) || isOverridden ? items : withItem(items, toItem(match));
  }, state.leaseReview);
  return { ...state, leaseReview: [...leaseReview] };
}

/** F4-R6. Removing an override drops the item, so the topic is back to Could not confirm. */
function overrideTopic(
  state: Workspace,
  { topicId, override }: { readonly topicId: string; readonly override: EvidenceOverride },
): Workspace {
  if (!isReviewTopicId(topicId)) {
    return state;
  }
  if (override.state === 'unconfirmed') {
    return { ...state, leaseReview: state.leaseReview.filter((item) => item.topicId !== topicId) };
  }
  const fields = overrideFields(override, state.reviewLeaseText);
  return fields === null
    ? state
    : { ...state, leaseReview: withItem(state.leaseReview, { topicId, ...fields }) };
}

export const reviewHandlers: HandlersFor<'review/set' | 'review/apply' | 'review/override'> = {
  'review/set': setText,
  'review/apply': applyMatches,
  'review/override': overrideTopic,
};
