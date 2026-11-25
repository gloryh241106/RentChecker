import { useState } from 'react';
import type { Problem } from '../components/ui/ErrorSummary.js';
import type { Deduction, DeductionKind } from '../shared.js';
import { newId } from '../state/ids.js';
import { collectProblems } from './collect-problems.js';
import { blankDrafts, draftsFromDeduction, readDeduction, withKind } from './deduction-form.js';
import type { DeductionDrafts, DeductionField } from './deduction-form.js';
import { DEDUCTION_FIELDS, KIND_FIELDS } from './deduction-fields.js';
import { useFieldVisibility } from './use-field-visibility.js';

export interface DeductionFormState {
  readonly drafts: DeductionDrafts;
  /** True after Save was tried. */
  readonly isSubmitted: boolean;
  /** The message of a field, once it may be shown. */
  readonly messageOf: (field: DeductionField) => string | undefined;
  readonly problems: readonly Problem[];
  readonly setText: (field: DeductionField, text: string) => void;
  readonly blur: (field: DeductionField) => void;
  readonly setKind: (kind: DeductionKind) => void;
  readonly toggleRepair: (repairId: string, isLinked: boolean) => void;
  /** Shows every message. Returns what to save, or null when a box is wrong. */
  readonly submit: () => { deduction: Deduction; repairIds: readonly string[] } | null;
}

export function deductionFieldId(field: DeductionField): string {
  return `deduction-${field}`;
}

/**
 * The deduction form. Nothing reaches the store until Save, and Save needs every box to parse
 * (FRONTEND.md), so a half-typed deduction is never stored.
 */
export function useDeductionForm(
  initial: Deduction | null,
  linkedRepairIds: readonly string[],
): DeductionFormState {
  const [id] = useState(() => initial?.id ?? newId());
  const [drafts, setDrafts] = useState(() =>
    initial === null ? blankDrafts() : draftsFromDeduction(initial, linkedRepairIds),
  );
  const visibility = useFieldVisibility();
  const { deduction, errors } = readDeduction(drafts, id);
  const fields: readonly DeductionField[] = ['label', 'amount', ...KIND_FIELDS[drafts.kind]];
  const problems = collectProblems(fields, errors, DEDUCTION_FIELDS, {
    idOf: deductionFieldId,
    isShown: visibility.isShown,
  });

  return {
    drafts,
    isSubmitted: visibility.isSubmitted,
    messageOf: problems.messageOf,
    problems: problems.all,
    setText: (field, text) => {
      visibility.markEdited(field);
      setDrafts({ ...drafts, [field]: text });
    },
    blur: visibility.markBlurred,
    setKind: (kind) => setDrafts(withKind(drafts, kind)),
    toggleRepair: (repairId, isLinked) =>
      setDrafts({
        ...drafts,
        repairIds: isLinked
          ? [...drafts.repairIds, repairId]
          : drafts.repairIds.filter((each) => each !== repairId),
      }),
    submit: () => {
      visibility.showAll();
      return deduction === null ? null : { deduction, repairIds: drafts.repairIds };
    },
  };
}
