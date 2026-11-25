import { describe, expect, it } from 'vitest';
import type { ClauseMatch } from '../shared.js';
import { run } from '../test-support/builders.js';
import type { EvidenceOverride, WorkspaceAction } from './actions.js';

const LEASE = 'The security deposit is Rs 30,000 and is paid before moving in. Rent is monthly.';
const QUOTE = 'security deposit is Rs 30,000';

const set = (text: string): WorkspaceAction => ({ type: 'review/set', text });
const apply = (matches: readonly ClauseMatch[]): WorkspaceAction => ({
  type: 'review/apply',
  matches,
});
const override = (topicId: string, value: EvidenceOverride): WorkspaceAction => ({
  type: 'review/override',
  topicId,
  override: value,
});
const none = (itemId: string): ClauseMatch => ({
  itemId,
  state: 'none',
  quote: null,
  source: 'ai',
});
const found = (itemId: string): ClauseMatch => ({
  itemId,
  state: 'verified',
  quote: QUOTE,
  source: 'ai',
});
const topicsOf = (state: ReturnType<typeof run>) => state.leaseReview.map(({ topicId }) => topicId);

describe('review actions', () => {
  it('F4-R7 the lease text is stored apart from the move-out lease text', () => {
    const state = run([{ type: 'lease/set', text: 'Move out lease' }, set(LEASE)]);
    expect(state.reviewLeaseText).toBe(LEASE);
    expect(state.leaseText).toBe('Move out lease');
  });

  it('F4-R7 a changed text clears every topic outcome and override, the same text does not', () => {
    const filled = run([
      set(LEASE),
      apply([found('deposit-amount')]),
      override('painting', { state: 'none' }),
    ]);
    expect(filled.leaseReview).toHaveLength(2);
    expect(run([set(LEASE)], filled)).toBe(filled);
    expect(run([set(`${LEASE} More.`)], filled).leaseReview).toEqual([]);
  });

  it('F4-R7 editing the review text leaves the move-out lease alone', () => {
    const before = run([{ type: 'lease/set', text: LEASE }]);
    expect(run([set('Another text')], before).leaseText).toBe(LEASE);
  });

  it('F4-R1 a match is stored under its topic id with the source of the run', () => {
    const state = run([set(LEASE), apply([found('deposit-amount')])]);
    expect(state.leaseReview).toEqual([
      { topicId: 'deposit-amount', state: 'verified', quote: QUOTE, source: 'ai' },
    ]);
  });

  it('F4-R1 a match for an id that is not a topic is ignored', () => {
    const state = run([set(LEASE), apply([none('d1'), none('painting')])]);
    expect(topicsOf(state)).toEqual(['painting']);
  });

  it('F2-R6 a later run replaces the outcome of a topic, one item for each', () => {
    const state = run([set(LEASE), apply([none('painting')]), apply([found('painting')])]);
    expect(state.leaseReview).toHaveLength(1);
    expect(state.leaseReview[0]?.state).toBe('verified');
  });

  it('F4-R6 a quote found in the lease is stored as verified, set by the user', () => {
    const quote = { state: 'verified', quote: ` ${QUOTE} ` } as const;
    const state = run([set(LEASE), override('deposit-amount', quote)]);
    expect(state.leaseReview).toEqual([
      { topicId: 'deposit-amount', state: 'verified', quote: QUOTE, source: 'user' },
    ]);
  });

  it('F4-R6 a quote is checked against the review lease, not the move-out lease', () => {
    const before = run([
      set(LEASE),
      { type: 'lease/set', text: 'The tenant shall pay for painting on exit.' },
    ]);
    const missing = override('painting', { state: 'verified', quote: 'pay for painting on exit' });
    expect(run([missing], before)).toBe(before);
  });

  it('F4-R6 confirming no clause stores none with no quote', () => {
    const state = run([set(LEASE), override('cleaning', { state: 'none' })]);
    expect(state.leaseReview).toEqual([
      { topicId: 'cleaning', state: 'none', quote: null, source: 'user' },
    ]);
  });

  it('F2-R14 F4-R6 an override wins over a later run and is gone after Remove override', () => {
    const state = run([
      set(LEASE),
      override('painting', { state: 'none' }),
      apply([found('painting'), found('cleaning')]),
    ]);
    expect(state.leaseReview.find(({ topicId }) => topicId === 'painting')?.source).toBe('user');
    expect(state.leaseReview).toHaveLength(2);
    const removed = run([override('painting', { state: 'unconfirmed' })], state);
    expect(topicsOf(removed)).toEqual(['cleaning']);
  });

  it('F4-R6 an override for an unknown topic changes nothing', () => {
    const before = run([set(LEASE)]);
    expect(run([override('d1', { state: 'none' })], before)).toBe(before);
  });
});
