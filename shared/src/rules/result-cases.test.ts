/* eslint-disable max-lines -- a table with one entry for each row of docs/testing/CASES.md */
import { describe, expect, it } from 'vitest';
import { caseTitle, cost, fixedFee, metered, rent, runCase } from '../../test-support/cases.js';
import type { CalculationCase } from '../../test-support/cases.js';

// 1234.50 and 1301.75 units at ₹8.50 a unit: 57162.5 paise before rounding.
const READINGS = { previousReading: 123_450, currentReading: 130_175, ratePaisePerUnit: 850 };

const CASES: readonly CalculationCase[] = [
  {
    id: 'T-084',
    rule: 'D-32',
    name: 'cost with receipt, evidence none',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_200_000, evidence: 'none' })],
    expected: [
      {
        expectedPaise: 1_200_000,
        result: 'not_found',
        reasons: ['CLAUSE_NOT_FOUND', 'MATCHES'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-085',
    rule: 'D-32 over D-35',
    name: 'cost without receipt, evidence none',
    tenancy: {},
    charges: [cost(1_200_000, { evidence: 'none' })],
    expected: [
      {
        expectedPaise: null,
        result: 'not_found',
        reasons: ['CLAUSE_NOT_FOUND', 'RECEIPT_MISSING'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-086',
    rule: 'D-32 over D-33',
    name: 'receipt lower, evidence none',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 800_000, evidence: 'none' })],
    expected: [
      {
        expectedPaise: 800_000,
        result: 'not_found',
        reasons: ['ABOVE_RECEIPT', 'CLAUSE_NOT_FOUND'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-087',
    rule: 'D-32 over D-33',
    name: 'duplicate, evidence none',
    tenancy: {},
    charges: [
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { receiptAmountPaise: 1_200_000, evidence: 'none' }),
    ],
    expected: [
      null,
      {
        expectedPaise: 0,
        result: 'not_found',
        reasons: ['DUPLICATE_CHARGE', 'CLAUSE_NOT_FOUND'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-088',
    rule: 'D-32',
    name: 'metered with a reading missing, evidence none',
    tenancy: {},
    charges: [
      metered(57_163, { previousReading: 123_450, ratePaisePerUnit: 850, evidence: 'none' }),
    ],
    expected: [
      {
        expectedPaise: null,
        result: 'not_found',
        reasons: ['CLAUSE_NOT_FOUND', 'FACTS_MISSING'],
        askAbout: 57_163,
      },
    ],
  },
  {
    id: 'T-089',
    rule: 'D-33 over D-34',
    name: 'receipt lower, evidence unconfirmed',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 800_000, evidence: 'unconfirmed' })],
    expected: [
      {
        expectedPaise: 800_000,
        result: 'recalculate',
        reasons: ['ABOVE_RECEIPT', 'CLAUSE_UNCONFIRMED'],
        askAbout: 400_000,
        unclear: 800_000,
      },
    ],
  },
  {
    id: 'T-090',
    rule: 'D-33 over D-34',
    name: 'lease amount lower, evidence excludes',
    tenancy: {},
    charges: [fixedFee(350_000, { leaseAmountPaise: 300_000, evidence: 'excludes' })],
    expected: [
      {
        expectedPaise: 300_000,
        result: 'recalculate',
        reasons: ['ABOVE_LEASE_AMOUNT', 'CLAUSE_EXCLUDES'],
        askAbout: 50_000,
        unclear: 300_000,
      },
    ],
  },
  {
    id: 'T-091',
    rule: 'D-34',
    name: 'cost with receipt, evidence unconfirmed',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_200_000, evidence: 'unconfirmed' })],
    expected: [
      {
        expectedPaise: 1_200_000,
        result: 'unclear',
        reasons: ['CLAUSE_UNCONFIRMED', 'MATCHES'],
        unclear: 1_200_000,
      },
    ],
  },
  {
    id: 'T-092',
    rule: 'D-34',
    name: 'metered, evidence unconfirmed, charge matches',
    tenancy: {},
    charges: [metered(57_163, { ...READINGS, evidence: 'unconfirmed' })],
    expected: [
      {
        expectedPaise: 57_163,
        result: 'unclear',
        reasons: ['CLAUSE_UNCONFIRMED', 'MATCHES'],
        unclear: 57_163,
      },
    ],
  },
  {
    id: 'T-093',
    rule: 'D-34',
    name: 'metered with a reading missing, evidence verified',
    tenancy: {},
    charges: [metered(57_163, { previousReading: 123_450, ratePaisePerUnit: 850 })],
    expected: [
      { expectedPaise: null, result: 'unclear', reasons: ['FACTS_MISSING'], unclear: 57_163 },
    ],
  },
  {
    id: 'T-094',
    rule: 'D-34 over D-35',
    name: 'cost without receipt, evidence unconfirmed',
    tenancy: {},
    charges: [cost(1_200_000, { evidence: 'unconfirmed' })],
    expected: [
      {
        expectedPaise: null,
        result: 'unclear',
        reasons: ['CLAUSE_UNCONFIRMED', 'RECEIPT_MISSING'],
        unclear: 1_200_000,
      },
    ],
  },
  {
    id: 'T-095',
    rule: 'D-34 over D-35',
    name: 'fixed fee without lease amount, evidence excludes',
    tenancy: {},
    charges: [fixedFee(300_000, { evidence: 'excludes' })],
    expected: [
      {
        expectedPaise: null,
        result: 'unclear',
        reasons: ['CLAUSE_EXCLUDES', 'AMOUNT_NOT_STATED'],
        unclear: 300_000,
      },
    ],
  },
  {
    id: 'T-096',
    rule: 'D-35',
    name: 'cost without receipt, evidence verified',
    tenancy: {},
    charges: [cost(1_200_000)],
    expected: [
      {
        expectedPaise: null,
        result: 'needs_proof',
        reasons: ['RECEIPT_MISSING'],
        awaitingProof: 1_200_000,
      },
    ],
  },
  {
    id: 'T-097',
    rule: 'D-35',
    name: 'fixed fee without lease amount, evidence verified',
    tenancy: {},
    charges: [fixedFee(300_000)],
    expected: [
      {
        expectedPaise: null,
        result: 'needs_proof',
        reasons: ['AMOUNT_NOT_STATED'],
        awaitingProof: 300_000,
      },
    ],
  },
  {
    id: 'T-098',
    rule: 'D-36',
    name: 'fixed fee equals lease amount, evidence verified',
    tenancy: {},
    charges: [fixedFee(300_000, { leaseAmountPaise: 300_000 })],
    expected: [
      { expectedPaise: 300_000, result: 'supported', reasons: ['MATCHES'], consistent: 300_000 },
    ],
  },
  {
    id: 'T-099',
    rule: 'D-37',
    name: 'repair dated before handover',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_200_000, repairDate: '2026-03-10' })],
    expected: [
      {
        expectedPaise: 1_200_000,
        result: 'supported',
        reasons: ['REPAIR_REPORTED', 'MATCHES'],
        consistent: 1_200_000,
      },
    ],
  },
  {
    id: 'T-100',
    rule: 'D-37',
    name: 'repair dated on the handover date',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_200_000, repairDate: '2026-06-15' })],
    expected: [
      {
        expectedPaise: 1_200_000,
        result: 'supported',
        reasons: ['REPAIR_REPORTED', 'MATCHES'],
        consistent: 1_200_000,
      },
    ],
  },
  {
    id: 'T-101',
    rule: 'D-37',
    name: 'repair dated after the handover date',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_200_000, repairDate: '2026-06-16' })],
    expected: [
      {
        expectedPaise: 1_200_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_200_000,
      },
    ],
  },
  {
    id: 'T-102',
    rule: 'D-37',
    name: 'all reasons that apply are listed: duplicate partial-month rent',
    tenancy: {},
    charges: [rent(750_000), rent(750_000)],
    expected: [
      null,
      {
        days: [15, 30],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['DUPLICATE_CHARGE', 'ASSUMED_PER_DAY'],
        askAbout: 750_000,
      },
    ],
  },
  {
    id: 'T-103',
    rule: 'D-37',
    name: 'several reasons: cost above receipt, evidence verified, repair reported',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 800_000, repairDate: '2026-03-10' })],
    expected: [
      {
        expectedPaise: 800_000,
        result: 'recalculate',
        reasons: ['ABOVE_RECEIPT', 'REPAIR_REPORTED'],
        askAbout: 400_000,
        consistent: 800_000,
      },
    ],
  },
];

describe('evidence, results and reasons', () => {
  it.each(CASES.map((testCase) => [caseTitle(testCase), testCase] as const))(
    '%s',
    (_title, testCase) => {
      const { actual, expected } = runCase(testCase);
      expect(actual).toEqual(expected);
    },
  );
});
