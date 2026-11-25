import type { DeductionKind } from '../shared.js';
import type { DeductionField } from './deduction-form.js';

/** What each box shows. UI.md Deductions. */
export const DEDUCTION_FIELDS: Readonly<
  Record<
    DeductionField,
    {
      readonly label: string;
      readonly noun: string;
      readonly hint: string;
      readonly inputMode: 'decimal' | 'text';
    }
  >
> = {
  label: {
    inputMode: 'text',
    label: 'Label',
    noun: 'label',
    hint: 'For example Repainting or June rent',
  },
  amount: {
    inputMode: 'decimal',
    label: 'Amount charged',
    noun: 'amount charged',
    hint: 'For example 15,000',
  },
  rentMonth: {
    inputMode: 'text',
    label: 'Rent month',
    noun: 'rent month',
    hint: 'Write the month as YYYY-MM, for example 2026-06',
  },
  alreadyPaid: {
    inputMode: 'decimal',
    label: 'Already paid (optional)',
    noun: 'amount already paid',
    hint: 'Leave empty for 0',
  },
  previousReading: {
    inputMode: 'decimal',
    label: 'Previous reading (optional)',
    noun: 'previous reading',
    hint: 'For example 120.50',
  },
  currentReading: {
    inputMode: 'decimal',
    label: 'Current reading (optional)',
    noun: 'current reading',
    hint: 'For example 160',
  },
  rate: {
    inputMode: 'decimal',
    label: 'Rate per unit (optional)',
    noun: 'rate',
    hint: 'Rupees per unit, for example 8.50',
  },
  fixedCharge: {
    inputMode: 'decimal',
    label: 'Fixed charge (optional)',
    noun: 'fixed charge',
    hint: 'Leave empty for 0',
  },
  leaseAmount: {
    inputMode: 'decimal',
    label: 'Amount stated in the lease (optional)',
    noun: 'amount stated in the lease',
    hint: 'Leave empty if the lease does not say',
  },
  receiptAmount: {
    inputMode: 'decimal',
    label: 'Receipt amount (optional)',
    noun: 'receipt amount',
    hint: 'Leave empty if you were given no receipt',
  },
};

/** The boxes after label and amount, by kind. */
export const KIND_FIELDS: Readonly<Record<DeductionKind, readonly DeductionField[]>> = {
  rent: ['rentMonth', 'alreadyPaid'],
  metered: ['previousReading', 'currentReading', 'rate', 'fixedCharge'],
  fixed_fee: ['leaseAmount'],
  cost: ['receiptAmount'],
};
