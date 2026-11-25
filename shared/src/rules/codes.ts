/** D-32 to D-36. */
export type PrimaryResult = 'not_found' | 'recalculate' | 'unclear' | 'needs_proof' | 'supported';

/** D-37, in the order reasons are listed. */
export const REASON_CODES = [
  'DUPLICATE_CHARGE',
  'ABOVE_PRORATED_RENT',
  'RENT_OUTSIDE_TENANCY',
  'ABOVE_METER_TOTAL',
  'ABOVE_LEASE_AMOUNT',
  'ABOVE_RECEIPT',
  'CLAUSE_NOT_FOUND',
  'CLAUSE_UNCONFIRMED',
  'CLAUSE_EXCLUDES',
  'FACTS_MISSING',
  'RECEIPT_MISSING',
  'AMOUNT_NOT_STATED',
  'ASSUMED_PER_DAY',
  'BELOW_EXPECTED',
  'REPAIR_REPORTED',
  'MATCHES',
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];
