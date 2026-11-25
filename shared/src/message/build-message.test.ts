import { describe, expect, it } from 'vitest';
import { cost, fixedFee, metered, rent } from '../../test-support/cases.js';
import type { Charge } from '../../test-support/cases.js';
import { messageFor } from './message-case.js';

const PAINTING_QUOTE = 'The tenant shall pay for repainting the walls at the end of the tenancy.';
const PER_DAY = { partialMonth: 'per_day' } as const;
const CLEANING = cost(500_000, { label: 'Cleaning', receiptAmountPaise: 500_000 });

/** DOMAIN_RULES.md, Worked example. */
const SAMPLE: readonly Charge[] = [
  cost(1_200_000, { label: 'Repainting', evidence: 'verified' }),
  rent(1_500_000, { label: 'June rent', evidence: 'verified' }),
  fixedFee(300_000, { label: 'Service fee', evidence: 'none' }),
];

const SAMPLE_MESSAGE = `Dear [landlord's name],

I am writing about the deductions from my deposit. The deposit was ₹30,000 and the total deducted is ₹30,000. Could you please help me understand the charges below?

1. Repainting: ₹12,000
I was not given a receipt for this cost.
The lease says: "${PAINTING_QUOTE}"
Could you please send me the receipt for this charge?

2. June rent: ₹15,000
Amount I worked out: ₹7,500
I used 15 of the 30 days. The rent still due for this month works out to ₹7,500. This charge is ₹15,000.
Could you please check this amount?

3. Service fee: ₹3,000
I could not find a clause in the lease that covers this.
I do not have the amount the lease states for this fee.
Could you please tell me which clause of the lease covers this charge?

Could you please also send me an itemised statement of all deductions, and the receipts or bills for each cost?

Thank you,
[your name]`;

function sampleMessage(): string {
  return messageFor(PER_DAY, SAMPLE, { quotes: { 0: PAINTING_QUOTE } }) ?? '';
}

describe('F3 message', () => {
  it('F3-R1 F3-R3 F3-R4 F3-R9 builds the exact message for the sample case', () => {
    expect(sampleMessage()).toBe(SAMPLE_MESSAGE);
  });

  it('F3-AC1 gives blocks for Repainting, June rent and Service fee, in that order', () => {
    const text = sampleMessage();
    const at = ['1. Repainting', '2. June rent', '3. Service fee'].map((s) => text.indexOf(s));
    expect(at.every((position) => position >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
  });

  it('F3-AC2 F3-R5 contains the sample amounts', () => {
    const text = sampleMessage();
    for (const amount of ['₹12,000', '₹15,000', '₹7,500', '₹3,000', '₹30,000']) {
      expect(text).toContain(amount);
    }
  });

  it('F3-AC3 F3-R4 asks for the receipt and shows the verified quote in Repainting', () => {
    const block = sampleMessage().split('\n\n')[2] ?? '';
    expect(block).toContain('Could you please send me the receipt for this charge?');
    expect(block).toContain(`The lease says: "${PAINTING_QUOTE}"`);
  });

  it('F3-AC4 F3-R5 shows ₹1,30,000 for an unclear deduction', () => {
    const unclear = cost(13_000_000, {
      label: 'Repairs',
      receiptAmountPaise: 13_000_000,
      evidence: 'unconfirmed',
    });
    const text = messageFor({ depositPaise: 20_000_000 }, [unclear]);
    expect(text).toContain('Repairs: ₹1,30,000');
    expect(text).toContain('which clause of the lease applies to this charge?');
  });

  it('F3-AC5 F3-R5 shows ₹15,000.50 for a recalculate deduction', () => {
    const text = messageFor(PER_DAY, [
      metered(1_500_050, { label: 'Electricity', evidence: 'verified' }),
    ]);
    expect(text).toContain('Electricity: ₹15,000.50');
  });

  it('F3-AC6 F3-R2 leaves a supported deduction out of the message', () => {
    const text = messageFor(PER_DAY, [CLEANING, ...SAMPLE]);
    expect(text).not.toContain('Cleaning');
    expect(text).toContain('1. Repainting');
  });

  it('F3-AC11 F3-R15 gives null when every deduction is supported', () => {
    expect(messageFor(PER_DAY, [CLEANING])).toBeNull();
  });

  it('F3-R15 gives null when there are no deductions', () => {
    expect(messageFor(PER_DAY, [])).toBeNull();
  });

  it('F3-AC9 F3-R6 F3-R9 asks for an itemised statement and receipts, with no legal words', () => {
    const text = sampleMessage();
    expect(text).toContain('itemised statement of all deductions');
    expect(text).toContain('receipts or bills for each cost');
    expect(text).not.toMatch(/illegal|unlawful|improper|fraud|court/i);
  });
});
