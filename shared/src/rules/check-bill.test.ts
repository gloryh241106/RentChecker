import { describe, expect, it } from 'vitest';
import type { BillCheck } from '../schemas/bill-check.js';
import { checkBill } from './check-bill.js';

const BILL: BillCheck = {
  previousReading: 120_000,
  currentReading: 135_050,
  ratePaisePerUnit: 750,
  fixedChargePaise: 10_000,
  billedTotalPaise: 130_000,
};

function bill(change: Partial<BillCheck>): BillCheck {
  return { ...BILL, ...change };
}

describe('checkBill', () => {
  it.each([
    ['T-064 F5-AC1 total above expected', 130_000, 7_125, 'ABOVE_METER_TOTAL'],
    ['T-065 F5-AC2 total equals expected', 122_875, 0, 'MATCHES'],
    ['T-066 F5-AC3 total below expected', 100_000, -22_875, 'BELOW_EXPECTED'],
  ] as const)('D-22 D-37 %s', (_title, billedTotalPaise, differencePaise, reason) => {
    expect(checkBill(bill({ billedTotalPaise }))).toEqual({
      expectedPaise: 122_875,
      billedPaise: billedTotalPaise,
      differencePaise,
      reason,
    });
  });

  it('F5-R3 the outcome has no primary result and no clause reason', () => {
    const outcome = checkBill(BILL);
    expect(Object.keys(outcome ?? {}).sort()).toEqual([
      'billedPaise',
      'differencePaise',
      'expectedPaise',
      'reason',
    ]);
  });

  it('F5-AC4 D-22 a current reading below the previous gives no amount', () => {
    expect(checkBill(bill({ previousReading: 120_000, currentReading: 110_000 }))).toBeNull();
  });

  it.each(['previousReading', 'currentReading', 'ratePaisePerUnit', 'billedTotalPaise'] as const)(
    'F5-AC5 a missing %s gives no amount',
    (field) => {
      expect(checkBill(bill({ [field]: undefined }))).toBeNull();
    },
  );

  it('F5 edge: equal readings are 0 units, so expected is the fixed charge', () => {
    const outcome = checkBill(bill({ currentReading: 120_000, billedTotalPaise: 10_000 }));
    expect(outcome).toMatchObject({ expectedPaise: 10_000, reason: 'MATCHES' });
  });

  it('F5-R1 a fixed charge of 0 is the plain readings times rate', () => {
    const outcome = checkBill(bill({ fixedChargePaise: 0, billedTotalPaise: 112_875 }));
    expect(outcome).toMatchObject({ expectedPaise: 112_875, reason: 'MATCHES' });
  });

  it('D-2 D-22 the readings times rate is rounded half up to the paisa', () => {
    // 0.01 unit at ₹0.50 is half a paisa, which rounds up to 1.
    const outcome = checkBill(
      bill({ previousReading: 0, currentReading: 1, ratePaisePerUnit: 50, fixedChargePaise: 0 }),
    );
    expect(outcome?.expectedPaise).toBe(1);
  });
});
