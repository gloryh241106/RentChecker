import { describe, expect, it } from 'vitest';
import { EMPTY_WORKSPACE } from '../state/empty-workspace.js';
import { fieldErrorText } from './field-errors.js';
import { draftsFromTenancy, readTenancy } from './tenancy-form.js';
import type { TenancyDrafts } from './tenancy-form.js';

const BLANK = draftsFromTenancy(EMPTY_WORKSPACE.tenancy);

function read(change: Partial<TenancyDrafts>) {
  return readTenancy({ ...BLANK, deposit: '30,000', monthlyRent: '15,000', ...change });
}

describe('tenancy form reading', () => {
  it.each([
    ['-5', 'AMOUNT_FORMAT'],
    ['abc', 'AMOUNT_FORMAT'],
    ['1.234', 'AMOUNT_FORMAT'],
    ['0', 'AMOUNT_ZERO'],
    ['1,00,00,001', 'AMOUNT_ABOVE_LIMIT'],
    ['', 'REQUIRED'],
  ] as const)(
    'D-3 deposit %j is rejected with %s (T-007, T-008, T-009, T-010, F1-AC6)',
    (text, code) => {
      const { tenancy, errors } = read({ deposit: text });
      expect(errors.deposit).toBe(code);
      expect(tenancy.depositPaise).toBeUndefined();
    },
  );

  it('D-3 an amount with Indian grouping is accepted and stored as paise (F1-AC6, T-014)', () => {
    expect(read({ deposit: '1,30,000' }).tenancy.depositPaise).toBe(13_000_000);
    expect(read({ deposit: '₹15,000.50' }).tenancy.depositPaise).toBe(1_500_050);
  });

  it('D-3 an empty stated refund is not given, and 0 is accepted (T-010)', () => {
    expect(read({ statedRefund: '' }).tenancy.statedRefundPaise).toBeUndefined();
    expect(read({ statedRefund: '' }).errors.statedRefund).toBeUndefined();
    expect(read({ statedRefund: '0' }).tenancy.statedRefundPaise).toBe(0);
  });

  it.each(['2026-02-29', '2026-02-30', '2026-13-01', '15/06/2026', '2026-6-5', '2026-06-15T10:00'])(
    'D-5 handover %j is rejected (T-016)',
    (text) => {
      expect(read({ handoverDate: text }).errors.handoverDate).toBe('DATE_FORMAT');
      expect(fieldErrorText('DATE_FORMAT', 'handover date')).toContain('YYYY-MM-DD');
    },
  );

  it('D-5 an empty handover date is required (T-018)', () => {
    expect(read({ handoverDate: '' }).errors.handoverDate).toBe('REQUIRED');
  });

  it('D-5 a start date after the handover is rejected on the start date, equal or empty pass (T-017, F1-AC7)', () => {
    const late = read({ startDate: '2026-06-20', handoverDate: '2026-06-15' });
    expect(late.errors.startDate).toBe('START_AFTER_HANDOVER');
    expect(late.tenancy.startDate).toBeUndefined();
    expect(late.tenancy.handoverDate).toBe('2026-06-15');
    expect(
      read({ startDate: '2026-06-15', handoverDate: '2026-06-15' }).errors.startDate,
    ).toBeUndefined();
    expect(read({ startDate: '', handoverDate: '2026-06-15' }).errors.startDate).toBeUndefined();
  });

  it('D-5 either date can be edited out of a conflict, with no trap (F1-R8)', () => {
    const conflict = { startDate: '2026-06-20', handoverDate: '2026-06-15' };
    expect(read({ ...conflict, handoverDate: '2026-06-25' }).tenancy.startDate).toBe('2026-06-20');
    expect(read({ ...conflict, startDate: '2026-06-01' }).tenancy.startDate).toBe('2026-06-01');
  });

  it('F1-R1 a stored tenancy is shown back as editable text that parses to the same value', () => {
    const { tenancy } = read({ deposit: '1,30,000', handoverDate: '2026-06-15' });
    expect(readTenancy(draftsFromTenancy(tenancy)).tenancy).toEqual(tenancy);
  });
});
