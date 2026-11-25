import { KIND_NAMES, formatMonthText, formatRupees } from '../shared.js';
import type { FoundCharge } from '../shared.js';

/** F8-R7, F9-R9. A charge in one line. */
export function describeCharge({ label, amountPaise, kind, rentMonth }: FoundCharge): string {
  const month = rentMonth === null ? '' : ` for ${formatMonthText(rentMonth)}`;
  return `${label}, ${formatRupees(amountPaise)}, ${KIND_NAMES[kind]}${month}`;
}
