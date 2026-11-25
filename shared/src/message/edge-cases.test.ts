import { describe, expect, it } from 'vitest';
import { cost } from '../../test-support/cases.js';
import { messageFor } from './message-case.js';

const BASE = { label: 'Repainting', evidence: 'verified' } as const;
const PAID = { ...BASE, receiptAmountPaise: 1_000_000 };

/** The blocks of a message: everything between the opening and the closing paragraph. */
function blocks(text: string | null): string[] {
  return (text ?? '').split('\n\n').slice(2, -2);
}

describe('F3 edge cases', () => {
  it('F3 edge: a duplicate has no expected amount and says it repeats a charge', () => {
    const text = messageFor({}, [cost(1_000_000, PAID), cost(1_000_000, PAID)]);
    expect(blocks(text)).toEqual([
      '1. Repainting: ₹10,000\nThis repeats an earlier charge.\nCould you please check this amount?',
    ]);
  });

  it('F3 edge: two blocks with the same label stay separate and keep input order', () => {
    const text = messageFor({}, [
      cost(1_000_000, { ...BASE, receiptAmountPaise: 500_000 }),
      cost(2_000_000, { ...BASE, receiptAmountPaise: 500_000 }),
    ]);
    expect(blocks(text).map((block) => block.split('\n')[0])).toEqual([
      '1. Repainting: ₹10,000',
      '2. Repainting: ₹20,000',
    ]);
  });

  it('F3-R16 inserts $&, {amount} and quotation marks literally', () => {
    const label = 'Fee $& {amount} $1 "x" $`';
    const quote = 'Pays "$&" and {amount} $$ $\'';
    const text = messageFor({}, [cost(1_000_000, { ...BASE, label })], { quotes: { 0: quote } });
    expect(text).toContain(`1. ${label}: ₹10,000`);
    expect(text).toContain(`The lease says: "${quote}"`);
  });

  it('F3-R16 inserts a repair description with $& literally', () => {
    const text = messageFor({}, [cost(1_000_000, { ...BASE, repairDate: '2026-03-10' })], {
      repair: { description: 'Pipe $& {date}', reportedTo: 'Mr "Rao"' },
    });
    expect(text).toContain('to Mr "Rao": Pipe $& {date}');
  });

  it('F3-R16 keeps a block on its lines when a label or quote has line breaks', () => {
    const text = messageFor({}, [cost(1_000_000, { ...BASE, label: 'Paint\n\nwalls\r\n' })], {
      quotes: { 0: 'First line.\n\nSecond line.' },
    });
    expect(text).toContain('1. Paint walls: ₹10,000');
    expect(text).toContain('The lease says: "First line. Second line."');
    expect(blocks(text)).toHaveLength(1);
  });

  it('F3 edge: a very long label is inserted in full', () => {
    const label = 'x'.repeat(5000);
    expect(messageFor({}, [cost(1_000_000, { ...BASE, label })])).toContain(`1. ${label}:`);
  });

  it('F3-R3 shows the full amount charged and the expected amount for recalculate', () => {
    const text = messageFor({}, [cost(1_000_000, { ...BASE, receiptAmountPaise: 600_000 })]);
    expect(text).toContain('1. Repainting: ₹10,000\nAmount I worked out: ₹6,000');
    expect(text).toContain('Could you please check this amount?');
  });
});
