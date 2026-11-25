import type { Workspace } from '../shared.js';

const PAINTING_SENTENCE =
  "The tenant shall pay for repainting the walls on leaving, against the painter's bill.";

export const SAMPLE_DEPOSIT_SENTENCE =
  'The deposit of Rs 30,000 is refunded within 30 days of handover.';

/** F1-R17. */
export const SAMPLE_LEASE = [
  'The monthly rent is Rs 15,000, payable by the 5th of each month.',
  'If the tenant leaves during a month, rent is charged for each day used.',
  PAINTING_SENTENCE,
  SAMPLE_DEPOSIT_SENTENCE,
].join('\n');

/** The worked example of DOMAIN_RULES.md, with per-day charging confirmed. */
export function createSampleWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    tenancy: {
      depositPaise: 3_000_000,
      monthlyRentPaise: 1_500_000,
      handoverDate: '2026-06-15',
      partialMonth: 'per_day',
      handoverDayCounts: true,
    },
    leaseText: SAMPLE_LEASE,
    deductions: [
      { id: 'sample-painting', kind: 'cost', label: 'Repainting', amountPaise: 1_200_000 },
      {
        id: 'sample-rent',
        kind: 'rent',
        label: 'June rent',
        amountPaise: 1_500_000,
        rentMonth: '2026-06',
        alreadyPaidPaise: 0,
      },
      { id: 'sample-fee', kind: 'fixed_fee', label: 'Service fee', amountPaise: 300_000 },
    ],
    evidence: [
      {
        deductionId: 'sample-painting',
        state: 'verified',
        quote: PAINTING_SENTENCE,
        source: 'sample',
      },
      { deductionId: 'sample-fee', state: 'none', quote: null, source: 'sample' },
    ],
    repairs: [],
    reviewLeaseText: '',
    leaseReview: [],
    isSample: true,
  };
}
