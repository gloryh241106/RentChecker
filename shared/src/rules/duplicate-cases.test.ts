import { describe, expect, it } from 'vitest';
import { caseTitle, cost, fixedFee, rent, runCase } from '../../test-support/cases.js';
import type { CalculationCase } from '../../test-support/cases.js';

const CASES: readonly CalculationCase[] = [
  {
    id: 'T-075',
    rule: 'D-25',
    name: 'same rent month twice, amounts differ',
    tenancy: {},
    charges: [rent(750_000), rent(1_500_000)],
    expected: [
      null,
      {
        days: [15, 30],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['DUPLICATE_CHARGE', 'ASSUMED_PER_DAY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-076',
    rule: 'D-25',
    name: 'two different rent months are not duplicates',
    tenancy: {},
    charges: [rent(1_500_000, { rentMonth: '2026-05' }), rent(750_000)],
    expected: [
      {
        days: [31, 31],
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_500_000,
      },
      {
        days: [15, 30],
        expectedPaise: 750_000,
        result: 'supported',
        reasons: ['ASSUMED_PER_DAY', 'MATCHES'],
        consistent: 750_000,
      },
    ],
  },
  {
    id: 'T-077',
    rule: 'D-25',
    name: 'same kind, label and amount',
    tenancy: {},
    charges: [
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
    ],
    expected: [
      null,
      {
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['DUPLICATE_CHARGE'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-078',
    rule: 'D-25',
    name: 'label differs by case and extra spaces',
    tenancy: {},
    charges: [
      cost(1_200_000, { label: 'Wall painting', receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { label: '  wall   PAINTING ', receiptAmountPaise: 1_200_000 }),
    ],
    expected: [
      null,
      {
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['DUPLICATE_CHARGE'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-079',
    rule: 'D-25',
    name: 'label differs by a word',
    tenancy: {},
    charges: [
      cost(1_200_000, { label: 'Wall painting', receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { label: 'Wall repainting', receiptAmountPaise: 1_200_000 }),
    ],
    expected: [
      null,
      {
        expectedPaise: 1_200_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_200_000,
      },
    ],
  },
  {
    id: 'T-080',
    rule: 'D-25',
    name: 'same label, different amount',
    tenancy: {},
    charges: [
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
      cost(1_100_000, { receiptAmountPaise: 1_200_000 }),
    ],
    expected: [
      null,
      {
        expectedPaise: 1_200_000,
        result: 'supported',
        reasons: ['BELOW_EXPECTED'],
        consistent: 1_100_000,
      },
    ],
  },
  {
    id: 'T-081',
    rule: 'D-25',
    name: 'same label and amount, different kind',
    tenancy: {},
    charges: [
      cost(300_000, { label: 'Service fee', receiptAmountPaise: 300_000 }),
      fixedFee(300_000, { leaseAmountPaise: 300_000 }),
    ],
    expected: [
      null,
      { expectedPaise: 300_000, result: 'supported', reasons: ['MATCHES'], consistent: 300_000 },
    ],
  },
  {
    id: 'T-082',
    rule: 'D-25',
    name: 'third copy is also a duplicate',
    tenancy: {},
    charges: [
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
    ],
    expected: [
      null,
      null,
      {
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['DUPLICATE_CHARGE'],
        askAbout: 1_200_000,
      },
    ],
  },
  {
    id: 'T-083',
    rule: 'D-25, D-33',
    name: 'duplicate with evidence unconfirmed',
    tenancy: {},
    charges: [
      cost(1_200_000, { receiptAmountPaise: 1_200_000 }),
      cost(1_200_000, { receiptAmountPaise: 1_200_000, evidence: 'unconfirmed' }),
    ],
    expected: [
      null,
      {
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['DUPLICATE_CHARGE', 'CLAUSE_UNCONFIRMED'],
        askAbout: 1_200_000,
      },
    ],
  },
];

describe('duplicates', () => {
  it.each(CASES.map((testCase) => [caseTitle(testCase), testCase] as const))(
    '%s',
    (_title, testCase) => {
      const { actual, expected } = runCase(testCase);
      expect(actual).toEqual(expected);
    },
  );
});
