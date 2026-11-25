import { describe, expect, it } from 'vitest';
import { blankRepairDrafts, draftsFromRepair, readRepair } from './repair-form.js';
import type { RepairDrafts } from './repair-form.js';

const FILLED: RepairDrafts = {
  date: '2026-03-10',
  description: '  Damp wall  ',
  reportedTo: 'Landlord, by WhatsApp',
};

function read(change: Partial<RepairDrafts>) {
  return readRepair({ ...FILLED, ...change }, 'r1');
}

describe('repair form reading', () => {
  it('F5-R5 a filled form gives an entry with trimmed text and no link', () => {
    expect(read({})).toEqual({
      repair: {
        id: 'r1',
        date: '2026-03-10',
        description: 'Damp wall',
        reportedTo: 'Landlord, by WhatsApp',
      },
      errors: {},
    });
  });

  it.each(['2026-02-30', '10/03/2026', 'March'])('D-5 date %j is rejected', (date) => {
    const { repair, errors } = read({ date });
    expect(errors.date).toBe('DATE_FORMAT');
    expect(repair).toBeNull();
  });

  it('F5-R5 a date in the future is accepted', () => {
    expect(read({ date: '2099-01-01' }).repair?.date).toBe('2099-01-01');
  });

  it.each(['date', 'description', 'reportedTo'] as const)(
    'F5-R5 an empty %s is required',
    (field) => {
      expect(read({ [field]: '   ' }).errors[field]).toBe('REQUIRED');
      expect(read({ [field]: '   ' }).repair).toBeNull();
    },
  );

  it.each(['description', 'reportedTo'] as const)(
    'F5-R5 %s of 120 characters is accepted and of 121 is not',
    (field) => {
      expect(read({ [field]: 'x'.repeat(120) }).errors[field]).toBeUndefined();
      expect(read({ [field]: 'x'.repeat(121) }).errors[field]).toBe('TEXT_TOO_LONG');
    },
  );

  it('F5-R5 an entry shown for editing reads back to itself', () => {
    const { repair } = read({});
    expect(repair).not.toBeNull();
    expect(
      readRepair(draftsFromRepair({ ...FILLED, id: 'r1', description: 'Damp wall' }), 'r1'),
    ).toEqual({ repair, errors: {} });
    expect(blankRepairDrafts()).toEqual({ date: '', description: '', reportedTo: '' });
  });
});
