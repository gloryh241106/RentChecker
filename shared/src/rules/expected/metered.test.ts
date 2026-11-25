// T-064 to T-066 are bill checks. F5 is not built yet, so these tests show that the functions
// behind a metered deduction already give its expected amount, difference and reason.
import { describe, expect, it } from 'vitest';
import type { BillCheck } from '../../schemas/bill-check.js';
import { differenceFromExpected } from '../assessment.js';
import type { ReasonCode } from '../codes.js';
import { listReasons } from '../reasons.js';
import { calculateMetered } from './metered.js';

const BILL: BillCheck = {
  previousReading: 120_000,
  currentReading: 135_050,
  ratePaisePerUnit: 750,
  fixedChargePaise: 10_000,
};

interface BillCase {
  readonly title: string;
  readonly billedTotalPaise: number;
  readonly difference: number;
  readonly reason: ReasonCode;
}

const CASES: readonly BillCase[] = [
  {
    title: 'D-22, D-37 bill total above expected (T-064)',
    billedTotalPaise: 130_000,
    difference: 7_125,
    reason: 'ABOVE_METER_TOTAL',
  },
  {
    title: 'D-22, D-37 bill total equals expected (T-065)',
    billedTotalPaise: 122_875,
    difference: 0,
    reason: 'MATCHES',
  },
  {
    title: 'D-22, D-37 bill total below expected (T-066)',
    billedTotalPaise: 100_000,
    difference: -22_875,
    reason: 'BELOW_EXPECTED',
  },
];

describe('metered formula for a bill', () => {
  it.each(CASES.map((row) => [row.title, row] as const))(
    '%s',
    (_title, { billedTotalPaise, difference, reason }) => {
      const expectedPaise = calculateMetered(BILL);
      expect(expectedPaise).toBe(122_875);
      expect(differenceFromExpected(billedTotalPaise, expectedPaise)).toBe(difference);
      const reasons = listReasons({
        kind: 'metered',
        amountPaise: billedTotalPaise,
        calculatedPaise: expectedPaise,
        expectedPaise,
        isDuplicate: false,
        evidenceState: 'verified',
        rentDays: null,
        isPartialMonthUnsure: false,
        hasReportedRepair: false,
      });
      expect(reasons).toEqual([reason]);
    },
  );
});
