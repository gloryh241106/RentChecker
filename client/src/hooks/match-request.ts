import { MIN_MATCH_LEASE_LENGTH } from '../shared.js';
import type { Deduction, MatchRequest } from '../shared.js';

export const NEEDS_LEASE = `Paste at least ${MIN_MATCH_LEASE_LENGTH} characters of the lease first.`;
export const NEEDS_DEDUCTION = 'Add a deduction other than rent first.';

export interface MatchPlan {
  /** Null while F2-R1 is not met. */
  readonly request: MatchRequest | null;
  /** The reasons Find clauses is disabled, in UI.md's words. */
  readonly blockers: readonly string[];
}

/** FR-8, F2-R1. Rent is never sent (D-31), and one request carries every other deduction. */
export function planMatch(leaseText: string, deductions: readonly Deduction[]): MatchPlan {
  const items = deductions
    .filter(({ kind }) => kind !== 'rent')
    .map(({ id, label }) => ({ id, label }));
  const blockers = [
    ...(leaseText.trim().length < MIN_MATCH_LEASE_LENGTH ? [NEEDS_LEASE] : []),
    ...(items.length === 0 ? [NEEDS_DEDUCTION] : []),
  ];
  return { request: blockers.length === 0 ? { leaseText, items } : null, blockers };
}

/** Same value for the same request, so a run lives only while what it sent is unchanged. */
export function requestKey(request: MatchRequest | null): string {
  return JSON.stringify(request);
}
