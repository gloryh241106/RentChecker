import type { CheckableTenancy } from '../schemas/tenancy.js';
import { sumBuckets } from './buckets.js';
import type { Buckets } from './buckets.js';

/** The four case totals (D-41) and the checks on the deposit. */
export interface Totals extends Buckets {
  readonly totalDeductedPaise: number;
  /** D-42. Null when no stated refund was entered. May be 0 or less. */
  readonly refundGapPaise: number | null;
  /** D-42. A gap of 0 or less is not shown. */
  readonly isRefundGapShown: boolean;
  /** D-43. 0 when the deposit covers the total. */
  readonly excessOverDepositPaise: number;
}

interface ChargedBuckets {
  readonly amountPaise: number;
  readonly buckets: Buckets;
}

/** D-41 to D-43. */
export function calculateTotals(
  charges: readonly ChargedBuckets[],
  tenancy: Pick<CheckableTenancy, 'depositPaise' | 'statedRefundPaise'>,
): Totals {
  const { depositPaise, statedRefundPaise } = tenancy;
  const totalDeductedPaise = charges.reduce((sum, charge) => sum + charge.amountPaise, 0);
  const refundGapPaise =
    statedRefundPaise === undefined ? null : depositPaise - totalDeductedPaise - statedRefundPaise;
  return {
    ...sumBuckets(charges.map((charge) => charge.buckets)),
    totalDeductedPaise,
    refundGapPaise,
    isRefundGapShown: refundGapPaise !== null && refundGapPaise > 0,
    excessOverDepositPaise: Math.max(0, totalDeductedPaise - depositPaise),
  };
}
