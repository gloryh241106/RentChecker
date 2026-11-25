import { findAmounts } from '../charges/amount.js';
import { readDates } from './read-dates.js';
import type { FoundDate } from './read-dates.js';

/** F9-R5. The only amount of a text, in paise. */
export function readOnlyAmount(text: string): number | null {
  const [first, second] = findAmounts(withoutDates(text));
  return first === undefined || second !== undefined ? null : first.amountPaise;
}

/** F9-R5. The only date of a text. */
export function readOnlyDate(text: string): FoundDate | null {
  const [first, second] = readDates(text);
  return first === undefined || second !== undefined ? null : first;
}

/** Dates are blanked out, so the year of one is never read as an amount. */
export function withoutDates(text: string): string {
  return readDates(text).reduce((rest, { words }) => rest.replace(words, ' '), text);
}
