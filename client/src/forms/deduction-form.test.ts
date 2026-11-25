import { describe, expect, it } from 'vitest';
import { blankDrafts, draftsFromDeduction, readDeduction, withKind } from './deduction-form.js';
import type { DeductionDrafts } from './deduction-form.js';

function read(change: Partial<DeductionDrafts>) {
  return readDeduction(
    { ...blankDrafts(), label: 'Electricity', amount: '1,200', ...change },
    'd1',
  );
}

describe('deduction form reading', () => {
  it('F1-R5 the label is required for every kind, and at most 120 characters', () => {
    for (const kind of ['rent', 'metered', 'fixed_fee', 'cost'] as const) {
      expect(read({ kind, label: ' ' }).errors.label).toBe('REQUIRED');
    }
    expect(read({ kind: 'cost', label: 'x'.repeat(121) }).errors.label).toBe('TEXT_TOO_LONG');
  });

  it('F1-R7 rent needs a month and already paid defaults to 0', () => {
    expect(read({ kind: 'rent' }).errors.rentMonth).toBe('REQUIRED');
    expect(read({ kind: 'rent', rentMonth: '2026-13' }).errors.rentMonth).toBe('MONTH_FORMAT');
    expect(read({ kind: 'rent', rentMonth: '2026-06' }).deduction).toMatchObject({
      kind: 'rent',
      alreadyPaidPaise: 0,
    });
  });

  it('F1-R6 a metered bill may leave readings and rate empty, and the fixed charge defaults to 0', () => {
    expect(read({ kind: 'metered' }).deduction).toMatchObject({
      kind: 'metered',
      fixedChargePaise: 0,
    });
  });

  it('D-22 the current reading below the previous is rejected on the current reading (T-020, F1-AC8)', () => {
    const below = read({ kind: 'metered', previousReading: '120.50', currentReading: '110' });
    expect(below.errors.currentReading).toBe('CURRENT_BELOW_PREVIOUS');
    expect(below.deduction).toBeNull();
    const equal = read({ kind: 'metered', previousReading: '120.50', currentReading: '120.50' });
    expect(equal.deduction).not.toBeNull();
  });

  it('D-22 the previous reading can be raised or lowered to get out of the conflict', () => {
    const base = { kind: 'metered', currentReading: '110' } as const;
    expect(read({ ...base, previousReading: '120' }).deduction).toBeNull();
    expect(read({ ...base, previousReading: '100' }).deduction).not.toBeNull();
  });

  it('D-22 a reading with 3 decimals and a rate above the limit are rejected', () => {
    expect(read({ kind: 'metered', previousReading: '1.234' }).errors.previousReading).toBe(
      'READING_FORMAT',
    );
    expect(read({ kind: 'metered', rate: '1,001' }).errors.rate).toBe('RATE_FORMAT');
  });

  it('F1-R5 changing the kind clears the facts of the old kind', () => {
    const typed = {
      ...blankDrafts(),
      kind: 'metered',
      previousReading: '5',
      label: 'Bill',
      amount: '10',
    } as const;
    const next = withKind(typed, 'cost');
    expect(next).toMatchObject({ kind: 'cost', previousReading: '', label: 'Bill', amount: '10' });
  });

  it('F1-R5 a stored deduction is shown back as text that reads to the same deduction', () => {
    const stored = read({
      kind: 'metered',
      previousReading: '120.50',
      currentReading: '160',
      rate: '8.50',
    });
    expect(stored.deduction).not.toBeNull();
    if (stored.deduction !== null) {
      expect(readDeduction(draftsFromDeduction(stored.deduction, []), 'd1').deduction).toEqual(
        stored.deduction,
      );
    }
  });
});
