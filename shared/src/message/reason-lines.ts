import { formatRupees } from '../money.js';
import type { ReasonCode } from '../rules/codes.js';
import { reasonSentence } from '../wording/index.js';
import type { ReasonFacts } from '../wording/index.js';

/** A null sentence means the code has no line of its own. */
type Sentence = (facts: ReasonFacts) => string | null;

function expectedText({ expectedPaise }: ReasonFacts): string {
  return expectedPaise === null ? 'expected amount' : formatRupees(expectedPaise);
}

/**
 * F3 Template, reason table: the sentences the tenant says in their own voice.
 * Every other code keeps its UI.md sentence through `reasonSentence`.
 */
export const MESSAGE_SENTENCES: Readonly<Partial<Record<ReasonCode, Sentence>>> = {
  ABOVE_PRORATED_RENT: (facts) =>
    `I used ${facts.rentDays?.used ?? 0} of the ${facts.rentDays?.inMonth ?? 0} days. ` +
    `The rent still due for this month works out to ${expectedText(facts)}. ` +
    `This charge is ${formatRupees(facts.amountPaise)}.`,
  RENT_OUTSIDE_TENANCY: () => 'None of my tenancy days fall in this month.',
  CLAUSE_NOT_FOUND: () => 'I could not find a clause in the lease that covers this.',
  CLAUSE_UNCONFIRMED: () => 'I could not confirm a matching clause in the lease.',
  FACTS_MISSING: () => 'I do not have a reading or the rate, so I cannot check the amount.',
  RECEIPT_MISSING: () => 'I was not given a receipt for this cost.',
  AMOUNT_NOT_STATED: () => 'I do not have the amount the lease states for this fee.',
  ASSUMED_PER_DAY: () => 'I worked out the partial month per day.',
  BELOW_EXPECTED: (facts) =>
    `This charge is lower than the ${expectedText(facts)} that I worked out.`,
  MATCHES: (facts) => `This charge matches the ${expectedText(facts)} that I worked out.`,
  // The repair line says it (F3 Template).
  REPAIR_REPORTED: () => null,
};

/** The line for one reason, or null when the reason has no line. */
export function messageSentence(code: ReasonCode, facts: ReasonFacts): string | null {
  const override = MESSAGE_SENTENCES[code];
  return override === undefined ? reasonSentence(code, facts) : override(facts);
}
