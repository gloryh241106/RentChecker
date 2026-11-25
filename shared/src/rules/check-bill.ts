import { isCurrentBelowPrevious } from '../readings.js';
import type { BillCheck } from '../schemas/bill-check.js';
import { differenceFromExpected } from './assessment.js';
import type { ReasonCode } from './codes.js';
import { calculateMetered } from './expected/metered.js';
import { listReasons } from './reasons.js';

/** D-37: the reasons a bill check can give. */
const BILL_REASONS = ['ABOVE_METER_TOTAL', 'BELOW_EXPECTED', 'MATCHES'] as const;

export type BillReason = (typeof BILL_REASONS)[number];

function isBillReason(code: ReasonCode): code is BillReason {
  return (BILL_REASONS as readonly ReasonCode[]).includes(code);
}

/** F5-R3. There is no primary result, because D-32 to D-36 apply to deductions only. */
export interface BillCheckResult {
  readonly expectedPaise: number;
  readonly billedPaise: number;
  /** Bill total minus expected. Negative when the bill is lower. */
  readonly differencePaise: number;
  readonly reason: BillReason;
}

/**
 * F5-R2. Null when a field is missing or the current reading is below the previous (D-22), so the
 * form shows its messages and no amount. The calculation and the comparison are those of a metered
 * deduction.
 */
export function checkBill(bill: BillCheck): BillCheckResult | null {
  const { billedTotalPaise } = bill;
  if (billedTotalPaise === undefined || isCurrentBelowPrevious(bill)) {
    return null;
  }
  const expectedPaise = calculateMetered(bill);
  const differencePaise = differenceFromExpected(billedTotalPaise, expectedPaise);
  if (expectedPaise === null || differencePaise === null) {
    return null;
  }
  const reason = listReasons({
    kind: 'metered',
    amountPaise: billedTotalPaise,
    calculatedPaise: expectedPaise,
    expectedPaise,
    isDuplicate: false,
    evidenceState: 'verified', // A bill has no clause to look for, so no clause reason applies.
    rentDays: null,
    isPartialMonthUnsure: false,
    hasReportedRepair: false,
  }).find(isBillReason);
  return reason === undefined
    ? null
    : { expectedPaise, billedPaise: billedTotalPaise, differencePaise, reason };
}
