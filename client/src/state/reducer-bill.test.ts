import { describe, expect, it } from 'vitest';
import type { BillCheck } from '../shared.js';
import { run } from '../test-support/builders.js';
import { hasData } from './has-data.js';

const BILL: BillCheck = {
  previousReading: 120_000,
  currentReading: 135_050,
  ratePaisePerUnit: 750,
  fixedChargePaise: 10_000,
  billedTotalPaise: 130_000,
};

const BLANK: BillCheck = { fixedChargePaise: 0 };

describe('bill actions', () => {
  it('F5-R4 the bill form values are stored', () => {
    expect(run([{ type: 'bill/set', bill: BILL }]).bill).toEqual(BILL);
  });

  it('F5-R4 a partly filled form is stored, so a reload keeps it', () => {
    const partial: BillCheck = { fixedChargePaise: 0, previousReading: 100 };
    expect(run([{ type: 'bill/set', bill: partial }]).bill).toEqual(partial);
  });

  it('F5-R4 D-22 a bill with the current reading below the previous is not stored', () => {
    const wrong: BillCheck = { ...BILL, previousReading: 200_000, currentReading: 100_000 };
    expect(run([{ type: 'bill/set', bill: wrong }]).bill).toBeUndefined();
  });

  it('F5-R4 a form emptied again is not kept, so it is not saved data (F1-R19)', () => {
    const state = run([
      { type: 'bill/set', bill: BILL },
      { type: 'bill/set', bill: BLANK },
    ]);
    expect(state.bill).toBeUndefined();
    expect(hasData(state)).toBe(false);
  });

  it('F5-R4 F1-R19 a stored bill counts as data, and reset removes it', () => {
    const state = run([{ type: 'bill/set', bill: BILL }]);
    expect(hasData(state)).toBe(true);
    expect(run([{ type: 'workspace/reset' }], state).bill).toBeUndefined();
  });

  it('F5-R4 an empty form sets nothing on an empty workspace', () => {
    const before = run([]);
    expect(run([{ type: 'bill/set', bill: BLANK }], before)).toBe(before);
  });
});
