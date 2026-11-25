// Dates are handled as text (D-5), so no time zone can move a day. `Date` is not used.
import { accepted, rejected } from './parse-result.js';
import type { ParseResult } from './parse-result.js';

export type DateInputError = 'EMPTY' | 'INVALID_FORMAT';

const YEAR_MONTH = /^([0-9]{4})-([0-9]{2})$/;
const CALENDAR_DATE = /^([0-9]{4}-[0-9]{2})-([0-9]{2})$/;

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** The number of days in a `YYYY-MM` month, or 0 if the text is not a month. */
export function daysInMonth(yearMonth: string): number {
  const parts = YEAR_MONTH.exec(yearMonth);
  if (parts === null) {
    return 0;
  }
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  if (year === 0) {
    return 0; // The calendar has no year 0.
  }
  return month === 2 && isLeapYear(year) ? 29 : (MONTH_LENGTHS[month - 1] ?? 0);
}

/** D-10: a rent month. */
export function isYearMonth(text: string): boolean {
  return daysInMonth(text) > 0;
}

/** D-5. */
export function isCalendarDate(text: string): boolean {
  const [, yearMonth = '', day = ''] = CALENDAR_DATE.exec(text) ?? [];
  return Number(day) >= 1 && Number(day) <= daysInMonth(yearMonth);
}

/** The `YYYY-MM` of a valid date. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** The day of the month of a valid date. */
export function dayOf(date: string): number {
  return Number(date.slice(8));
}

/** For two dates or two months. Their fixed width means text order is calendar order. */
export function isAfter(value: string, other: string): boolean {
  return value > other;
}

function parseWith(
  isValid: (text: string) => boolean,
  input: string,
): ParseResult<string, DateInputError> {
  const text = input.trim();
  if (text === '') {
    return rejected('EMPTY');
  }
  return isValid(text) ? accepted(text) : rejected('INVALID_FORMAT');
}

/** D-5. */
export function parseDate(input: string): ParseResult<string, DateInputError> {
  return parseWith(isCalendarDate, input);
}

/** F1-R2. */
export function parseYearMonth(input: string): ParseResult<string, DateInputError> {
  return parseWith(isYearMonth, input);
}
