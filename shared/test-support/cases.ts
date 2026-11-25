// Builders for the calculation tables. The defaults are those at the top of docs/testing/CASES.md.
import type { ReasonCode, PrimaryResult } from '../src/rules/codes.js';
import { evaluate } from '../src/rules/evaluate.js';
import type { CheckInput, DeductionResult } from '../src/rules/evaluate.js';
import type { Buckets } from '../src/rules/buckets.js';
import type { RentDays } from '../src/rules/expected/rent.js';
import type { Deduction, DeductionOf } from '../src/schemas/deduction.js';
import type { EvidenceState } from '../src/schemas/evidence.js';
import type { CheckableTenancy } from '../src/schemas/tenancy.js';

/** One line of the landlord's list, with the facts around it. Ids are added by `buildInput`. */
export interface Charge {
  readonly deduction: Deduction;
  readonly evidence?: EvidenceState;
  readonly repairDate?: string;
}

type ChargeFacts<Kind extends Deduction['kind']> = Partial<
  Omit<DeductionOf<Kind>, 'id' | 'kind' | 'amountPaise'>
> &
  Omit<Charge, 'deduction'>;

const ID_TO_REPLACE = 'unset';

export function rent(amountPaise: number, facts: ChargeFacts<'rent'> = {}): Charge {
  const { evidence, repairDate, ...own } = facts;
  const defaults = { label: 'Rent', rentMonth: '2026-06', alreadyPaidPaise: 0 };
  const deduction: Deduction = {
    id: ID_TO_REPLACE,
    kind: 'rent',
    amountPaise,
    ...defaults,
    ...own,
  };
  return { deduction, evidence, repairDate };
}

export function metered(amountPaise: number, facts: ChargeFacts<'metered'> = {}): Charge {
  const { evidence, repairDate, ...own } = facts;
  const defaults = { label: 'Electricity', fixedChargePaise: 0 };
  const deduction: Deduction = {
    id: ID_TO_REPLACE,
    kind: 'metered',
    amountPaise,
    ...defaults,
    ...own,
  };
  return { deduction, evidence, repairDate };
}

export function fixedFee(amountPaise: number, facts: ChargeFacts<'fixed_fee'> = {}): Charge {
  const { evidence, repairDate, ...own } = facts;
  const deduction: Deduction = {
    id: ID_TO_REPLACE,
    kind: 'fixed_fee',
    amountPaise,
    label: 'Service fee',
    ...own,
  };
  return { deduction, evidence, repairDate };
}

export function cost(amountPaise: number, facts: ChargeFacts<'cost'> = {}): Charge {
  const { evidence, repairDate, ...own } = facts;
  const deduction: Deduction = {
    id: ID_TO_REPLACE,
    kind: 'cost',
    amountPaise,
    label: 'Repainting',
    ...own,
  };
  return { deduction, evidence, repairDate };
}

/** Charge n of the list gets the id `dn`, and its repair the id `rn`. */
export function buildInput(
  tenancy: Partial<CheckableTenancy>,
  charges: readonly Charge[],
): CheckInput {
  return {
    tenancy: {
      depositPaise: 3_000_000,
      monthlyRentPaise: 1_500_000,
      handoverDate: '2026-06-15',
      partialMonth: 'unsure',
      handoverDayCounts: true,
      ...tenancy,
    },
    deductions: charges.map(({ deduction }, index) => ({ ...deduction, id: `d${index + 1}` })),
    evidence: charges.map(({ evidence }, index) => ({
      deductionId: `d${index + 1}`,
      state: evidence ?? 'verified',
    })),
    repairs: charges.flatMap(({ repairDate }, index) =>
      repairDate === undefined
        ? []
        : [{ id: `r${index + 1}`, date: repairDate, deductionId: `d${index + 1}` }],
    ),
  };
}

/** The Expected column. A bucket that is not listed is 0, and `days` is listed for rent only. */
export interface ExpectedResult {
  readonly days?: readonly [used: number, inMonth: number];
  readonly expectedPaise: number | null;
  readonly result: PrimaryResult;
  readonly reasons: readonly ReasonCode[];
  readonly askAbout?: number;
  readonly awaitingProof?: number;
  readonly unclear?: number;
  readonly consistent?: number;
}

export interface CalculationCase {
  readonly id: string;
  readonly rule: string;
  readonly name: string;
  readonly tenancy: Partial<CheckableTenancy>;
  readonly charges: readonly Charge[];
  /** One entry per charge. Null where the case says nothing about that charge. */
  readonly expected: readonly (ExpectedResult | null)[];
}

interface ComparableResult {
  readonly rentDays: RentDays | null;
  readonly expectedPaise: number | null;
  readonly result: PrimaryResult;
  readonly reasons: readonly ReasonCode[];
  readonly buckets: Buckets;
}

/** Sorting the reasons compares them as a set. */
function comparableActual(actual: DeductionResult): ComparableResult {
  const { rentDays, expectedPaise, result, reasons, buckets } = actual;
  return { rentDays, expectedPaise, result, reasons: [...reasons].sort(), buckets };
}

function comparableExpected(expected: ExpectedResult): ComparableResult {
  const { days, expectedPaise, result, reasons } = expected;
  const { askAbout = 0, awaitingProof = 0, unclear = 0, consistent = 0 } = expected;
  return {
    rentDays: days === undefined ? null : { used: days[0], inMonth: days[1] },
    expectedPaise,
    result,
    reasons: [...reasons].sort(),
    buckets: {
      askAboutPaise: askAbout,
      awaitingProofPaise: awaitingProof,
      unclearPaise: unclear,
      consistentPaise: consistent,
    },
  };
}

export function bucketSum(buckets: Buckets): number {
  return (
    buckets.askAboutPaise +
    buckets.awaitingProofPaise +
    buckets.unclearPaise +
    buckets.consistentPaise
  );
}

/** STRATEGY.md: rule, short phrase, case ID. */
export function caseTitle({ rule, name, id }: CalculationCase): string {
  return `${rule} ${name} (${id})`;
}

interface CaseOutcome {
  readonly results: readonly (ComparableResult | null)[];
  /** D-40: what the buckets of each charge add up to. */
  readonly bucketSums: readonly number[];
}

/** Both sides of one row. They are equal when the case passes. */
export function runCase(testCase: CalculationCase): {
  readonly actual: CaseOutcome;
  readonly expected: CaseOutcome;
} {
  const input = buildInput(testCase.tenancy, testCase.charges);
  const { deductions } = evaluate(input);
  return {
    actual: {
      results: deductions.map((result, index) =>
        testCase.expected[index] === null ? null : comparableActual(result),
      ),
      bucketSums: deductions.map((result) => bucketSum(result.buckets)),
    },
    expected: {
      results: testCase.expected.map((row) => (row === null ? null : comparableExpected(row))),
      bucketSums: input.deductions.map((deduction) => deduction.amountPaise),
    },
  };
}
