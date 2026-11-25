import type { Deduction } from '../../schemas/deduction.js';
import { calculateMetered } from './metered.js';
import { calculateRent } from './rent.js';
import type { RentDays, RentTerms } from './rent.js';

export interface Calculation {
  /** Null when the facts do not give an amount. D-25 is not applied here. */
  readonly expectedPaise: number | null;
  /** Null for every kind but rent. */
  readonly rentDays: RentDays | null;
}

/** D-20 to D-24. A new kind does not compile until it has a case. */
export function calculateExpected(deduction: Deduction, terms: RentTerms): Calculation {
  switch (deduction.kind) {
    case 'rent':
      return calculateRent(deduction, terms);
    case 'metered':
      return { expectedPaise: calculateMetered(deduction), rentDays: null };
    case 'fixed_fee':
      return { expectedPaise: deduction.leaseAmountPaise ?? null, rentDays: null }; // D-23
    case 'cost':
      return { expectedPaise: deduction.receiptAmountPaise ?? null, rentDays: null }; // D-24
  }
}
