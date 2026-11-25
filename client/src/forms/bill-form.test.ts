import { describe, expect, it } from 'vitest';
import { draftsFromBill, readBill } from './bill-form.js';
import type { BillDrafts } from './bill-form.js';

const FILLED: BillDrafts = {
  previousReading: '1,200.00',
  currentReading: '1350.50',
  rate: '7.50',
  fixedCharge: '100',
  billedTotal: '1,300',
};

function read(change: Partial<BillDrafts>) {
  return readBill({ ...FILLED, ...change });
}

describe('bill form reading', () => {
  it('F5-R1 D-3 D-22 typed text is stored as hundredths and paise (T-064)', () => {
    const { bill, errors } = read({});
    expect(errors).toEqual({});
    expect(bill).toEqual({
      previousReading: 120_000,
      currentReading: 135_050,
      ratePaisePerUnit: 750,
      fixedChargePaise: 10_000,
      billedTotalPaise: 130_000,
    });
  });

  it.each([
    ['previousReading', 'READING_FORMAT'],
    ['currentReading', 'READING_FORMAT'],
    ['rate', 'RATE_FORMAT'],
    ['fixedCharge', 'AMOUNT_FORMAT'],
    ['billedTotal', 'AMOUNT_FORMAT'],
  ] as const)('F5-R2 invalid text in %s is rejected and never reaches the store', (field, code) => {
    const { bill, errors } = read({ [field]: '12abc' });
    expect(errors[field]).toBe(code);
    expect(JSON.stringify(bill)).not.toContain('12abc');
  });

  it.each(['previousReading', 'currentReading', 'rate', 'billedTotal'] as const)(
    'F5-R2 F5-AC5 an empty %s is required',
    (field) => {
      expect(read({ [field]: '' }).errors[field]).toBe('REQUIRED');
    },
  );

  it('F5-R1 an empty fixed charge is 0 and no mistake', () => {
    const { bill, errors } = read({ fixedCharge: '' });
    expect(errors.fixedCharge).toBeUndefined();
    expect(bill.fixedChargePaise).toBe(0);
  });

  it('F5-R1 D-4 a bill total of 0 is rejected', () => {
    expect(read({ billedTotal: '0' }).errors.billedTotal).toBe('AMOUNT_ZERO');
  });

  it('F5-AC4 D-22 the current reading below the previous is reported on the current reading', () => {
    const { bill, errors } = read({ previousReading: '1,200', currentReading: '1,100' });
    expect(errors.currentReading).toBe('CURRENT_BELOW_PREVIOUS');
    expect(errors.previousReading).toBeUndefined();
    expect(bill.currentReading).toBeUndefined();
    expect(bill.previousReading).toBe(120_000);
  });

  it('F5-R4 a stored bill is shown back as text that reads to the same bill', () => {
    const { bill } = read({});
    expect(readBill(draftsFromBill(bill)).bill).toEqual(bill);
  });

  it('F5-R4 a stored fixed charge of 0 is shown as an empty box', () => {
    expect(draftsFromBill({ fixedChargePaise: 0 }).fixedCharge).toBe('');
    expect(draftsFromBill(undefined).previousReading).toBe('');
  });
});
