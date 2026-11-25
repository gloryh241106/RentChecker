import { parsePositiveAmount } from '../money.js';
import { ENDS_IN_MONTH } from './months.js';

export interface FoundAmount {
  readonly amountPaise: number;
  /** The text on each side of the amount and its currency sign. */
  readonly before: string;
  readonly after: string;
}

// The number is in the form of D-3.
const NUMBER = /((?:₹|\brs\.?|\binr)\s*)?([0-9](?:,?[0-9])*(?:\.[0-9]{1,2})?)(\s*\/-)?(?![0-9])/gi;

const MIN_BARE_PAISE = 10_000;

/** A letter, a percent sign or a part of a date next to the number. */
function isTouched(before: string, after: string): boolean {
  return /(?:[a-z0-9./]|[0-9]:)$/i.test(before) || /^(?:[a-z%/:]|[-.][0-9])/i.test(after);
}

function isYear(text: string, before: string): boolean {
  return /^20[0-9]{2}$/.test(text) && ENDS_IN_MONTH.test(before);
}

function readMatch(match: RegExpExecArray): FoundAmount | null {
  const [whole, currency, text = ''] = match;
  const before = match.input.slice(0, match.index);
  const after = match.input.slice(match.index + whole.length);
  const parsed = parsePositiveAmount(text);
  if (!parsed.ok) {
    return null;
  }
  const found = { amountPaise: parsed.value, before, after };
  if (currency !== undefined) {
    return found;
  }
  const isPlain =
    parsed.value >= MIN_BARE_PAISE && !isTouched(before, after) && !isYear(text, before);
  return isPlain ? found : null;
}

/** F8-R2. The last amount of a part. */
export function findAmount(part: string): FoundAmount | null {
  const found = [...part.matchAll(NUMBER)].map(readMatch).filter((each) => each !== null);
  return found.at(-1) ?? null;
}
