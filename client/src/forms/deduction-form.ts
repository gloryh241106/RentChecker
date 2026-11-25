import { deductionSchema } from '../shared.js';
import type { Deduction, DeductionKind } from '../shared.js';
import { numberText } from './amount-text.js';
import type { FieldErrorCode } from './field-errors.js';
import {
  errorOf,
  readAmount,
  readLabel,
  readMonth,
  readPositiveAmount,
  readRate,
  readReading,
  required,
  valueOf,
} from './read-fields.js';

export type DeductionField =
  | 'label'
  | 'amount'
  | 'rentMonth'
  | 'alreadyPaid'
  | 'previousReading'
  | 'currentReading'
  | 'rate'
  | 'fixedCharge'
  | 'leaseAmount'
  | 'receiptAmount';

export type DeductionErrors = Partial<Record<DeductionField, FieldErrorCode>>;

/** The text of every box of the deduction form. Only the boxes of the chosen kind are used. */
export interface DeductionDrafts extends Record<DeductionField, string> {
  readonly kind: DeductionKind;
  readonly repairIds: readonly string[];
}

export function blankDrafts(): DeductionDrafts {
  return {
    kind: 'rent',
    label: '',
    amount: '',
    rentMonth: '',
    alreadyPaid: '',
    previousReading: '',
    currentReading: '',
    rate: '',
    fixedCharge: '',
    leaseAmount: '',
    receiptAmount: '',
    repairIds: [],
  };
}

/** F1-R5: a new kind starts without the facts of the old one. */
export function withKind(drafts: DeductionDrafts, kind: DeductionKind): DeductionDrafts {
  return {
    ...blankDrafts(),
    kind,
    label: drafts.label,
    amount: drafts.amount,
    repairIds: drafts.repairIds,
  };
}

export function draftsFromDeduction(
  deduction: Deduction,
  repairIds: readonly string[],
): DeductionDrafts {
  const common = {
    ...blankDrafts(),
    kind: deduction.kind,
    label: deduction.label,
    amount: numberText(deduction.amountPaise),
    repairIds,
  };
  switch (deduction.kind) {
    case 'rent':
      return {
        ...common,
        rentMonth: deduction.rentMonth,
        alreadyPaid: numberText(deduction.alreadyPaidPaise),
      };
    case 'metered':
      return {
        ...common,
        previousReading: numberText(deduction.previousReading),
        currentReading: numberText(deduction.currentReading),
        rate: numberText(deduction.ratePaisePerUnit),
        fixedCharge: numberText(deduction.fixedChargePaise),
      };
    case 'fixed_fee':
      return { ...common, leaseAmount: numberText(deduction.leaseAmountPaise) };
    case 'cost':
      return { ...common, receiptAmount: numberText(deduction.receiptAmountPaise) };
  }
}

/** The facts of one kind, for the schema, and the mistakes in their boxes. */
interface KindRead {
  readonly facts: object;
  readonly errors: DeductionErrors;
}

function readRentFacts(drafts: DeductionDrafts): KindRead {
  const rentMonth = required(readMonth(drafts.rentMonth));
  const alreadyPaid = readAmount(drafts.alreadyPaid);
  return {
    facts: { kind: 'rent', rentMonth: valueOf(rentMonth), alreadyPaidPaise: valueOf(alreadyPaid) },
    errors: { rentMonth: errorOf(rentMonth), alreadyPaid: errorOf(alreadyPaid) },
  };
}

function readMeteredFacts(drafts: DeductionDrafts): KindRead {
  const previous = readReading(drafts.previousReading);
  const current = readReading(drafts.currentReading);
  const rate = readRate(drafts.rate);
  const fixedCharge = readAmount(drafts.fixedCharge);
  return {
    facts: {
      kind: 'metered',
      previousReading: valueOf(previous),
      currentReading: valueOf(current),
      ratePaisePerUnit: valueOf(rate),
      fixedChargePaise: valueOf(fixedCharge),
    },
    errors: {
      previousReading: errorOf(previous),
      currentReading: errorOf(current),
      rate: errorOf(rate),
      fixedCharge: errorOf(fixedCharge),
    },
  };
}

function readFixedFeeFacts(drafts: DeductionDrafts): KindRead {
  const leaseAmount = readAmount(drafts.leaseAmount);
  return {
    facts: { kind: 'fixed_fee', leaseAmountPaise: valueOf(leaseAmount) },
    errors: { leaseAmount: errorOf(leaseAmount) },
  };
}

function readCostFacts(drafts: DeductionDrafts): KindRead {
  const receiptAmount = readAmount(drafts.receiptAmount);
  return {
    facts: { kind: 'cost', receiptAmountPaise: valueOf(receiptAmount) },
    errors: { receiptAmount: errorOf(receiptAmount) },
  };
}

/** D-10. A new kind is one more entry here, and the compiler asks for it. */
const KIND_READERS: Readonly<Record<DeductionKind, (drafts: DeductionDrafts) => KindRead>> = {
  rent: readRentFacts,
  metered: readMeteredFacts,
  fixed_fee: readFixedFeeFacts,
  cost: readCostFacts,
};

function withoutGaps(errors: DeductionErrors): DeductionErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, code]) => code !== undefined));
}

/**
 * Reads the form. `deduction` is set only when every box is fine and the whole passes the shared
 * schema, which also holds the rule that the current reading is not below the previous (D-22).
 */
export function readDeduction(
  drafts: DeductionDrafts,
  id: string,
): { deduction: Deduction | null; errors: DeductionErrors } {
  const label = required(readLabel(drafts.label));
  const amount = required(readPositiveAmount(drafts.amount));
  const kind = KIND_READERS[drafts.kind](drafts);
  const errors = withoutGaps({
    label: errorOf(label),
    amount: errorOf(amount),
    ...kind.errors,
  });
  if (Object.keys(errors).length > 0) {
    return { deduction: null, errors };
  }
  const parsed = deductionSchema.safeParse({
    id,
    label: valueOf(label),
    amountPaise: valueOf(amount),
    ...kind.facts,
  });
  if (parsed.success) {
    return { deduction: parsed.data, errors };
  }
  const isReadingOrder = parsed.error.issues.some(
    ({ message }) => message === 'CURRENT_BELOW_PREVIOUS',
  );
  return {
    deduction: null,
    errors: isReadingOrder ? { currentReading: 'CURRENT_BELOW_PREVIOUS' } : {},
  };
}
