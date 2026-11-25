import { describe, expect, it } from 'vitest';
import { REASON_CODES } from '../rules/codes.js';
import { formatDateText, formatMonthText, joinWithAnd } from './date-text.js';
import { RESULT_NAMES, SOURCE_TAGS } from './names.js';
import { reasonSentence } from './reasons.js';
import type { ReasonFacts } from './reasons.js';

const FACTS: ReasonFacts = {
  amountPaise: 1_500_000,
  expectedPaise: 750_000,
  rentDays: { used: 15, inMonth: 30 },
  repairDates: ['2026-03-10'],
};

describe('wording', () => {
  it('F1-R9 every reason code has a sentence that never calls a charge legal or illegal', () => {
    for (const code of REASON_CODES) {
      const sentence = reasonSentence(code, FACTS);
      expect(sentence.length).toBeGreaterThan(10);
      expect(sentence).not.toMatch(/illegal|unlawful|legal\b/i);
    }
  });

  it('D-37 ABOVE_PRORATED_RENT fills in days, expected and amount (UI.md)', () => {
    expect(reasonSentence('ABOVE_PRORATED_RENT', FACTS)).toBe(
      'You used 15 of the 30 days. The rent still due for this month works out to ₹7,500. This charge is ₹15,000.',
    );
  });

  it('D-37 amount sentences use the fixed wording', () => {
    expect(reasonSentence('ABOVE_LEASE_AMOUNT', FACTS)).toBe(
      'The lease states ₹7,500. This charge is ₹15,000.',
    );
    expect(reasonSentence('MATCHES', FACTS)).toBe(
      'This charge matches the ₹7,500 that was worked out.',
    );
  });

  it('D-37 REPAIR_REPORTED joins several dates with commas and "and"', () => {
    const facts = { ...FACTS, repairDates: ['2026-03-10', '2026-04-02', '2026-05-30'] };
    expect(reasonSentence('REPAIR_REPORTED', facts)).toBe(
      'You reported a repair on 10 March 2026, 2 April 2026 and 30 May 2026, on or before handover.',
    );
  });

  it('F1-R10 result names and source tags are the fixed texts', () => {
    expect(Object.values(RESULT_NAMES)).toEqual(
      expect.arrayContaining([
        'Recalculate',
        'Unclear',
        'Not found in the lease',
        'Needs proof',
        'Supported',
      ]),
    );
    expect(SOURCE_TAGS.keyword).toBe('Keyword match, read the quote');
  });

  it('D-5 dates are written in words', () => {
    expect(formatDateText('2026-03-10')).toBe('10 March 2026');
    expect(formatMonthText('2026-06')).toBe('June 2026');
    expect(formatDateText('nonsense')).toBe('nonsense');
    expect(joinWithAnd(['a', 'b'])).toBe('a and b');
    expect(joinWithAnd(['a'])).toBe('a');
  });
});
