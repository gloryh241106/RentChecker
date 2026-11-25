import { accepted, rejected } from './parse-result.js';
import type { ParseResult } from './parse-result.js';

export type NumberInputError = 'EMPTY' | 'INVALID_FORMAT' | 'ABOVE_LIMIT';

// D-3: a comma counts only between two digits, and decimals need a digit before them.
const DECIMAL_NUMBER = /^[0-9](?:,?[0-9])*(?:\.[0-9]{1,2})?$/;

/** D-3 and D-22 share this grammar: digits, commas between digits, up to 2 decimals. */
export function parseHundredths(
  text: string,
  max: number,
): ParseResult<number, Exclude<NumberInputError, 'EMPTY'>> {
  if (!DECIMAL_NUMBER.test(text)) {
    return rejected('INVALID_FORMAT');
  }
  const [whole = '', decimals = ''] = text.replaceAll(',', '').split('.');
  // Joining the digits avoids a fractional number. A value too long to be exact is above any limit.
  const hundredths = Number(whole + decimals.padEnd(2, '0'));
  return hundredths > max ? rejected('ABOVE_LIMIT') : accepted(hundredths);
}
