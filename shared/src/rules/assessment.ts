import type { DeductionKind } from '../schemas/deduction.js';
import type { EvidenceState } from '../schemas/evidence.js';
import type { RentDays } from './expected/rent.js';
import { KIND_RULES } from './kinds.js';

/** Everything the result, the reasons and the buckets of one deduction are decided from. */
export interface Assessment {
  readonly kind: DeductionKind;
  readonly amountPaise: number;
  /** What D-20 to D-24 give, before D-25. Null when a fact is missing. */
  readonly calculatedPaise: number | null;
  /** The expected amount. Null when unknown. */
  readonly expectedPaise: number | null;
  readonly isDuplicate: boolean;
  readonly evidenceState: EvidenceState;
  readonly rentDays: RentDays | null;
  /** D-37: the user has not confirmed how the lease charges a partial month. */
  readonly isPartialMonthUnsure: boolean;
  /** D-37: a linked repair is dated on or before the handover date. */
  readonly hasReportedRepair: boolean;
}

/** Amount minus expected, or null when expected is unknown. Also the difference in a bill check. */
export function differenceFromExpected(
  amountPaise: number,
  expectedPaise: number | null,
): number | null {
  return expectedPaise === null ? null : amountPaise - expectedPaise;
}

/** The part of the amount above expected. 0 when there is none or expected is unknown. */
export function aboveExpectedPaise(assessment: Assessment): number {
  const { amountPaise, expectedPaise } = assessment;
  return Math.max(0, differenceFromExpected(amountPaise, expectedPaise) ?? 0);
}

/** D-31. Rent has no clause, so it is in none of the states. */
export function hasClauseState(
  { kind, evidenceState }: Assessment,
  ...states: readonly EvidenceState[]
): boolean {
  return KIND_RULES[kind].needsClause && states.includes(evidenceState);
}
