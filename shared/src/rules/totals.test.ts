import { describe, expect, it } from 'vitest';
import { bucketSum, buildInput, cost, fixedFee, rent, runCase } from '../../test-support/cases.js';
import type { CalculationCase, Charge } from '../../test-support/cases.js';
import { evaluate } from './evaluate.js';
import type { Totals } from './totals.js';

interface TotalsCase {
  readonly id: string;
  readonly rule: string;
  readonly name: string;
  readonly statedRefundPaise?: number;
  readonly charges: readonly Charge[];
  readonly expected: Partial<Totals>;
}

/** A cost with a receipt for the whole amount, so all of it is consistent. */
function paidInFull(amountPaise: number, label: string): Charge {
  return cost(amountPaise, { label, receiptAmountPaise: amountPaise });
}

const PAINT_20K = paidInFull(2_000_000, 'Repainting');
const CLEAN_15K = paidInFull(1_500_000, 'Cleaning');

const NONE: Totals = {
  totalDeductedPaise: 0,
  askAboutPaise: 0,
  awaitingProofPaise: 0,
  unclearPaise: 0,
  consistentPaise: 0,
  refundGapPaise: null,
  isRefundGapShown: false,
  excessOverDepositPaise: 0,
};

const TOTAL_20K = { totalDeductedPaise: 2_000_000, consistentPaise: 2_000_000 };
const TOTAL_35K = { totalDeductedPaise: 3_500_000, consistentPaise: 3_500_000 };

const CASES: readonly TotalsCase[] = [
  { id: 'T-104', rule: 'D-41', name: 'no deductions', charges: [], expected: {} },
  {
    id: 'T-105',
    rule: 'D-1, D-41',
    name: 'small amounts add exactly (no floating point)',
    charges: [paidInFull(10, 'A'), paidInFull(20, 'B')],
    expected: { totalDeductedPaise: 30, consistentPaise: 30 },
  },
  {
    id: 'T-106',
    rule: 'D-42',
    name: 'refundGap positive, shown',
    statedRefundPaise: 700_000,
    charges: [PAINT_20K],
    expected: { ...TOTAL_20K, refundGapPaise: 300_000, isRefundGapShown: true },
  },
  {
    id: 'T-107',
    rule: 'D-42',
    name: 'refundGap zero, not shown',
    statedRefundPaise: 1_000_000,
    charges: [PAINT_20K],
    expected: { ...TOTAL_20K, refundGapPaise: 0 },
  },
  {
    id: 'T-108',
    rule: 'D-42',
    name: 'refundGap negative, not shown',
    statedRefundPaise: 1_200_000,
    charges: [PAINT_20K],
    expected: { ...TOTAL_20K, refundGapPaise: -200_000 },
  },
  {
    id: 'T-109',
    rule: 'D-42',
    name: 'no stated refund entered, refundGap not shown',
    charges: [PAINT_20K],
    expected: TOTAL_20K,
  },
  {
    id: 'T-110',
    rule: 'D-43',
    name: 'total deducted equals the deposit, no excess',
    charges: [paidInFull(3_000_000, 'Repainting')],
    expected: { totalDeductedPaise: 3_000_000, consistentPaise: 3_000_000 },
  },
  {
    id: 'T-111',
    rule: 'D-43',
    name: 'total deducted is 1 paisa over the deposit',
    charges: [paidInFull(3_000_001, 'Repainting')],
    expected: {
      totalDeductedPaise: 3_000_001,
      consistentPaise: 3_000_001,
      excessOverDepositPaise: 1,
    },
  },
  {
    id: 'T-112',
    rule: 'D-43',
    name: 'two deductions exceed the deposit',
    charges: [PAINT_20K, CLEAN_15K],
    expected: { ...TOTAL_35K, excessOverDepositPaise: 500_000 },
  },
  {
    id: 'T-113',
    rule: 'D-43, D-42',
    name: 'excess and a stated refund of 0',
    statedRefundPaise: 0,
    charges: [PAINT_20K, CLEAN_15K],
    expected: { ...TOTAL_35K, refundGapPaise: -500_000, excessOverDepositPaise: 500_000 },
  },
];

describe('totals and refund gap', () => {
  it.each(CASES.map((row) => [`${row.rule} ${row.name} (${row.id})`, row] as const))(
    '%s',
    (_title, { statedRefundPaise, charges, expected }) => {
      const { totals } = evaluate(buildInput({ statedRefundPaise }, charges));
      expect(totals).toEqual({ ...NONE, ...expected });
      expect(bucketSum(totals)).toBe(totals.totalDeductedPaise);
    },
  );
});

const WORKED_EXAMPLE: CalculationCase = {
  id: 'T-114',
  rule: 'D-40, D-41',
  name: 'worked example',
  tenancy: { partialMonth: 'per_day' },
  charges: [cost(1_200_000), rent(1_500_000), fixedFee(300_000, { evidence: 'none' })],
  expected: [
    {
      expectedPaise: null,
      result: 'needs_proof',
      reasons: ['RECEIPT_MISSING'],
      awaitingProof: 1_200_000,
    },
    {
      days: [15, 30],
      expectedPaise: 750_000,
      result: 'recalculate',
      reasons: ['ABOVE_PRORATED_RENT'],
      askAbout: 750_000,
      consistent: 750_000,
    },
    {
      expectedPaise: null,
      result: 'not_found',
      reasons: ['CLAUSE_NOT_FOUND', 'AMOUNT_NOT_STATED'],
      askAbout: 300_000,
    },
  ],
};

describe('worked example of DOMAIN_RULES.md', () => {
  it('D-40, D-41 results of each deduction (T-114)', () => {
    const { actual, expected } = runCase(WORKED_EXAMPLE);
    expect(actual).toEqual(expected);
  });

  it('D-40, D-41 totals (T-114)', () => {
    const { totals } = evaluate(buildInput(WORKED_EXAMPLE.tenancy, WORKED_EXAMPLE.charges));
    expect(totals).toEqual({
      ...NONE,
      totalDeductedPaise: 3_000_000,
      askAboutPaise: 1_050_000,
      awaitingProofPaise: 1_200_000,
      consistentPaise: 750_000,
    });
  });
});
