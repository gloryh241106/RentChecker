import { MONTH_WORD, monthNumber } from '../charges/months.js';
import { isCalendarDate } from '../dates.js';

export interface FoundDate {
  readonly date: string;
  /** Digits that could be read as month first, such as 06/07/2026 (F9-R11). */
  readonly isDayFirst: boolean;
  /** The words of the date. */
  readonly words: string;
  readonly index: number;
}

const MONTH = MONTH_WORD.source.replaceAll('\\b', '');
const DAY = '([0-9]{1,2})(?:st|nd|rd|th)?';

type Reader = (parts: readonly string[]) => Omit<FoundDate, 'words' | 'index'>;

function toDate(year: string, month: number, day: string): string {
  return `${year}-${String(month).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const digitsDayFirst: Reader = ([day = '', , month = '', year = '']) => ({
  date: toDate(year, Number(month), day),
  isDayFirst: Number(day) <= 12 && Number(day) !== Number(month),
});

/** F9-R5. */
const FORMS: readonly (readonly [RegExp, Reader])[] = [
  [/\b([0-9]{4}-[0-9]{2}-[0-9]{2})\b/g, ([date = '']) => ({ date, isDayFirst: false })],
  [/\b([0-9]{1,2})([/.-])([0-9]{1,2})\2([0-9]{4})\b/g, digitsDayFirst],
  [
    new RegExp(`\\b${DAY}\\s+(?:of\\s+)?${MONTH}[\\s,]+([0-9]{4})\\b`, 'gi'),
    ([day = '', name = '', year = '']) => ({
      date: toDate(year, monthNumber(name), day),
      isDayFirst: false,
    }),
  ],
  [
    new RegExp(`\\b${MONTH}\\s+${DAY}[\\s,]+([0-9]{4})\\b`, 'gi'),
    ([name = '', day = '', year = '']) => ({
      date: toDate(year, monthNumber(name), day),
      isDayFirst: false,
    }),
  ],
];

/** F9-R5. The dates of a text that exist in the calendar, in order. */
export function readDates(text: string): readonly FoundDate[] {
  return FORMS.flatMap(([form, read]) =>
    [...text.matchAll(form)].map((match) => ({
      ...read(match.slice(1)),
      words: match[0],
      index: match.index,
    })),
  )
    .filter(({ date }) => isCalendarDate(date))
    .sort((one, other) => one.index - other.index);
}
