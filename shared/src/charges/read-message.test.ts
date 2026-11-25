import { describe, expect, it } from 'vitest';
import { MAX_AMOUNT_PAISE } from '../limits.js';
import { deductionSchema } from '../schemas/deduction.js';
import { MAX_MESSAGE_LENGTH, readMessage, toDeduction } from './read-message.js';

const HANDOVER = '2026-06-15';

/** Each charge as one line of text. */
function linesOf(message: string, handover: string | undefined = HANDOVER): string[] {
  return readMessage(message, handover).charges.map(({ label, amountPaise, kind, rentMonth }) =>
    [label, String(amountPaise / 100), kind, rentMonth].filter((each) => each !== null).join(' | '),
  );
}

describe('reading charges out of a message (F8)', () => {
  it('F8-AC1 reads one charge on each line (T-230)', () => {
    expect(linesOf('Repainting: Rs 12,000\nJune rent - 15000/-\nService fee ₹3,000')).toEqual([
      'Repainting | 12000 | cost',
      'June rent | 15000 | rent | 2026-06',
      'Service fee | 3000 | fixed_fee',
    ]);
  });

  it('F8-AC2 reads charges out of one sentence (T-230)', () => {
    const message =
      'I have deducted 12000 for painting, 2,500 for cleaning and 800 towards electricity';
    expect(linesOf(message)).toEqual([
      'Painting | 12000 | cost',
      'Cleaning | 2500 | cost',
      'Electricity | 800 | metered',
    ]);
  });

  it('F8-AC3 leaves out sums and payments, and counts them (T-231)', () => {
    const found = readMessage(
      'Cleaning 2000\nTotal deducted 30,000\nRefund: Rs 5,000\nRent paid 15000\nInternet 600',
      HANDOVER,
    );
    expect(found.charges.map(({ label }) => label)).toEqual(['Cleaning', 'Internet']);
    expect(found.leftOut).toBe(3);
  });

  it('F8-R1 splits at | and after a sum that introduces the list (T-230)', () => {
    expect(linesOf('Painting: ₹ 8,000 | Cleaning: ₹ 2,000')).toEqual([
      'Painting | 8000 | cost',
      'Cleaning | 2000 | cost',
    ]);
    const found = readMessage('From your deposit of 50,000: 10,000 for painting', HANDOVER);
    expect(found.charges.map(({ label }) => label)).toEqual(['Painting']);
    expect(found.leftOut).toBe(1);
  });

  it('F8-AC5 finds nothing in text without an amount (T-231)', () => {
    expect(readMessage('Thanks and see you soon.', HANDOVER)).toEqual({ charges: [], leftOut: 0 });
    expect(readMessage('', HANDOVER).charges).toEqual([]);
  });

  it.each([
    ['Water and electricity 1,200', 'Water and electricity | 1200 | metered'],
    ['1. Wall repair: Rs. 4,500.50', 'Wall repair | 4500.5 | cost'],
    ['- Broken tile & grout = ₹950', 'Broken tile & grout | 950 | cost'],
    ['Electricity 120 units 960', 'Electricity 120 units | 960 | metered'],
    ['Deducted from your deposit: painting 12000', 'Painting | 12000 | cost'],
    ['INR 700 for key', 'Key | 700 | cost'],
    ['₹50 bulb', 'Bulb | 50 | cost'],
    ['Rs. 500', 'Charge | 500 | cost'],
    ['Cleaning:2000', 'Cleaning | 2000 | cost'],
    ['Painting 2000', 'Painting | 2000 | cost'],
    ['Cleaning charges of Rs 1500 only', 'Cleaning charges | 1500 | cost'],
  ])('F8-R1 to F8-R5 reads %j (T-230)', (message, line) => {
    expect(linesOf(message)).toEqual([line]);
  });

  it.each([
    'Flat 99',
    'At 10:300',
    'Call 5pm',
    'Room 101B',
    'GST 180%',
    'On 15/06/2026',
    'In June 2026',
  ])('F8-R2 takes no amount from %j (T-231)', (message) => {
    expect(linesOf(message)).toEqual([]);
  });

  it('F8-R2 ignores an amount of 0 or above the limit (T-231)', () => {
    expect(linesOf('Cleaning Rs 0')).toEqual([]);
    expect(linesOf(`Cleaning Rs ${String(MAX_AMOUNT_PAISE / 100 + 1)}`)).toEqual([]);
  });

  it.each([
    ['Rent 15000', HANDOVER, '2026-06'],
    ['August rent 15000', HANDOVER, '2025-08'],
    ['Rent for May 15000', HANDOVER, '2026-05'],
    ['Rent Jan 2025 15000', undefined, '2025-01'],
    ['June rent 15000', undefined, null],
    ['Rent 15000', undefined, null],
  ])('F8-R6 %j with handover %s is rent for %s (T-232)', (message, handover, month) => {
    expect(readMessage(message, handover).charges[0]).toMatchObject({
      kind: 'rent',
      rentMonth: month,
    });
  });

  it('F8-R3 cuts a long label, and text after the limit is not read (T-231)', () => {
    expect(readMessage(`${'a'.repeat(200)} Rs 500`, HANDOVER).charges[0]?.label).toHaveLength(120);
    expect(linesOf(`${' '.repeat(MAX_MESSAGE_LENGTH)}Cleaning 2000`)).toEqual([]);
  });

  it('F8-R7 every charge becomes a valid deduction, except rent with no month (T-232)', () => {
    const message = 'Rent 15000\nWater 900\nLate fee 500\nPainting 8000';
    for (const charge of readMessage(message, HANDOVER).charges) {
      expect(deductionSchema.safeParse(toDeduction(charge, 'd1')).success).toBe(true);
    }
    const [rent] = readMessage('Rent 15000', undefined).charges;
    expect(rent && toDeduction(rent, 'd1')).toBeNull();
  });
});
