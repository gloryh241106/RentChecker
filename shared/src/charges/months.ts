import { isAfter, isYearMonth, monthOf } from '../dates.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const MONTH_WORD =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;

/** Text that ends in a month name, as before the year in "June 2026". */
export const ENDS_IN_MONTH = new RegExp(`${MONTH_WORD.source}[\\s,]*$`, 'i');

function yearMonth(year: number, month: number): string {
  return `${String(year)}-${String(month).padStart(2, '0')}`;
}

function latestNotAfter(month: number, handoverMonth: string): string {
  const year = Number(handoverMonth.slice(0, 4));
  const sameYear = yearMonth(year, month);
  return isAfter(sameYear, handoverMonth) ? yearMonth(year - 1, month) : sameYear;
}

/** F8-R6. Null when no month can be worked out. */
export function readRentMonth(part: string, handoverDate: string | undefined): string | null {
  const handoverMonth = handoverDate === undefined ? null : monthOf(handoverDate);
  const name = MONTH_WORD.exec(part)?.[1];
  if (name === undefined) {
    return handoverMonth;
  }
  const month = MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;
  const year = /\b(20[0-9]{2})\b/.exec(part)?.[1];
  if (year !== undefined && isYearMonth(yearMonth(Number(year), month))) {
    return yearMonth(Number(year), month);
  }
  return handoverMonth === null ? null : latestNotAfter(month, handoverMonth);
}
