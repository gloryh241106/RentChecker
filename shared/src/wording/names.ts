import type { Buckets } from '../rules/buckets.js';
import type { PrimaryResult } from '../rules/codes.js';
import type { DeductionKind } from '../schemas/deduction.js';
import type { EvidenceSource, EvidenceState } from '../schemas/evidence.js';
import type { Tenancy } from '../schemas/tenancy.js';

/** UI.md, fixed wording. */
export const RESULT_NAMES: Readonly<Record<PrimaryResult, string>> = {
  recalculate: 'Recalculate',
  unclear: 'Unclear',
  not_found: 'Not found in the lease',
  needs_proof: 'Needs proof',
  supported: 'Supported',
};

export const BUCKET_NAMES: Readonly<Record<keyof Buckets, string>> = {
  askAboutPaise: 'Ask about',
  awaitingProofPaise: 'Awaiting proof',
  unclearPaise: 'Unclear',
  consistentPaise: 'Consistent',
};

/** The order buckets are listed in. */
export const BUCKET_ORDER = [
  'askAboutPaise',
  'awaitingProofPaise',
  'unclearPaise',
  'consistentPaise',
] as const satisfies readonly (keyof Buckets)[];

export const KIND_NAMES: Readonly<Record<DeductionKind, string>> = {
  rent: 'Rent',
  metered: 'Metered bill',
  fixed_fee: 'Fixed fee',
  cost: 'Cost',
};

/** The order kinds are offered in. */
export const KIND_ORDER = [
  'rent',
  'metered',
  'fixed_fee',
  'cost',
] as const satisfies readonly DeductionKind[];

export const SOURCE_TAGS: Readonly<Record<EvidenceSource, string>> = {
  ai: 'AI match',
  keyword: 'Keyword match, read the quote',
  sample: 'Sample match',
  user: 'Set by you',
};

/** D-30 in plain words. */
export const EVIDENCE_STATE_NAMES: Readonly<Record<EvidenceState, string>> = {
  verified: 'Clause found',
  excludes: 'Lease may rule this out',
  none: 'No clause found',
  unconfirmed: 'Not confirmed',
};

export const PARTIAL_MONTH_NAMES: Readonly<Record<Tenancy['partialMonth'], string>> = {
  unsure: 'Not sure',
  per_day: 'Per day',
  full_month: 'Full month',
};
