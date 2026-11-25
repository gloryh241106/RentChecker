/* eslint-disable max-lines -- a table with one entry for each row of docs/testing/CASES.md */
import { describe, expect, it } from 'vitest';
import { caseTitle, rent, runCase } from '../../test-support/cases.js';
import type { CalculationCase } from '../../test-support/cases.js';

const CASES: readonly CalculationCase[] = [
  {
    id: 'T-023',
    rule: 'D-20',
    name: '30-day month, half used, full rent charged',
    tenancy: {},
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 750_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 750_000,
        consistent: 750_000,
      },
    ],
  },
  {
    id: 'T-024',
    rule: 'D-20',
    name: 'charge equals the expected amount',
    tenancy: {},
    charges: [rent(750_000)],
    expected: [
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
    id: 'T-025',
    rule: 'D-20',
    name: 'charge below expected',
    tenancy: {},
    charges: [rent(700_000)],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 750_000,
        result: 'supported',
        reasons: ['ASSUMED_PER_DAY', 'BELOW_EXPECTED'],
        consistent: 700_000,
      },
    ],
  },
  {
    id: 'T-026',
    rule: 'D-20',
    name: 'handover day not counted',
    tenancy: { handoverDayCounts: false },
    charges: [rent(700_000)],
    expected: [
      {
        days: [14, 30],
        expectedPaise: 700_000,
        result: 'supported',
        reasons: ['ASSUMED_PER_DAY', 'MATCHES'],
        consistent: 700_000,
      },
    ],
  },
  {
    id: 'T-027',
    rule: 'D-20',
    name: '28-day month (February 2026)',
    tenancy: { handoverDate: '2026-02-10' },
    charges: [rent(1_500_000, { rentMonth: '2026-02' })],
    expected: [
      {
        days: [10, 28],
        expectedPaise: 535_714,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 964_286,
        consistent: 535_714,
      },
    ],
  },
  {
    id: 'T-028',
    rule: 'D-20',
    name: '29-day month (February 2028, leap year)',
    tenancy: { handoverDate: '2028-02-10' },
    charges: [rent(1_500_000, { rentMonth: '2028-02' })],
    expected: [
      {
        days: [10, 29],
        expectedPaise: 517_241,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 982_759,
        consistent: 517_241,
      },
    ],
  },
  {
    id: 'T-029',
    rule: 'D-20',
    name: '31-day month',
    tenancy: { handoverDate: '2026-07-10' },
    charges: [rent(1_500_000, { rentMonth: '2026-07' })],
    expected: [
      {
        days: [10, 31],
        expectedPaise: 483_871,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 1_016_129,
        consistent: 483_871,
      },
    ],
  },
  {
    id: 'T-030',
    rule: 'D-20',
    name: 'handover on the last day of a 31-day month',
    tenancy: { handoverDate: '2026-07-31' },
    charges: [rent(1_500_000, { rentMonth: '2026-07' })],
    expected: [
      {
        days: [31, 31],
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_500_000,
      },
    ],
  },
  {
    id: 'T-031',
    rule: 'D-20',
    name: 'same, handover day not counted',
    tenancy: { handoverDate: '2026-07-31', handoverDayCounts: false },
    charges: [rent(1_500_000, { rentMonth: '2026-07' })],
    expected: [
      {
        days: [30, 31],
        expectedPaise: 1_451_613,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 48_387,
        consistent: 1_451_613,
      },
    ],
  },
  {
    id: 'T-032',
    rule: 'D-20',
    name: 'handover on the last day of a leap February',
    tenancy: { handoverDate: '2028-02-29' },
    charges: [rent(1_500_000, { rentMonth: '2028-02' })],
    expected: [
      {
        days: [29, 29],
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_500_000,
      },
    ],
  },
  {
    id: 'T-033',
    rule: 'D-20',
    name: 'same, handover day not counted',
    tenancy: { handoverDate: '2028-02-29', handoverDayCounts: false },
    charges: [rent(1_500_000, { rentMonth: '2028-02' })],
    expected: [
      {
        days: [28, 29],
        expectedPaise: 1_448_276,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 51_724,
        consistent: 1_448_276,
      },
    ],
  },
  {
    id: 'T-034',
    rule: 'D-20',
    name: 'handover on day 1, day counted',
    tenancy: { handoverDate: '2026-06-01' },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [1, 30],
        expectedPaise: 50_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 1_450_000,
        consistent: 50_000,
      },
    ],
  },
  {
    id: 'T-035',
    rule: 'D-20',
    name: 'handover on day 1, day not counted',
    tenancy: { handoverDate: '2026-06-01', handoverDayCounts: false },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [0, 30],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['RENT_OUTSIDE_TENANCY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-036',
    rule: 'D-20',
    name: 'handover on the last day of a 30-day month',
    tenancy: { handoverDate: '2026-06-30' },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [30, 30],
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_500_000,
      },
    ],
  },
  {
    id: 'T-037',
    rule: 'D-20',
    name: 'same, handover day not counted',
    tenancy: { handoverDate: '2026-06-30', handoverDayCounts: false },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [29, 30],
        expectedPaise: 1_450_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 50_000,
        consistent: 1_450_000,
      },
    ],
  },
  {
    id: 'T-038',
    rule: 'D-20',
    name: 'start and handover in the same month',
    tenancy: { handoverDate: '2026-06-20', startDate: '2026-06-10' },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [11, 30],
        expectedPaise: 550_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 950_000,
        consistent: 550_000,
      },
    ],
  },
  {
    id: 'T-039',
    rule: 'D-20',
    name: 'same, handover day not counted',
    tenancy: { handoverDate: '2026-06-20', startDate: '2026-06-10', handoverDayCounts: false },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [10, 30],
        expectedPaise: 500_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 1_000_000,
        consistent: 500_000,
      },
    ],
  },
  {
    id: 'T-040',
    rule: 'D-20',
    name: 'same day, handover day not counted',
    tenancy: { startDate: '2026-06-15', handoverDayCounts: false },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [0, 30],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['RENT_OUTSIDE_TENANCY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-041',
    rule: 'D-20',
    name: 'month before the start date',
    tenancy: { handoverDate: '2026-08-31', startDate: '2026-06-10' },
    charges: [rent(1_500_000, { rentMonth: '2026-05' })],
    expected: [
      {
        days: [0, 31],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['RENT_OUTSIDE_TENANCY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-042',
    rule: 'D-20',
    name: 'month after the handover date',
    tenancy: {},
    charges: [rent(1_500_000, { rentMonth: '2026-07' })],
    expected: [
      {
        days: [0, 31],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['RENT_OUTSIDE_TENANCY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-043',
    rule: 'D-20',
    name: 'start date mid-month, handover later',
    tenancy: { handoverDate: '2026-08-31', startDate: '2026-06-10' },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [21, 30],
        expectedPaise: 1_050_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 450_000,
        consistent: 1_050_000,
      },
    ],
  },
  {
    id: 'T-044',
    rule: 'D-20',
    name: 'month between start and handover',
    tenancy: { handoverDate: '2026-08-31', startDate: '2026-06-10' },
    charges: [rent(1_500_000, { rentMonth: '2026-07' })],
    expected: [
      {
        days: [31, 31],
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_500_000,
      },
    ],
  },
  {
    id: 'T-045',
    rule: 'D-20',
    name: 'already paid below the expected amount',
    tenancy: {},
    charges: [rent(550_000, { alreadyPaidPaise: 200_000 })],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 550_000,
        result: 'supported',
        reasons: ['ASSUMED_PER_DAY', 'MATCHES'],
        consistent: 550_000,
      },
    ],
  },
  {
    id: 'T-046',
    rule: 'D-20',
    name: 'already paid above the expected amount',
    tenancy: {},
    charges: [rent(1_500_000, { alreadyPaidPaise: 900_000 })],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-047',
    rule: 'D-21',
    name: 'full month, partial use',
    tenancy: { partialMonth: 'full_month' },
    charges: [rent(1_500_000)],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 1_500_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 1_500_000,
      },
    ],
  },
  {
    id: 'T-048',
    rule: 'D-21',
    name: 'full month, 0 days used (month after handover)',
    tenancy: { partialMonth: 'full_month' },
    charges: [rent(1_500_000, { rentMonth: '2026-07' })],
    expected: [
      {
        days: [0, 31],
        expectedPaise: 0,
        result: 'recalculate',
        reasons: ['RENT_OUTSIDE_TENANCY'],
        askAbout: 1_500_000,
      },
    ],
  },
  {
    id: 'T-049',
    rule: 'D-20',
    name: 'per-day charging confirmed',
    tenancy: { partialMonth: 'per_day' },
    charges: [rent(750_000)],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 750_000,
        result: 'supported',
        reasons: ['MATCHES'],
        consistent: 750_000,
      },
    ],
  },
  {
    id: 'T-050',
    rule: 'D-2',
    name: 'a half rounds up: 1 day of 30 is 50000.5',
    tenancy: { handoverDate: '2026-06-01', monthlyRentPaise: 1_500_015 },
    charges: [rent(50_001)],
    expected: [
      {
        days: [1, 30],
        expectedPaise: 50_001,
        result: 'supported',
        reasons: ['ASSUMED_PER_DAY', 'MATCHES'],
        consistent: 50_001,
      },
    ],
  },
  {
    id: 'T-051',
    rule: 'D-2',
    name: 'just below a half: 50000.47 rounds down',
    tenancy: { handoverDate: '2026-06-01', monthlyRentPaise: 1_500_014 },
    charges: [rent(50_000)],
    expected: [
      {
        days: [1, 30],
        expectedPaise: 50_000,
        result: 'supported',
        reasons: ['ASSUMED_PER_DAY', 'MATCHES'],
        consistent: 50_000,
      },
    ],
  },
  {
    id: 'T-052',
    rule: 'D-31',
    name: 'rent charge equals expected, evidence none',
    tenancy: {},
    charges: [rent(750_000, { evidence: 'none' })],
    expected: [
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
    id: 'T-052',
    rule: 'D-31',
    name: 'rent charge equals expected, evidence unconfirmed',
    tenancy: {},
    charges: [rent(750_000, { evidence: 'unconfirmed' })],
    expected: [
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
    id: 'T-052',
    rule: 'D-31',
    name: 'rent charge equals expected, evidence excludes',
    tenancy: {},
    charges: [rent(750_000, { evidence: 'excludes' })],
    expected: [
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
    id: 'T-053',
    rule: 'D-31',
    name: 'rent above expected, evidence none',
    tenancy: {},
    charges: [rent(1_500_000, { evidence: 'none' })],
    expected: [
      {
        days: [15, 30],
        expectedPaise: 750_000,
        result: 'recalculate',
        reasons: ['ABOVE_PRORATED_RENT', 'ASSUMED_PER_DAY'],
        askAbout: 750_000,
        consistent: 750_000,
      },
    ],
  },
];

describe('rent amount', () => {
  it.each(CASES.map((testCase) => [caseTitle(testCase), testCase] as const))(
    '%s',
    (_title, testCase) => {
      const { actual, expected } = runCase(testCase);
      expect(actual).toEqual(expected);
    },
  );
});
