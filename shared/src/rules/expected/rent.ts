import { dayOf, daysInMonth, isAfter, monthOf } from '../../dates.js';
import { divideRoundHalfUp } from '../../rounding.js';
import type { DeductionOf } from '../../schemas/deduction.js';
import type { CheckableTenancy } from '../../schemas/tenancy.js';

type TenancyPeriod = Pick<CheckableTenancy, 'startDate' | 'handoverDate' | 'handoverDayCounts'>;

export type RentTerms = TenancyPeriod & Pick<CheckableTenancy, 'monthlyRentPaise' | 'partialMonth'>;

export interface RentDays {
  readonly used: number;
  readonly inMonth: number;
}

interface RentCalculation {
  readonly expectedPaise: number;
  readonly rentDays: RentDays;
}

function firstDayUsed(rentMonth: string, startDate: string | undefined, inMonth: number): number {
  if (startDate === undefined || isAfter(rentMonth, monthOf(startDate))) {
    return 1;
  }
  // A month before the start date has no first day, so the count ends at 0 or below.
  return isAfter(monthOf(startDate), rentMonth) ? inMonth + 1 : dayOf(startDate);
}

function lastDayUsed(rentMonth: string, handoverDate: string, inMonth: number): number {
  const handoverMonth = monthOf(handoverDate);
  if (isAfter(handoverMonth, rentMonth)) {
    return inMonth;
  }
  return isAfter(rentMonth, handoverMonth) ? 0 : dayOf(handoverDate);
}

/** D-20. */
function countRentDays(rentMonth: string, period: TenancyPeriod): RentDays {
  const { startDate, handoverDate, handoverDayCounts } = period;
  const inMonth = daysInMonth(rentMonth);
  const first = firstDayUsed(rentMonth, startDate, inMonth);
  const last = lastDayUsed(rentMonth, handoverDate, inMonth);
  const uncounted = !handoverDayCounts && monthOf(handoverDate) === rentMonth ? 1 : 0;
  return { used: Math.max(0, last - first + 1 - uncounted), inMonth };
}

function rentForMonth(terms: RentTerms, { used, inMonth }: RentDays): number {
  // D-21
  if (terms.partialMonth === 'full_month' && used > 0) {
    return terms.monthlyRentPaise;
  }
  return divideRoundHalfUp(terms.monthlyRentPaise * used, inMonth);
}

/** D-20, D-21. */
export function calculateRent(
  rent: Pick<DeductionOf<'rent'>, 'rentMonth' | 'alreadyPaidPaise'>,
  terms: RentTerms,
): RentCalculation {
  const rentDays = countRentDays(rent.rentMonth, terms);
  const expectedPaise = Math.max(0, rentForMonth(terms, rentDays) - rent.alreadyPaidPaise);
  return { expectedPaise, rentDays };
}

export function isPartialMonth({ used, inMonth }: RentDays): boolean {
  return used >= 1 && used < inMonth;
}
