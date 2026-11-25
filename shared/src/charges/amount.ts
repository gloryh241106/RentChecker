import { MAX_AMOUNT_PAISE } from '../limits.js';
import { parsePositiveAmount } from '../money.js';
import { ENDS_IN_MONTH } from './months.js';

export interface FoundAmount {
  readonly amountPaise: number;
  /** The text on each side of the amount and its currency sign. */
  readonly before: string;
  readonly after: string;
}

// The number is in the form of D-3.
const NUMBER =
  /((?:₹|\brs\.?|\binr)\s*)?([0-9](?:,?[0-9])*(?:\.[0-9]{1,2})?)(?:\s*(k|thousand|lakhs?|lacs?)\b)?(\s*\/-)?(?![0-9])/gi;

const MIN_BARE_PAISE = 10_000;

/** A letter, a percent sign or a part of a date next to the number. */
function isTouched(before: string, after: string): boolean {
  return (
    /(?:[a-z0-9./]|[0-9]:|[0-9]-[0-9]{1,2}-)$/i.test(before) ||
    /^(?:[a-z%/:]|[-.][0-9])/i.test(after)
  );
}

function isYear(text: string, before: string): boolean {
  return /^20[0-9]{2}$/.test(text) && ENDS_IN_MONTH.test(before);
}

/** F8-R2. `k`, `thousand`, `lakh` and `lac` after the number. */
function multiplierOf(word: string | undefined): number {
  if (word === undefined) {
    return 1;
  }
  return word.toLowerCase().startsWith('l') ? 100_000 : 1_000;
}

function readMatch(match: RegExpExecArray): FoundAmount | null {
  const [whole, currency, text = '', word] = match;
  const before = match.input.slice(0, match.index);
  const after = match.input.slice(match.index + whole.length);
  const parsed = parsePositiveAmount(text);
  if (!parsed.ok) {
    return null;
  }
  const amountPaise = parsed.value * multiplierOf(word);
  if (amountPaise > MAX_AMOUNT_PAISE) {
    return null;
  }
  const found = { amountPaise, before, after };
  if (currency !== undefined) {
    return found;
  }
  const isPlain =
    amountPaise >= MIN_BARE_PAISE && !isTouched(before, after) && !isYear(text, before);
  return isPlain ? found : null;
}

/** F8-R2. Every amount of a text, in order. */
export function findAmounts(text: string): readonly FoundAmount[] {
  return [...text.matchAll(NUMBER)].map(readMatch).filter((each) => each !== null);
}

/** F8-R2. The last amount of a part. */
export function findAmount(part: string): FoundAmount | null {
  return findAmounts(part).at(-1) ?? null;
}
