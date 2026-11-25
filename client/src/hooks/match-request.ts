import { MIN_MATCH_LEASE_LENGTH } from '../shared.js';
import type { MatchRequest } from '../shared.js';

export const NEEDS_LEASE = `Paste at least ${MIN_MATCH_LEASE_LENGTH} characters of the lease first.`;
export const NEEDS_DEDUCTION = 'Add a deduction other than rent first.';

/** One thing to find a clause for: a deduction (F2) or a review topic (F4). */
export interface MatchItem {
  readonly id: string;
  readonly label: string;
}

export interface MatchPlan {
  /** Null while F2-R1 is not met. */
  readonly request: MatchRequest | null;
  /** The reasons the run button is disabled, in UI.md's words. */
  readonly blockers: readonly string[];
}

/** F2-R1, F7-R1. Why nothing can be sent about this lease. */
export function leaseBlockers(leaseText: string): readonly string[] {
  return leaseText.trim().length < MIN_MATCH_LEASE_LENGTH ? [NEEDS_LEASE] : [];
}

/**
 * FR-8, F2-R1, F4-R2. One request carries every item. `noItems` is the blocker for an empty list,
 * in the words of the caller.
 */
export function planMatch(
  leaseText: string,
  items: readonly MatchItem[],
  noItems: string,
): MatchPlan {
  const blockers = [...leaseBlockers(leaseText), ...(items.length === 0 ? [noItems] : [])];
  return {
    request: blockers.length === 0 ? { leaseText, items: [...items] } : null,
    blockers,
  };
}

/** Same value for the same request, so a run lives only while what it sent is unchanged. */
export function requestKey(request: MatchRequest | null): string {
  return JSON.stringify(request);
}
