import { formatRupees } from '../money.js';
import type { ReasonCode } from '../rules/codes.js';
import type { RentDays } from '../rules/expected/rent.js';
import { formatDateText, joinWithAnd } from './date-text.js';

/** What a sentence may mention. All of it comes from the calculation. */
export interface ReasonFacts {
  readonly amountPaise: number;
  readonly expectedPaise: number | null;
  readonly rentDays: RentDays | null;
  /** The dates of the linked repairs that give REPAIR_REPORTED. */
  readonly repairDates: readonly string[];
}

type Sentence = (facts: ReasonFacts) => string;

function expected({ expectedPaise }: ReasonFacts): string {
  return expectedPaise === null ? 'expected amount' : formatRupees(expectedPaise);
}

function above(facts: ReasonFacts, source: string): string {
  return `The ${source} ${expected(facts)}. This charge is ${formatRupees(facts.amountPaise)}.`;
}

/** UI.md reason table, D-37. A new code does not compile until it has a sentence. */
export const REASON_SENTENCES: Readonly<Record<ReasonCode, Sentence>> = {
  DUPLICATE_CHARGE: () => 'This repeats an earlier charge.',
  ABOVE_PRORATED_RENT: (facts) =>
    `You used ${facts.rentDays?.used ?? 0} of the ${facts.rentDays?.inMonth ?? 0} days. ` +
    `The rent still due for this month works out to ${expected(facts)}. ` +
    `This charge is ${formatRupees(facts.amountPaise)}.`,
  RENT_OUTSIDE_TENANCY: () => 'None of your tenancy days fall in this month.',
  ABOVE_METER_TOTAL: (facts) =>
    `The readings and rate give ${expected(facts)}. This charge is ${formatRupees(facts.amountPaise)}.`,
  ABOVE_LEASE_AMOUNT: (facts) => above(facts, 'lease states'),
  ABOVE_RECEIPT: (facts) => above(facts, 'receipt is for'),
  CLAUSE_NOT_FOUND: () => 'No clause in the lease you pasted covers this.',
  CLAUSE_UNCONFIRMED: () => 'A matching clause could not be confirmed.',
  CLAUSE_EXCLUDES: () => 'A clause in the lease seems to rule this charge out.',
  FACTS_MISSING: () => 'A reading or the rate is missing, so the amount cannot be checked.',
  RECEIPT_MISSING: () => 'No receipt was given for this cost.',
  AMOUNT_NOT_STATED: () => 'The lease amount for this fee was not entered.',
  ASSUMED_PER_DAY: () =>
    'A partial month was calculated per day. Choose how your lease charges it to confirm.',
  BELOW_EXPECTED: (facts) =>
    `This charge is lower than the ${expected(facts)} that was worked out.`,
  REPAIR_REPORTED: ({ repairDates }) =>
    `You reported a repair on ${joinWithAnd(repairDates.map(formatDateText))}, on or before handover.`,
  MATCHES: (facts) => `This charge matches the ${expected(facts)} that was worked out.`,
};

export function reasonSentence(code: ReasonCode, facts: ReasonFacts): string {
  return REASON_SENTENCES[code](facts);
}
