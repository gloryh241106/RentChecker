import { describe, expect, it } from 'vitest';
import { checkInput } from './checks.js';
import type { CheckedInput } from './checks.js';

const TODAY = '2026-11-25';
const PAINT = { label: 'Painting', amountPaise: 1_200_000, kind: 'cost' };
const RENT = { label: 'June rent', amountPaise: 1_500_000, kind: 'rent', rentMonth: '2026-06' };
const GOOD: CheckedInput = {
  depositPaise: 3_000_000,
  monthlyRentPaise: 1_500_000,
  handoverDate: '2026-06-15',
  startDate: '2025-06-01',
  statedRefundPaise: 0,
  deductions: [PAINT, RENT],
};

const codes = (change: Partial<CheckedInput>) =>
  checkInput({ ...GOOD, ...change }, TODAY).map(({ code }) => code);

describe('input checks (F9-R11)', () => {
  it('F9-R11 likely input has none, and empty input has none (T-245)', () => {
    expect(codes({})).toEqual([]);
    expect(checkInput({ deductions: [] }, TODAY)).toEqual([]);
  });

  it.each<[string, Partial<CheckedInput>]>([
    ['START_AFTER_HANDOVER', { startDate: '2026-06-16' }],
    ['DATE_FAR', { handoverDate: '2027-11-26' }],
    ['DATE_FAR', { handoverDate: '2016-11-24', startDate: undefined, deductions: [] }],
    ['DEPOSIT_SMALL', { depositPaise: 1_499_999, deductions: [] }],
    ['DEPOSIT_LARGE', { depositPaise: 18_000_001 }],
    ['REFUND_LARGE', { statedRefundPaise: 3_000_001 }],
    ['CHARGE_LARGE', { deductions: [{ ...PAINT, amountPaise: 12_000_000 }] }],
    ['TOTAL_LARGE', { deductions: [PAINT, { ...PAINT, label: 'Cleaning' }, RENT] }],
    ['RENT_LARGE', { deductions: [{ ...RENT, amountPaise: 1_500_001 }] }],
    ['RENT_LATE', { deductions: [{ ...RENT, rentMonth: '2026-07' }] }],
    ['TWICE', { deductions: [PAINT, { ...PAINT, label: 'painting' }] }],
  ])('F9-R11 %s (T-245)', (code, change) => {
    expect(codes(change)).toEqual([code]);
  });

  it.each<[string, Partial<CheckedInput>]>([
    ['a handover a year ahead', { handoverDate: '2027-11-25' }],
    [
      'a handover ten years back',
      { handoverDate: '2016-11-25', startDate: undefined, deductions: [] },
    ],
    ['a deposit of one month', { depositPaise: 1_500_000, deductions: [] }],
    ['a deposit of 12 months', { depositPaise: 18_000_000 }],
    ['a refund of the whole deposit', { statedRefundPaise: 3_000_000 }],
    ['the same label with another amount', { deductions: [PAINT, { ...PAINT, amountPaise: 1 }] }],
  ])('F9-R11 nothing for %s (T-245)', (_name, change) => {
    expect(codes(change)).toEqual([]);
  });

  it('F9-AC5 names the charge and the deposit (T-245)', () => {
    const [check] = checkInput(
      { ...GOOD, deductions: [{ ...PAINT, amountPaise: 12_000_000 }] },
      TODAY,
    );
    expect(check?.text).toBe(
      'Painting is ₹1,20,000, more than the whole deposit of ₹30,000. Check for an extra zero.',
    );
  });
});
