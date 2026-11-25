import { describe, expect, it } from 'vitest';
import { daysInMonth, isAfter, parseDate, parseYearMonth } from './dates.js';
import { isCheckableTenancy, tenancySchema } from './schemas/tenancy.js';

describe('dates', () => {
  it('D-5 leap day (T-015)', () => {
    expect(parseDate('2028-02-29')).toEqual({ ok: true, value: '2028-02-29' });
  });

  it.each([
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '15/06/2026',
    '2026-6-5',
    '2026-06-15T10:00',
    '2026-00-10',
    '2026-06-00',
    '2026-06-31',
    '0000-01-01',
    '+2026-06-15',
    '2026-06-15\n2026',
  ])('D-5 %j is not a calendar date (T-016)', (input) => {
    expect(parseDate(input)).toEqual({ ok: false, error: 'INVALID_FORMAT' });
    expect(tenancySchema.safeParse({ handoverDate: input }).success).toBe(false);
  });

  it('D-5 start after handover is rejected on the start date (T-017)', () => {
    const parsed = tenancySchema.safeParse({ startDate: '2026-06-20', handoverDate: '2026-06-15' });
    expect(parsed.error?.issues).toMatchObject([
      { path: ['startDate'], message: 'START_AFTER_HANDOVER' },
    ]);
  });

  it.each([
    ['equal to handover', { startDate: '2026-06-15' }],
    ['empty', {}],
  ])('D-5 start %s is accepted (T-017)', (_name, start) => {
    expect(tenancySchema.safeParse({ ...start, handoverDate: '2026-06-15' }).success).toBe(true);
  });

  it('D-5 an empty handover date is required for a check (T-018)', () => {
    expect(parseDate('')).toEqual({ ok: false, error: 'EMPTY' });
    const facts = { depositPaise: 3_000_000, monthlyRentPaise: 1_500_000 };
    expect(isCheckableTenancy(tenancySchema.parse(facts))).toBe(false);
    const complete = tenancySchema.parse({ ...facts, handoverDate: '2026-06-15' });
    expect(isCheckableTenancy(complete)).toBe(true);
  });

  it.each([
    ['2026-01', 31],
    ['2026-02', 28],
    ['2028-02', 29],
    ['2000-02', 29],
    ['2100-02', 28],
    ['2026-04', 30],
    ['2026-12', 31],
  ])('D-5 %s has %i days', (month, days) => {
    expect(daysInMonth(month)).toBe(days);
  });

  it('D-5 compares across months and years', () => {
    expect(isAfter('2026-10-01', '2026-09-30')).toBe(true);
    expect(isAfter('2026-12-31', '2027-01-01')).toBe(false);
    expect(isAfter('2026-06-15', '2026-06-15')).toBe(false);
  });

  it.each([
    ['2026-06', { ok: true, value: '2026-06' }],
    ['', { ok: false, error: 'EMPTY' }],
    ['2026-13', { ok: false, error: 'INVALID_FORMAT' }],
    ['2026-6', { ok: false, error: 'INVALID_FORMAT' }],
    ['2026-06-01', { ok: false, error: 'INVALID_FORMAT' }],
  ])('D-10 rent month %j', (input, expected) => {
    expect(parseYearMonth(input)).toEqual(expected);
  });
});
