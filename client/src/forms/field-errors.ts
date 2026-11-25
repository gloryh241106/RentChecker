/** Every way a field can be wrong. The wording is in one table, UI.md "Fixed wording". */
export type FieldErrorCode =
  | 'REQUIRED'
  | 'AMOUNT_FORMAT'
  | 'AMOUNT_ABOVE_LIMIT'
  | 'AMOUNT_ZERO'
  | 'DATE_FORMAT'
  | 'MONTH_FORMAT'
  | 'START_AFTER_HANDOVER'
  | 'READING_FORMAT'
  | 'CURRENT_BELOW_PREVIOUS'
  | 'RATE_FORMAT'
  | 'TEXT_TOO_LONG'
  | 'NO_DEDUCTIONS'
  | 'QUOTE_NOT_FOUND';

/** The noun fills "Enter the {field}." */
const FIELD_ERROR_TEXT: Readonly<Record<FieldErrorCode, (noun: string) => string>> = {
  REQUIRED: (noun) => `Enter the ${noun}.`,
  AMOUNT_FORMAT: () =>
    'Enter an amount in rupees, like 15,000 or 15,000.50. Use at most 2 decimals.',
  AMOUNT_ABOVE_LIMIT: () => 'Enter an amount up to ₹1,00,00,000.',
  AMOUNT_ZERO: () => 'Enter an amount above 0.',
  DATE_FORMAT: () => 'Write the date as YYYY-MM-DD, for example 2026-06-15.',
  MONTH_FORMAT: () => 'Write the month as YYYY-MM, for example 2026-06.',
  START_AFTER_HANDOVER: () => 'The start date must be on or before the handover date.',
  READING_FORMAT: () =>
    'Enter a reading like 120 or 120.50. Use at most 2 decimals and no more than 1,00,00,000.',
  CURRENT_BELOW_PREVIOUS: () => 'The current reading must not be lower than the previous one.',
  RATE_FORMAT: () => 'Enter a rate in rupees per unit, like 8 or 8.50, up to ₹1,000.',
  TEXT_TOO_LONG: () => 'Use at most 120 characters.',
  NO_DEDUCTIONS: () => 'Add at least one deduction.',
  QUOTE_NOT_FOUND: () => 'That text was not found in the lease. Paste it exactly as written.',
};

export function fieldErrorText(code: FieldErrorCode, noun: string): string {
  return FIELD_ERROR_TEXT[code](noun);
}
