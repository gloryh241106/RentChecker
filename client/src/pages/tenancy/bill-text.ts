import { formatRupees, reasonSentence } from '../../shared.js';
import type { BillCheckResult } from '../../shared.js';

/** UI.md During the tenancy. Said on screen and in the status region. */
export function billSummary({ expectedPaise, billedPaise, differencePaise }: BillCheckResult) {
  return (
    `Worked out from your readings: ${formatRupees(expectedPaise)}. ` +
    `Your bill: ${formatRupees(billedPaise)}. Difference: ${formatRupees(differencePaise)}.`
  );
}

/** One sentence from the reason table, F5-R3. */
export function billReasonText({ reason, billedPaise, expectedPaise }: BillCheckResult): string {
  return reasonSentence(reason, {
    amountPaise: billedPaise,
    expectedPaise,
    rentDays: null,
    repairDates: [],
  });
}
