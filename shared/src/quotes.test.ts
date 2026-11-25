import { describe, expect, it } from 'vitest';
import { isQuoteInLease } from './quotes.js';

const LEASE = 'Rent is due monthly.\nThe tenant shall pay for painting on exit. No pets.';

describe('isQuoteInLease', () => {
  it.each([
    ['a quote without its full stop', 'The tenant shall pay for painting on exit', true],
    ['other case and line breaks', 'RENT is due monthly. the\n\n tenant shall pay', true],
    ['a quote that joins two sentences', 'painting on exit. No pets.', true],
    ['one word changed (T-125)', 'The tenant must pay for painting on exit', false],
    ['an invented quote (T-124)', 'The tenant pays for all repairs', false],
    ['an empty quote (T-123)', '', false],
    ['spaces only', ' '.repeat(20), false],
  ])('F2-R4 %s', (_name, quote, expected) => {
    expect(isQuoteInLease(quote, LEASE)).toBe(expected);
  });

  it('F2-AC2 15 characters pass and 14 do not (T-126)', () => {
    expect(isQuoteInLease('pay for paintin', LEASE)).toBe(true);
    expect(isQuoteInLease('pay for painti', LEASE)).toBe(false);
  });

  it('F2-R4 600 characters pass and 601 do not (T-126)', () => {
    const longLease = 'abcdefghij'.repeat(100);
    expect(isQuoteInLease(longLease.slice(0, 600), longLease)).toBe(true);
    expect(isQuoteInLease(longLease.slice(0, 601), longLease)).toBe(false);
  });

  it('F2-R4 the length is counted after normalising (T-126)', () => {
    expect(isQuoteInLease('pay   for   painti', LEASE)).toBe(false);
  });

  it('F2-AC3 quote marks, spaces and case are equal (T-127)', () => {
    const lease = 'Clause 4: The Tenant’s  Duty to Paint is “full”.';
    expect(isQuoteInLease('the tenant\'s duty to paint is "full"', lease)).toBe(true);
  });
});
