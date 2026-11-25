import { parseHundredths } from './hundredths.js';
import type { NumberInputError } from './hundredths.js';
import { MAX_AMOUNT_PAISE, MAX_RATE_PAISE_PER_UNIT } from './limits.js';
import { rejected } from './parse-result.js';
import type { ParseResult } from './parse-result.js';

export type PositiveAmountError = NumberInputError | 'ZERO';

function parseRupees(input: string, maxPaise: number): ParseResult<number, NumberInputError> {
  const text = input.trim(); // F1-R1
  if (text === '') {
    return rejected('EMPTY');
  }
  return parseHundredths(text.startsWith('₹') ? text.slice(1) : text, maxPaise);
}

/** D-3, D-4. For amounts that may be 0, such as the stated refund or a fixed charge. */
export function parseAmount(input: string): ParseResult<number, NumberInputError> {
  return parseRupees(input, MAX_AMOUNT_PAISE);
}

/** D-3, D-4, F1-R3. For the deposit, the rent, a deduction and a bill total. */
export function parsePositiveAmount(input: string): ParseResult<number, PositiveAmountError> {
  const parsed = parseAmount(input);
  return parsed.ok && parsed.value === 0 ? rejected('ZERO') : parsed;
}

/** D-22. Rupees per unit, written as in D-3. */
export function parseRate(input: string): ParseResult<number, NumberInputError> {
  return parseRupees(input, MAX_RATE_PAISE_PER_UNIT);
}

/** F1-R1. Indian grouping, with decimals only when the paise are not 0. */
export function formatRupees(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const absolute = Math.abs(paise);
  const remainder = absolute % 100;
  const rupees = String((absolute - remainder) / 100);
  const grouped = rupees.replace(/([0-9])(?=(?:[0-9]{2})+[0-9]$)/g, '$1,');
  const decimals = remainder === 0 ? '' : `.${String(remainder).padStart(2, '0')}`;
  return `${sign}₹${grouped}${decimals}`;
}
