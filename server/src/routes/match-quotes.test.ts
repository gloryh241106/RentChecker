import { describe, expect, it } from 'vitest';
import {
  PAINT_QUOTE,
  answering,
  item,
  makeMatchApp,
  matchWith,
  postMatch,
} from '../../test-support/match-harness.js';

async function matchQuote(leaseText: string, quote: string) {
  const clauseMatcher = answering({ itemId: 'd1', answer: 'covers', quote });
  const res = await postMatch(makeMatchApp({ clauseMatcher }).app, {
    leaseText,
    items: [item('d1')],
  });
  return { warnings: res.body.warnings, match: res.body.matches[0] };
}

const LONG_LEASE = `${'painting clause no '.repeat(60)}end.`;

describe('FR-9 quote check', () => {
  it('FR-9 two invented quotes give one QUOTE_REJECTED in ai mode (T-124, F2-AC4)', async () => {
    const invented = (itemId: string, answer: string) => ({
      itemId,
      answer,
      quote: 'This sentence is not in the lease at all',
    });
    const answers = [invented('d1', 'covers'), invented('d2', 'excludes')];
    expect(await matchWith(answers, item('d1'), item('d2'))).toEqual({
      mode: 'ai',
      warnings: ['QUOTE_REJECTED'],
      matches: [
        { itemId: 'd1', state: 'unconfirmed', quote: null, source: 'ai' },
        { itemId: 'd2', state: 'unconfirmed', quote: null, source: 'ai' },
      ],
    });
  });

  it('FR-9 a real quote with one word changed is rejected (T-125)', async () => {
    const quote = PAINT_QUOTE.replace('shall', 'must');
    const result = await matchWith([{ itemId: 'd1', answer: 'covers', quote }]);
    expect(result.warnings).toEqual(['QUOTE_REJECTED']);
    expect(result.matches[0]).toMatchObject({ state: 'unconfirmed', quote: null });
  });

  it.each([
    [15, 'verified', 'pay for paintin'],
    [14, 'unconfirmed', 'pay for painti'],
    [600, 'verified', LONG_LEASE.slice(0, 600)],
    [601, 'unconfirmed', LONG_LEASE.slice(0, 601)],
  ])('FR-9 a quote of %d characters is %s (T-126, F2-AC2)', async (length, state, quote) => {
    expect(quote.trim()).toHaveLength(length);
    const { match, warnings } = await matchQuote(`pay for painting. ${LONG_LEASE}`, quote);
    expect(match.state).toBe(state);
    expect(warnings).toEqual(state === 'verified' ? [] : ['QUOTE_REJECTED']);
  });

  it('FR-9 ignores curly quotes, spacing and case, and trims the quote (T-127)', async () => {
    const lease = 'Section 4 of this lease is: The Tenant’s  Duty to Paint. Nothing else applies.';
    const { match } = await matchQuote(lease, "  the tenant's duty to paint \n");
    expect(match).toEqual({
      itemId: 'd1',
      state: 'verified',
      quote: "the tenant's duty to paint",
      source: 'ai',
    });
  });

  it('FR-9 a quote that joins two sentences and appears twice passes (T-118)', async () => {
    const pair = 'Painting is due. Cleaning is due.';
    const { match } = await matchQuote(`${pair} Other words. ${pair} And more words.`, pair);
    expect(match).toMatchObject({ state: 'verified', quote: pair });
  });
});
