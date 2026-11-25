import { useMemo, useState } from 'react';
import type { Dispatch } from 'react';
import type { Problem } from '../components/ui/ErrorSummary.js';
import { checkBill } from '../shared.js';
import type { BillCheckResult, Workspace } from '../shared.js';
import type { WorkspaceAction } from '../state/actions.js';
import { BILL_FIELDS, draftsFromBill, readBill } from './bill-form.js';
import type { BillDrafts, BillField } from './bill-form.js';
import { collectProblems } from './collect-problems.js';
import { useFieldVisibility } from './use-field-visibility.js';

export const BILL_FIELD_ORDER: readonly BillField[] = [
  'previousReading',
  'currentReading',
  'rate',
  'fixedCharge',
  'billedTotal',
];

export interface BillForm {
  readonly drafts: BillDrafts;
  /** True after Check bill was tried. */
  readonly isSubmitted: boolean;
  readonly messageOf: (field: BillField) => string | undefined;
  /** Every problem, shown or not. Empty when the bill can be checked (F5-R2). */
  readonly problems: readonly Problem[];
  /** Set once Check bill was tried and every box is fine. Never set while a box is wrong. */
  readonly result: BillCheckResult | null;
  readonly setText: (field: BillField, text: string) => void;
  readonly blur: (field: BillField) => void;
  /** Makes every message visible. Returns the result, or null when a box is wrong. */
  readonly check: () => BillCheckResult | null;
}

export function billFieldId(field: BillField): string {
  return `bill-${field}`;
}

/**
 * The bill form. The text stays here while the user types, and a value reaches the store only when
 * it parses (FRONTEND.md), so the store never holds bad input and typing is never undone.
 */
export function useBillForm(workspace: Workspace, dispatch: Dispatch<WorkspaceAction>): BillForm {
  const [drafts, setDrafts] = useState(() => draftsFromBill(workspace.bill));
  const visibility = useFieldVisibility();
  const { bill, errors } = useMemo(() => readBill(drafts), [drafts]);
  const problems = collectProblems(BILL_FIELD_ORDER, errors, BILL_FIELDS, {
    idOf: billFieldId,
    isShown: visibility.isShown,
  });
  const outcome = problems.all.length === 0 ? checkBill(bill) : null;

  return {
    drafts,
    isSubmitted: visibility.isSubmitted,
    messageOf: problems.messageOf,
    problems: problems.all,
    result: visibility.isSubmitted ? outcome : null,
    setText: (field, text) => {
      visibility.markEdited(field);
      const next = { ...drafts, [field]: text };
      setDrafts(next);
      const { bill: nextBill } = readBill(next);
      if (JSON.stringify(nextBill) !== JSON.stringify(workspace.bill)) {
        dispatch({ type: 'bill/set', bill: nextBill });
      }
    },
    blur: visibility.markBlurred,
    check: () => {
      visibility.showAll();
      return outcome;
    },
  };
}
