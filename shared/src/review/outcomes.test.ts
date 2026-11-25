import { describe, expect, it } from 'vitest';
import type { EvidenceState } from '../schemas/evidence.js';
import type { LeaseReviewItem } from '../schemas/lease-review.js';
import { questionsToAsk, showsQuestion, topicOutcome, TOPIC_OUTCOME_NAMES } from './outcomes.js';
import { isReviewTopicId, REVIEW_TOPICS } from './topics.js';

const found = (topicId: string): LeaseReviewItem => ({
  topicId,
  state: 'verified',
  quote: 'The deposit is refunded in full.',
  source: 'ai',
});
const without = (topicId: string, state: 'none' | 'unconfirmed'): LeaseReviewItem => ({
  topicId,
  state,
  quote: null,
  source: 'ai',
});

describe('F4-R1 the fixed topics', () => {
  it('F4-R1 there are ten topics in the order of F4 with the given ids', () => {
    expect(REVIEW_TOPICS.map(({ id }) => id)).toEqual([
      'deposit-amount',
      'refund-deadline',
      'partial-month-rent',
      'painting',
      'cleaning',
      'repairs-and-wear',
      'notice-period',
      'receipts',
      'handover-inspection',
      'meter-charges',
    ]);
  });

  it('F4-R1 names and questions are the fixed ones', () => {
    expect(REVIEW_TOPICS[0]).toMatchObject({
      name: 'Deposit amount',
      question: 'How much is the deposit and when is it paid?',
    });
    expect(REVIEW_TOPICS[7]?.name).toBe('Receipts or itemised statement');
    expect(REVIEW_TOPICS[9]?.question).toBe(
      'How are electricity and water charged, and at what rate?',
    );
  });

  it('F4-R1 only the ten ids are topic ids', () => {
    expect(isReviewTopicId('painting')).toBe(true);
    expect(isReviewTopicId('Painting')).toBe(false);
    expect(isReviewTopicId('d1')).toBe(false);
  });
});

describe('F4-R3 outcomes', () => {
  it('F4-R3 each evidence state has its outcome name', () => {
    expect(TOPIC_OUTCOME_NAMES).toEqual({
      verified: 'Found',
      none: 'Not found',
      unconfirmed: 'Could not confirm',
      excludes: 'Lease may rule this out',
    });
  });

  it('F4-R3 a topic with no item could not be confirmed', () => {
    expect(topicOutcome(undefined)).toBe('unconfirmed');
    expect(topicOutcome(found('painting'))).toBe('verified');
  });

  it('F4-R3 only Found hides the question', () => {
    const states: EvidenceState[] = ['verified', 'none', 'unconfirmed', 'excludes'];
    expect(states.map(showsQuestion)).toEqual([false, true, true, true]);
  });
});

describe('F4-R5 questions to ask', () => {
  it('F4-AC5 six topics not Found give six questions in topic order', () => {
    const items = [
      found('deposit-amount'),
      without('refund-deadline', 'none'),
      found('partial-month-rent'),
      without('painting', 'unconfirmed'),
      found('cleaning'),
      without('repairs-and-wear', 'none'),
      without('notice-period', 'none'),
      without('receipts', 'unconfirmed'),
      without('handover-inspection', 'none'),
      found('meter-charges'),
    ];
    const lines = questionsToAsk(items);
    expect(lines).toHaveLength(6);
    expect(lines[0]).toBe('By what date will the deposit be refunded after I hand over?');
    expect(lines[5]).toBe(
      'Will we inspect the home together at handover and record its condition?',
    );
  });

  it('F4-R5 a topic with no item is asked about, and items out of order do not matter', () => {
    const lines = questionsToAsk([found('painting'), found('deposit-amount')]);
    expect(lines).toHaveLength(8);
    expect(lines[0]).toBe('By what date will the deposit be refunded after I hand over?');
  });

  it('F4-R5 every topic Found gives no question', () => {
    expect(questionsToAsk(REVIEW_TOPICS.map(({ id }) => found(id)))).toEqual([]);
  });
});
