/** F4-R1. The ten deposit topics, in the order they are shown, each with its question. */
export const REVIEW_TOPICS = [
  {
    id: 'deposit-amount',
    name: 'Deposit amount',
    question: 'How much is the deposit and when is it paid?',
  },
  {
    id: 'refund-deadline',
    name: 'Refund deadline',
    question: 'By what date will the deposit be refunded after I hand over?',
  },
  {
    id: 'partial-month-rent',
    name: 'Partial-month rent',
    question: 'How is rent charged if I leave part way through a month?',
  },
  {
    id: 'painting',
    name: 'Painting',
    question: 'Who pays for painting, and is it a fixed amount or the actual cost?',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    question: 'Is cleaning charged when I leave, and how much?',
  },
  {
    id: 'repairs-and-wear',
    name: 'Repairs and wear',
    question: 'Which repairs can be deducted, and is normal wear and tear excluded?',
  },
  {
    id: 'notice-period',
    name: 'Notice period',
    question: 'How much notice must I give, and what happens if I give less?',
  },
  {
    id: 'receipts',
    name: 'Receipts or itemised statement',
    question: 'Will you give an itemised statement and receipts for any deduction?',
  },
  {
    id: 'handover-inspection',
    name: 'Handover inspection',
    question: 'Will we inspect the home together at handover and record its condition?',
  },
  {
    id: 'meter-charges',
    name: 'Meter charges',
    question: 'How are electricity and water charged, and at what rate?',
  },
] as const;

export type ReviewTopic = (typeof REVIEW_TOPICS)[number];
export type ReviewTopicId = ReviewTopic['id'];

const TOPIC_IDS: ReadonlySet<string> = new Set(REVIEW_TOPICS.map(({ id }) => id));

/** For a value that came from storage, the network or a form. */
export function isReviewTopicId(value: string): value is ReviewTopicId {
  return TOPIC_IDS.has(value);
}
