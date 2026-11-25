import type { DeductionKind } from '../schemas/deduction.js';
import type { PrimaryResult, ReasonCode } from './codes.js';

interface KindRule {
  /** D-31. Where false, evidence changes neither the result nor the reasons. */
  readonly needsClause: boolean;
  /** D-37. The reason given when the amount is above expected. */
  readonly aboveReason: ReasonCode;
  /** D-34, D-35, D-37. What it means that D-20 to D-24 give no amount. */
  readonly whenUnknown: { readonly result: PrimaryResult; readonly reason: ReasonCode } | null;
}

/** What differs between kinds outside the calculation. A new kind does not compile without it. */
export const KIND_RULES: Readonly<Record<DeductionKind, KindRule>> = {
  rent: {
    needsClause: false,
    aboveReason: 'ABOVE_PRORATED_RENT',
    whenUnknown: null, // D-20 always gives an amount.
  },
  metered: {
    needsClause: true,
    aboveReason: 'ABOVE_METER_TOTAL',
    whenUnknown: { result: 'unclear', reason: 'FACTS_MISSING' },
  },
  fixed_fee: {
    needsClause: true,
    aboveReason: 'ABOVE_LEASE_AMOUNT',
    whenUnknown: { result: 'needs_proof', reason: 'AMOUNT_NOT_STATED' },
  },
  cost: {
    needsClause: true,
    aboveReason: 'ABOVE_RECEIPT',
    whenUnknown: { result: 'needs_proof', reason: 'RECEIPT_MISSING' },
  },
};
