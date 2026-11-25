import {
  MAX_SHORT_TEXT_LENGTH,
  parseAmount,
  parseDate,
  parsePositiveAmount,
  parseRate,
  parseReading,
  parseYearMonth,
} from '../shared.js';
import type { NumberInputError, ParseResult, PositiveAmountError } from '../shared.js';
import type { DateInputError } from '../shared.js';
import type { FieldErrorCode } from './field-errors.js';

/** What typed text means: a value, nothing at all, or a mistake. */
export type FieldValue<Value> =
  | { readonly status: 'value'; readonly value: Value }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly code: FieldErrorCode };

const EMPTY = { status: 'empty' } as const;

/** `null` marks the parse error that means "left empty". */
type Codes<Code extends string> = Readonly<Record<Code, FieldErrorCode | null>>;

function fromParse<Value, Code extends string>(
  result: ParseResult<Value, Code>,
  codes: Codes<Code>,
): FieldValue<Value> {
  if (result.ok) {
    return { status: 'value', value: result.value };
  }
  const code = codes[result.error];
  return code === null ? EMPTY : { status: 'error', code };
}

const AMOUNT_CODES: Codes<NumberInputError> = {
  EMPTY: null,
  INVALID_FORMAT: 'AMOUNT_FORMAT',
  ABOVE_LIMIT: 'AMOUNT_ABOVE_LIMIT',
};

/** D-3, D-4. Above 0, for the deposit, rent and each deduction. */
export function readPositiveAmount(text: string): FieldValue<number> {
  const codes: Codes<PositiveAmountError> = { ...AMOUNT_CODES, ZERO: 'AMOUNT_ZERO' };
  return fromParse(parsePositiveAmount(text), codes);
}

/** D-3. 0 is allowed, for the stated refund and for facts that default to 0. */
export function readAmount(text: string): FieldValue<number> {
  return fromParse(parseAmount(text), AMOUNT_CODES);
}

/** D-22. */
export function readRate(text: string): FieldValue<number> {
  const codes: Codes<NumberInputError> = {
    EMPTY: null,
    INVALID_FORMAT: 'RATE_FORMAT',
    ABOVE_LIMIT: 'RATE_FORMAT',
  };
  return fromParse(parseRate(text), codes);
}

/** D-22. */
export function readReading(text: string): FieldValue<number> {
  const codes: Codes<NumberInputError> = {
    EMPTY: null,
    INVALID_FORMAT: 'READING_FORMAT',
    ABOVE_LIMIT: 'READING_FORMAT',
  };
  return fromParse(parseReading(text), codes);
}

/** D-5. */
export function readDate(text: string): FieldValue<string> {
  const codes: Codes<DateInputError> = { EMPTY: null, INVALID_FORMAT: 'DATE_FORMAT' };
  return fromParse(parseDate(text), codes);
}

/** F1-R2. */
export function readMonth(text: string): FieldValue<string> {
  const codes: Codes<DateInputError> = { EMPTY: null, INVALID_FORMAT: 'MONTH_FORMAT' };
  return fromParse(parseYearMonth(text), codes);
}

/** A label: 1 to 120 characters after trimming (F1-R5). */
export function readLabel(text: string): FieldValue<string> {
  const trimmed = text.trim();
  if (trimmed === '') {
    return EMPTY;
  }
  return trimmed.length > MAX_SHORT_TEXT_LENGTH
    ? { status: 'error', code: 'TEXT_TOO_LONG' }
    : { status: 'value', value: trimmed };
}

/** A field that must be filled: left empty is a mistake. */
export function required<Value>(field: FieldValue<Value>): FieldValue<Value> {
  return field.status === 'empty' ? { status: 'error', code: 'REQUIRED' } : field;
}

export function valueOf<Value>(field: FieldValue<Value>): Value | undefined {
  return field.status === 'value' ? field.value : undefined;
}

export function errorOf(field: FieldValue<unknown>): FieldErrorCode | undefined {
  return field.status === 'error' ? field.code : undefined;
}
