import { tenancySchema } from '../shared.js';
import type { Tenancy } from '../shared.js';
import { numberText } from './amount-text.js';
import type { FieldErrorCode } from './field-errors.js';
import {
  errorOf,
  readAmount,
  readDate,
  readPositiveAmount,
  required,
  valueOf,
} from './read-fields.js';

/** The text boxes of the Details step, as typed. */
export interface TenancyDrafts {
  readonly deposit: string;
  readonly monthlyRent: string;
  readonly handoverDate: string;
  readonly startDate: string;
  readonly statedRefund: string;
  readonly partialMonth: Tenancy['partialMonth'];
  readonly handoverDayCounts: boolean;
}

export type TenancyField =
  'deposit' | 'monthlyRent' | 'handoverDate' | 'startDate' | 'statedRefund';

export type TenancyErrors = Partial<Record<TenancyField, FieldErrorCode>>;

/** What the form shows for each text box. UI.md Details. */
export const TENANCY_FIELDS: Readonly<
  Record<
    TenancyField,
    {
      readonly label: string;
      readonly noun: string;
      readonly hint: string;
      readonly isRequired: boolean;
      readonly inputMode: 'decimal' | 'text';
    }
  >
> = {
  deposit: {
    label: 'Deposit',
    noun: 'deposit',
    hint: 'For example 15,000 or 1,30,000',
    isRequired: true,
    inputMode: 'decimal',
  },
  monthlyRent: {
    label: 'Monthly rent',
    noun: 'monthly rent',
    hint: 'For example 15,000 or 1,30,000',
    isRequired: true,
    inputMode: 'decimal',
  },
  handoverDate: {
    label: 'Handover date',
    noun: 'handover date',
    hint: 'Write the date as YYYY-MM-DD, for example 2026-06-15',
    isRequired: true,
    inputMode: 'text',
  },
  startDate: {
    label: 'Start date (optional)',
    noun: 'start date',
    hint: 'Write the date as YYYY-MM-DD, for example 2025-06-01',
    isRequired: false,
    inputMode: 'text',
  },
  statedRefund: {
    label: 'Refund the landlord stated (optional)',
    noun: 'refund',
    hint: 'For example 7,000. 0 is allowed',
    isRequired: false,
    inputMode: 'decimal',
  },
};

export function draftsFromTenancy(tenancy: Tenancy): TenancyDrafts {
  return {
    deposit: numberText(tenancy.depositPaise),
    monthlyRent: numberText(tenancy.monthlyRentPaise),
    handoverDate: tenancy.handoverDate ?? '',
    startDate: tenancy.startDate ?? '',
    statedRefund: numberText(tenancy.statedRefundPaise),
    partialMonth: tenancy.partialMonth,
    handoverDayCounts: tenancy.handoverDayCounts,
  };
}

/**
 * Reads the text boxes. `tenancy` holds only values that parse and never an invalid pair (D-5), so
 * either date can be edited at any time. A start date after the handover date is left out of the
 * tenancy and reported on the start date, whichever box was edited last.
 */
export function readTenancy(drafts: TenancyDrafts): { tenancy: Tenancy; errors: TenancyErrors } {
  const deposit = required(readPositiveAmount(drafts.deposit));
  const monthlyRent = required(readPositiveAmount(drafts.monthlyRent));
  const handoverDate = required(readDate(drafts.handoverDate));
  const startDate = readDate(drafts.startDate);
  const statedRefund = readAmount(drafts.statedRefund);
  const base: Tenancy = {
    depositPaise: valueOf(deposit),
    monthlyRentPaise: valueOf(monthlyRent),
    handoverDate: valueOf(handoverDate),
    statedRefundPaise: valueOf(statedRefund),
    partialMonth: drafts.partialMonth,
    handoverDayCounts: drafts.handoverDayCounts,
  };
  const withStart = { ...base, startDate: valueOf(startDate) };
  const isPairValid = tenancySchema.safeParse(withStart).success;
  const errors: TenancyErrors = {
    deposit: errorOf(deposit),
    monthlyRent: errorOf(monthlyRent),
    handoverDate: errorOf(handoverDate),
    startDate: isPairValid ? errorOf(startDate) : 'START_AFTER_HANDOVER',
    statedRefund: errorOf(statedRefund),
  };
  return { tenancy: isPairValid ? withStart : base, errors };
}
