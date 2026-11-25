/* eslint-disable max-lines -- a table with one entry for each row of docs/testing/CASES.md */
import { describe, expect, it } from 'vitest';
import { caseTitle, cost, fixedFee, metered, runCase } from '../../test-support/cases.js';
import type { CalculationCase } from '../../test-support/cases.js';

// 1234.50 and 1301.75 units at ₹8.50 a unit: 57162.5 paise before rounding.
const READINGS = { previousReading: 123_450, currentReading: 130_175, ratePaisePerUnit: 850 };

const CASES: readonly CalculationCase[] = [
  {
    id: 'T-054',
    rule: 'D-22, D-2',
    name: 'decimal readings, 67.25 units at ₹8.50 is 57162.5 paise, rounds up',
    tenancy: {},
    charges: [metered(57_163, { ...READINGS })],
    expected: [
      { expectedPaise: 57_163, result: 'supported', reasons: ['MATCHES'], consistent: 57_163 },
    ],
  },
  {
    id: 'T-055',
    rule: 'D-22',
    name: 'charge 1 paise below expected',
    tenancy: {},
    charges: [metered(57_162, { ...READINGS })],
    expected: [
      {
        expectedPaise: 57_163,
        result: 'supported',
        reasons: ['BELOW_EXPECTED'],
        consistent: 57_162,
      },
    ],
  },
  {
    id: 'T-056',
    rule: 'D-22',
    name: 'charge above expected',
    tenancy: {},
    charges: [metered(60_000, { ...READINGS })],
    expected: [
      {
        expectedPaise: 57_163,
        result: 'recalculate',
        reasons: ['ABOVE_METER_TOTAL'],
        askAbout: 2_837,
        consistent: 57_163,
      },
    ],
  },
  {
    id: 'T-057',
    rule: 'D-22',
    name: 'with a fixed charge',
    tenancy: {},
    charges: [metered(67_163, { ...READINGS, fixedChargePaise: 10_000 })],
    expected: [
      { expectedPaise: 67_163, result: 'supported', reasons: ['MATCHES'], consistent: 67_163 },
    ],
  },
  {
    id: 'T-058',
    rule: 'D-22',
    name: 'equal readings, no fixed charge',
    tenancy: {},
    charges: [
      metered(50_000, { previousReading: 123_450, currentReading: 123_450, ratePaisePerUnit: 850 }),
    ],
    expected: [
      { expectedPaise: 0, result: 'recalculate', reasons: ['ABOVE_METER_TOTAL'], askAbout: 50_000 },
    ],
  },
  {
    id: 'T-059',
    rule: 'D-22',
    name: 'equal readings, fixed charge',
    tenancy: {},
    charges: [
      metered(10_000, {
        previousReading: 123_450,
        currentReading: 123_450,
        ratePaisePerUnit: 850,
        fixedChargePaise: 10_000,
      }),
    ],
    expected: [
      { expectedPaise: 10_000, result: 'supported', reasons: ['MATCHES'], consistent: 10_000 },
    ],
  },
  {
    id: 'T-060',
    rule: 'D-22, D-2',
    name: 'half a paisa rounds up (0.01 unit at 50 paise)',
    tenancy: {},
    charges: [
      metered(1, { previousReading: 10_000, currentReading: 10_001, ratePaisePerUnit: 50 }),
    ],
    expected: [{ expectedPaise: 1, result: 'supported', reasons: ['MATCHES'], consistent: 1 }],
  },
  {
    id: 'T-061',
    rule: 'D-22, D-2',
    name: 'below half rounds down (0.01 unit at 49 paise)',
    tenancy: {},
    charges: [
      metered(1, { previousReading: 10_000, currentReading: 10_001, ratePaisePerUnit: 49 }),
    ],
    expected: [
      { expectedPaise: 0, result: 'recalculate', reasons: ['ABOVE_METER_TOTAL'], askAbout: 1 },
    ],
  },
  {
    id: 'T-062',
    rule: 'D-22, D-34',
    name: 'previous reading missing',
    tenancy: {},
    charges: [metered(57_163, { ...READINGS, previousReading: undefined })],
    expected: [
      { expectedPaise: null, result: 'unclear', reasons: ['FACTS_MISSING'], unclear: 57_163 },
    ],
  },
  {
    id: 'T-062',
    rule: 'D-22, D-34',
    name: 'current reading missing',
    tenancy: {},
    charges: [metered(57_163, { ...READINGS, currentReading: undefined })],
    expected: [
      { expectedPaise: null, result: 'unclear', reasons: ['FACTS_MISSING'], unclear: 57_163 },
    ],
  },
  {
    id: 'T-062',
    rule: 'D-22, D-34',
    name: 'rate missing',
    tenancy: {},
    charges: [metered(57_163, { ...READINGS, ratePaisePerUnit: undefined })],
    expected: [
      { expectedPaise: null, result: 'unclear', reasons: ['FACTS_MISSING'], unclear: 57_163 },
    ],
  },
  {
    id: 'T-063',
    rule: 'D-22',
    name: 'largest allowed readings and rate: 10,000,000 units at ₹1,000 a unit, charge at the D-4 limit',
    tenancy: {},
    charges: [
      metered(1_000_000_000, {
        previousReading: 0,
        currentReading: 1_000_000_000,
        ratePaisePerUnit: 100_000,
      }),
    ],
    expected: [
      {
        expectedPaise: 1_000_000_000_000,
        result: 'supported',
        reasons: ['BELOW_EXPECTED'],
        consistent: 1_000_000_000,
      },
    ],
  },
  {
    id: 'T-067',
    rule: 'D-23',
    name: 'charge equals the lease amount',
    tenancy: {},
    charges: [fixedFee(300_000, { leaseAmountPaise: 300_000 })],
    expected: [
      { expectedPaise: 300_000, result: 'supported', reasons: ['MATCHES'], consistent: 300_000 },
    ],
  },
  {
    id: 'T-068',
    rule: 'D-23',
    name: 'charge above the lease amount',
    tenancy: {},
    charges: [fixedFee(350_000, { leaseAmountPaise: 300_000 })],
    expected: [
      {
        expectedPaise: 300_000,
        result: 'recalculate',
        reasons: ['ABOVE_LEASE_AMOUNT'],
        askAbout: 50_000,
        consistent: 300_000,
      },
    ],
  },
  {
    id: 'T-069',
    rule: 'D-23',
    name: 'charge below the lease amount',
    tenancy: {},
    charges: [fixedFee(250_000, { leaseAmountPaise: 300_000 })],
    expected: [
      {
        expectedPaise: 300_000,
        result: 'supported',
        reasons: ['BELOW_EXPECTED'],
        consistent: 250_000,
      },
    ],
  },
  {
    id: 'T-070',
    rule: 'D-23',
    name: 'no lease amount',
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
    id: 'T-071',
    rule: 'D-24',
    name: 'receipt equals the charge',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_200_000 })],
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
    id: 'T-072',
    rule: 'D-24',
    name: 'receipt lower than the charge',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 800_000 })],
    expected: [
      {
        expectedPaise: 800_000,
        result: 'recalculate',
        reasons: ['ABOVE_RECEIPT'],
        askAbout: 400_000,
        consistent: 800_000,
      },
    ],
  },
  {
    id: 'T-073',
    rule: 'D-24',
    name: 'receipt higher than the charge',
    tenancy: {},
    charges: [cost(1_200_000, { receiptAmountPaise: 1_500_000 })],
    expected: [
      {
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['BELOW_EXPECTED'],
        consistent: 1_200_000,
      },
    ],
  },
  {
    id: 'T-074',
    rule: 'D-24',
    name: 'no receipt',
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
];

describe('metered, fixed fee and cost', () => {
  it.each(CASES.map((testCase) => [caseTitle(testCase), testCase] as const))(
    '%s',
    (_title, testCase) => {
      const { actual, expected } = runCase(testCase);
      expect(actual).toEqual(expected);
    },
  );
});
