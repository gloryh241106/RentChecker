const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** A valid `YYYY-MM-DD` date as `10 March 2026`. Other text is returned unchanged. */
export function formatDateText(date: string): string {
  const month = MONTH_NAMES[Number(date.slice(5, 7)) - 1];
  return month === undefined ? date : `${Number(date.slice(8))} ${month} ${date.slice(0, 4)}`;
}

/** A valid `YYYY-MM` month as `June 2026`. Other text is returned unchanged. */
export function formatMonthText(yearMonth: string): string {
  const month = MONTH_NAMES[Number(yearMonth.slice(5, 7)) - 1];
  return month === undefined ? yearMonth : `${month} ${yearMonth.slice(0, 4)}`;
}

/** `a`, `a and b`, `a, b and c`. */
export function joinWithAnd(items: readonly string[]): string {
  const last = items.at(-1);
  if (items.length < 2 || last === undefined) {
    return items.join('');
  }
  return `${items.slice(0, -1).join(', ')} and ${last}`;
}
