import { billCheckSchema } from '../shared.js';
import type { BillCheck } from '../shared.js';
import { numberText } from './amount-text.js';
import type { FieldErrorCode } from './field-errors.js';
import {
  errorOf,
  readAmount,
  readPositiveAmount,
  readRate,
  readReading,
  required,
  valueOf,
} from './read-fields.js';

export type BillField =
  'previousReading' | 'currentReading' | 'rate' | 'fixedCharge' | 'billedTotal';

export type BillErrors = Partial<Record<BillField, FieldErrorCode>>;

/** The text boxes of the bill form, as typed. */
export type BillDrafts = Readonly<Record<BillField, string>>;

/** What the form shows for each text box. UI.md During the tenancy. */
export const BILL_FIELDS: Readonly<
  Record<
    BillField,
    {
      readonly label: string;
      readonly noun: string;
      readonly hint: string;
      readonly isRequired: boolean;
    }
  >
> = {
  previousReading: {
    label: 'Previous reading',
    noun: 'previous reading',
    hint: 'For example 120.50',
    isRequired: true,
  },
  currentReading: {
    label: 'Current reading',
    noun: 'current reading',
    hint: 'For example 160',
    isRequired: true,
  },
  rate: {
    label: 'Rate per unit',
    noun: 'rate',
    hint: 'Rupees per unit, for example 8.50',
    isRequired: true,
  },
  fixedCharge: {
    label: 'Fixed charge (optional)',
    noun: 'fixed charge',
    hint: 'Leave empty for 0',
    isRequired: false,
  },
  billedTotal: {
    label: 'Bill total',
    noun: 'bill total',
    hint: 'The amount on the bill, for example 1,300',
    isRequired: true,
  },
};

export function draftsFromBill(bill: BillCheck | undefined): BillDrafts {
  return {
    previousReading: numberText(bill?.previousReading),
    currentReading: numberText(bill?.currentReading),
    rate: numberText(bill?.ratePaisePerUnit),
    // An empty box and 0 mean the same (F5), so 0 is not shown back as text.
    fixedCharge: bill?.fixedChargePaise ? numberText(bill.fixedChargePaise) : '',
    billedTotal: numberText(bill?.billedTotalPaise),
  };
}

/**
 * Reads the text boxes. `bill` holds only values that parse, so it is safe to store (F5-R4). A
 * current reading below the previous (D-22) is left out of it and reported on the current reading.
 * Boxes that must be filled are reported when empty, so `errors` is empty only when the bill can
 * be checked (F5-R2).
 */
export function readBill(drafts: BillDrafts): { bill: BillCheck; errors: BillErrors } {
  const previous = required(readReading(drafts.previousReading));
  const current = required(readReading(drafts.currentReading));
  const rate = required(readRate(drafts.rate));
  const fixedCharge = readAmount(drafts.fixedCharge);
  const billedTotal = required(readPositiveAmount(drafts.billedTotal));
  const withCurrent = {
    previousReading: valueOf(previous),
    currentReading: valueOf(current),
    ratePaisePerUnit: valueOf(rate),
    fixedChargePaise: valueOf(fixedCharge) ?? 0,
    billedTotalPaise: valueOf(billedTotal),
  };
  const isPairValid = billCheckSchema.safeParse(withCurrent).success;
  return {
    bill: isPairValid ? withCurrent : { ...withCurrent, currentReading: undefined },
    errors: {
      previousReading: errorOf(previous),
      currentReading: isPairValid ? errorOf(current) : 'CURRENT_BELOW_PREVIOUS',
      rate: errorOf(rate),
      fixedCharge: errorOf(fixedCharge),
      billedTotal: errorOf(billedTotal),
    },
  };
}
