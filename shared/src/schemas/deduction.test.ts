import { describe, expect, it } from 'vitest';
import { deductionSchema } from './deduction.js';

const COMMON = { id: 'd1', label: 'June charge', amountPaise: 1_500_000 };
const RENT = { ...COMMON, kind: 'rent', rentMonth: '2026-06' };

function issuePaths(value: unknown): PropertyKey[][] {
  return deductionSchema.safeParse(value).error?.issues.map(({ path }) => path) ?? [];
}

describe('deduction schema', () => {
  it.each([
    ['rent', { rentMonth: '2026-06' }, { rentMonth: '2026-06', alreadyPaidPaise: 0 }],
    ['metered', {}, { fixedChargePaise: 0 }],
    ['fixed_fee', {}, {}],
    ['cost', {}, {}],
  ])('D-10 kind %s is accepted with its defaults (T-019)', (kind, facts, stored) => {
    const parsed = deductionSchema.parse({ ...COMMON, kind, ...facts });
    expect(parsed).toEqual({ ...COMMON, kind, ...stored });
  });

  it.each([
    ['kind deposit', { ...COMMON, kind: 'deposit' }, 'kind'],
    ['rent with no month', { ...COMMON, kind: 'rent' }, 'rentMonth'],
    ['rent month 2026-13', { ...RENT, rentMonth: '2026-13' }, 'rentMonth'],
  ])('D-10 %s is rejected (T-019)', (_name, value, field) => {
    expect(issuePaths(value)).toEqual([[field]]);
  });

  it.each([
    ['zero amount (T-013)', { amountPaise: 0 }, 'amountPaise'],
    ['amount above the limit (T-012)', { amountPaise: 1_000_000_001 }, 'amountPaise'],
    ['fraction of a paisa', { amountPaise: 0.5 }, 'amountPaise'],
    ['negative already paid', { alreadyPaidPaise: -1 }, 'alreadyPaidPaise'],
    ['label of spaces', { label: '   ' }, 'label'],
    ['label of 121 characters', { label: 'x'.repeat(121) }, 'label'],
    ['empty id', { id: '' }, 'id'],
    ['id of 41 characters', { id: 'x'.repeat(41) }, 'id'],
    ['id with a space', { id: 'a b' }, 'id'],
  ])('D-4 %s is rejected', (_name, change, field) => {
    expect(issuePaths({ ...RENT, ...change })).toEqual([[field]]);
  });

  it('D-10 a fact of another kind is rejected', () => {
    expect(deductionSchema.safeParse({ ...RENT, receiptAmountPaise: 1 }).success).toBe(false);
  });

  it('D-4 0.01 rupee is stored as 1 paisa (T-013)', () => {
    expect(deductionSchema.parse({ ...RENT, amountPaise: 1 }).amountPaise).toBe(1);
  });
});
