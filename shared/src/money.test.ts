import { describe, expect, it } from 'vitest';
import { formatRupees, parseAmount, parsePositiveAmount } from './money.js';
import { divideRoundHalfUp } from './rounding.js';
import { tenancySchema } from './schemas/tenancy.js';

const accepted = (value: number) => ({ ok: true, value });
const rejected = (error: string) => ({ ok: false, error });

describe('rupee input', () => {
  it.each([
    ['D-3 plain digits (T-001)', '15000', 1_500_000, '₹15,000'],
    ['D-3 Western commas (T-002)', '15,000', 1_500_000, '₹15,000'],
    ['D-3 Indian commas (T-003)', '1,30,000', 13_000_000, '₹1,30,000'],
    ['D-3 rupee sign and 2 decimals (T-004)', '₹15,000.50', 1_500_050, '₹15,000.50'],
    ['D-3 one decimal (T-005)', '15000.5', 1_500_050, '₹15,000.50'],
    ['D-3 spaces around (T-006)', ' 15000 ', 1_500_000, '₹15,000'],
    ['D-4 the limit (T-011)', '1,00,00,000', 1_000_000_000, '₹1,00,00,000'],
    ['D-4 one paisa for a deduction (T-013)', '0.01', 1, '₹0.01'],
  ])('%s', (_title, input, paise, shown) => {
    expect(parsePositiveAmount(input)).toEqual(accepted(paise));
    expect(formatRupees(paise)).toBe(shown);
  });

  it.each([
    ['D-3 negative (T-007)', '-5', 'INVALID_FORMAT'],
    ['D-3 letters (T-008)', 'abc', 'INVALID_FORMAT'],
    ['D-3 three decimals (T-009)', '1.234', 'INVALID_FORMAT'],
    ['D-3 empty deposit (T-010)', '', 'EMPTY'],
    ['D-3 spaces only', '   ', 'EMPTY'],
    ['D-3 rupee sign only', '₹', 'INVALID_FORMAT'],
    ['D-3 comma not between digits', ',500', 'INVALID_FORMAT'],
    ['D-3 comma before the point', '500,.50', 'INVALID_FORMAT'],
    ['D-3 two commas together', '1,,000', 'INVALID_FORMAT'],
    ['D-3 point without decimals', '500.', 'INVALID_FORMAT'],
    ['D-3 point without digits before it', '.50', 'INVALID_FORMAT'],
    ['D-3 exponent', '1e5', 'INVALID_FORMAT'],
    ['D-3 digits of another script', '१५०००', 'INVALID_FORMAT'],
    ['D-4 1 paisa above the limit (T-012)', '1,00,00,000.01', 'ABOVE_LIMIT'],
    ['D-4 1 rupee above the limit (T-012)', '1,00,00,001', 'ABOVE_LIMIT'],
    ['D-4 more digits than a safe integer', '9'.repeat(400), 'ABOVE_LIMIT'],
    ['D-4 zero deduction, deposit or rent (T-013)', '0', 'ZERO'],
  ])('%s', (_title, input, error) => {
    expect(parsePositiveAmount(input)).toEqual(rejected(error));
  });

  it('D-3 an empty stated refund is told apart and may be left out (T-010)', () => {
    expect(parseAmount('')).toEqual(rejected('EMPTY'));
    expect(tenancySchema.parse({}).statedRefundPaise).toBeUndefined();
  });

  it('D-4 a stated refund of 0 is accepted (T-013)', () => {
    expect(parseAmount('0')).toEqual(accepted(0));
    expect(tenancySchema.parse({ statedRefundPaise: 0 }).statedRefundPaise).toBe(0);
  });

  it.each(['depositPaise', 'monthlyRentPaise'])('D-4 stored %s of 0 is rejected (T-013)', (key) => {
    expect(tenancySchema.safeParse({ [key]: 0 }).success).toBe(false);
  });
});

describe('rupee display', () => {
  it.each([
    [0, '₹0'],
    [5, '₹0.05'],
    [99_900, '₹999'],
    [100_000, '₹1,000'],
    [10_000_000, '₹1,00,000'],
    [1_000_000_000_000, '₹10,00,00,00,000'],
    [-200_000, '-₹2,000'],
  ])('D-3 %i paise is shown as %s', (paise, shown) => {
    expect(formatRupees(paise)).toBe(shown);
  });
});

describe('rounding', () => {
  it.each([
    [0, 30, 0],
    [1, 2, 1],
    [49, 100, 0],
    [50, 100, 1],
    [44, 30, 1],
    [45, 30, 2],
    [100_000_000_000_000, 100, 1_000_000_000_000],
  ])('D-2 %i divided by %i is %i', (numerator, denominator, quotient) => {
    expect(divideRoundHalfUp(numerator, denominator)).toBe(quotient);
  });

  it('D-2 refuses a number that is no longer exact', () => {
    expect(() => divideRoundHalfUp(Number.MAX_SAFE_INTEGER + 1, 100)).toThrow(RangeError);
  });
});
