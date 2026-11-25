import { describe, expect, it } from 'vitest';
import { bucketSum, buildInput, cost, fixedFee, metered, rent } from '../../test-support/cases.js';
import type { Charge } from '../../test-support/cases.js';
import type { EvidenceState } from '../schemas/evidence.js';
import { REASON_CODES } from './codes.js';
import { evaluate } from './evaluate.js';

const STATES: readonly EvidenceState[] = ['verified', 'excludes', 'none', 'unconfirmed'];

/** Every kind, with facts below, at and above the amount and with facts missing. */
function everyCharge(amountPaise: number, evidence: EvidenceState): Charge[] {
  const around = [0, amountPaise - 1, amountPaise, amountPaise + 1, undefined];
  return [
    ...['2026-05', '2026-06', '2026-07'].map((rentMonth) =>
      rent(amountPaise, { rentMonth, evidence }),
    ),
    ...around.map((fixedChargePaise = 0) =>
      metered(amountPaise, {
        previousReading: 0,
        currentReading: 0,
        ratePaisePerUnit: 100,
        fixedChargePaise,
        evidence,
      }),
    ),
    metered(amountPaise, { evidence }),
    ...around.map((leaseAmountPaise) => fixedFee(amountPaise, { leaseAmountPaise, evidence })),
    ...around.map((receiptAmountPaise) => cost(amountPaise, { receiptAmountPaise, evidence })),
  ];
}

const COMBINATIONS = [1, 750_000, 1_500_000, 1_000_000_000].flatMap((amountPaise) =>
  STATES.map((evidence) => [amountPaise, evidence] as const),
);

describe('evaluate', () => {
  it.each(COMBINATIONS)('D-40 buckets add up for %i paise, %s, also as duplicates', (...row) => {
    const charges = everyCharge(...row);
    const { deductions, totals } = evaluate(buildInput({}, [...charges, ...charges]));
    for (const result of deductions) {
      expect(bucketSum(result.buckets)).toBe(result.amountPaise);
      expect(Math.min(...Object.values(result.buckets))).toBeGreaterThanOrEqual(0);
    }
    expect(bucketSum(totals)).toBe(totals.totalDeductedPaise);
  });

  it('D-37 lists reasons in the order of the rules', () => {
    const facts = { receiptAmountPaise: 800_000, repairDate: '2026-03-10' };
    const charge = cost(1_200_000, { ...facts, evidence: 'none' });
    const { deductions } = evaluate(buildInput({}, [charge, charge]));
    expect(deductions.map(({ reasons }) => reasons)).toEqual([
      ['ABOVE_RECEIPT', 'CLAUSE_NOT_FOUND', 'REPAIR_REPORTED'],
      ['DUPLICATE_CHARGE', 'CLAUSE_NOT_FOUND', 'REPAIR_REPORTED'],
    ]);
  });

  it('D-37 gives every reason code at least once over the combinations', () => {
    const charge = cost(1, { repairDate: '2026-06-15' });
    const lists = COMBINATIONS.flatMap((row) => everyCharge(...row)).map((single) => [single]);
    const given = new Set(
      [...lists, [charge, charge]]
        .flatMap((charges) => evaluate(buildInput({}, charges)).deductions)
        .flatMap(({ reasons }) => reasons),
    );
    expect(REASON_CODES.filter((code) => !given.has(code))).toEqual([]);
  });

  it('D-30 a deduction without an evidence record is unconfirmed', () => {
    const input = buildInput({}, [cost(1_200_000, { receiptAmountPaise: 1_200_000 })]);
    const [result] = evaluate({ ...input, evidence: [] }).deductions;
    expect(result?.result).toBe('unclear');
    expect(result?.reasons).toContain('CLAUSE_UNCONFIRMED');
  });

  it('D-25 a duplicate still lists its own missing facts', () => {
    const charge = cost(1_200_000);
    const [, copy] = evaluate(buildInput({}, [charge, charge])).deductions;
    expect(copy).toMatchObject({
      expectedPaise: 0,
      result: 'recalculate',
      reasons: ['DUPLICATE_CHARGE', 'RECEIPT_MISSING'],
    });
  });

  it('D-37 separates linked repairs from those dated on or before handover', () => {
    const input = buildInput({}, [cost(1_200_000), cost(500_000, { label: 'Cleaning' })]);
    const repairs = [
      { id: 'late', date: '2026-06-16', deductionId: 'd1' },
      { id: 'early', date: '2026-03-10', deductionId: 'd1' },
      { id: 'unlinked', date: '2026-03-10' },
    ];
    const [first, second] = evaluate({ ...input, repairs }).deductions;
    expect(first?.repairIds).toEqual(['late', 'early']);
    expect(first?.reportedRepairIds).toEqual(['early']);
    expect(second?.repairIds).toEqual([]);
  });
});
