import { describe, expect, it } from 'vitest';
import { parseRate } from './money.js';
import { parseReading } from './readings.js';
import { billCheckSchema } from './schemas/bill-check.js';
import { deductionSchema } from './schemas/deduction.js';

const accepted = (value: number) => ({ ok: true, value });
const rejected = (error: string) => ({ ok: false, error });

const METERED = { id: 'd1', kind: 'metered', label: 'Electricity', amountPaise: 50_000 };

describe('meter readings', () => {
  it.each([
    ['metered deduction', deductionSchema, METERED],
    ['bill check', billCheckSchema, {}],
  ])('D-22 current reading not below previous, %s (T-020)', (_name, schema, facts) => {
    expect(parseReading('120.50')).toEqual(accepted(12_050));
    expect(parseReading('110')).toEqual(accepted(11_000));
    const below = { ...facts, previousReading: 12_050, currentReading: 11_000 };
    expect(schema.safeParse(below).error?.issues).toMatchObject([
      { path: ['currentReading'], message: 'CURRENT_BELOW_PREVIOUS' },
    ]);
    const equal = { ...facts, previousReading: 12_050, currentReading: 12_050 };
    expect(schema.safeParse(equal).success).toBe(true);
  });

  it.each([
    ['D-22 three decimals (T-021)', '100.001', rejected('INVALID_FORMAT')],
    ['D-22 one decimal (T-021)', '100.5', accepted(10_050)],
    ['D-22 the limit (T-022)', '10,000,000', accepted(1_000_000_000)],
    ['D-22 above the limit (T-022)', '10,000,000.01', rejected('ABOVE_LIMIT')],
    ['D-22 zero', ' 0 ', accepted(0)],
    ['D-22 empty', '', rejected('EMPTY')],
    ['D-22 negative', '-1', rejected('INVALID_FORMAT')],
    ['D-22 rupee sign', '₹100', rejected('INVALID_FORMAT')],
  ])('%s', (_title, input, expected) => {
    expect(parseReading(input)).toEqual(expected);
  });

  it.each([
    ['D-22 rate at the limit (T-022)', '₹1,000', accepted(100_000)],
    ['D-22 rate above the limit (T-022)', '₹1,000.01', rejected('ABOVE_LIMIT')],
  ])('%s', (_title, input, expected) => {
    expect(parseRate(input)).toEqual(expected);
  });

  it.each([
    ['previousReading', 1_000_000_000],
    ['ratePaisePerUnit', 100_000],
  ])('D-22 stored %s is at most %i (T-022)', (key, max) => {
    expect(deductionSchema.safeParse({ ...METERED, [key]: max }).success).toBe(true);
    expect(deductionSchema.safeParse({ ...METERED, [key]: max + 1 }).success).toBe(false);
    expect(deductionSchema.safeParse({ ...METERED, [key]: -1 }).success).toBe(false);
  });
});
