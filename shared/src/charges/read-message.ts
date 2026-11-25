import type { Deduction, DeductionKind } from '../schemas/deduction.js';
import { findAmount } from './amount.js';
import type { FoundAmount } from './amount.js';
import { guessKind, isSummary } from './kind.js';
import { namingText, readLabel } from './label.js';
import { readRentMonth } from './months.js';
import { splitMessage } from './split.js';

/** F8. */
export const MAX_MESSAGE_LENGTH = 4_000;

export interface FoundCharge {
  readonly label: string;
  readonly amountPaise: number;
  readonly kind: DeductionKind;
  /** Only for rent. Null when no month can be worked out (F8-R6). */
  readonly rentMonth: string | null;
}

export interface FoundCharges {
  readonly charges: readonly FoundCharge[];
  /** How many amounts look like a sum or a payment (F8-R4). */
  readonly leftOut: number;
}

function toCharge(
  part: string,
  amount: FoundAmount,
  handoverDate: string | undefined,
): FoundCharge {
  const label = readLabel(amount);
  const kind = guessKind(label);
  const rentMonth = kind === 'rent' ? readRentMonth(part, handoverDate) : null;
  return { label, amountPaise: amount.amountPaise, kind, rentMonth };
}

/** F8-R1 to F8-R6. Pure: the same message always gives the same charges. */
export function readMessage(message: string, handoverDate: string | undefined): FoundCharges {
  const charges: FoundCharge[] = [];
  let leftOut = 0;
  for (const part of splitMessage(message.slice(0, MAX_MESSAGE_LENGTH))) {
    const amount = findAmount(part);
    if (amount !== null && isSummary(namingText(amount))) {
      leftOut += 1;
    } else if (amount !== null) {
      charges.push(toCharge(part, amount, handoverDate));
    }
  }
  return { charges, leftOut };
}

/** F8-R7. A deduction with no further facts. Null for rent without a month. */
export function toDeduction(charge: FoundCharge, id: string): Deduction | null {
  const { kind, label, amountPaise, rentMonth } = charge;
  const common = { id, label, amountPaise };
  switch (kind) {
    case 'rent':
      return rentMonth === null ? null : { ...common, kind, rentMonth, alreadyPaidPaise: 0 };
    case 'metered':
      return { ...common, kind, fixedChargePaise: 0 };
    case 'fixed_fee':
    case 'cost':
      return { ...common, kind };
  }
}
