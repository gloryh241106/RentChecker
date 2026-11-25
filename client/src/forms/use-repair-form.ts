import { useState } from 'react';
import type { Problem } from '../components/ui/ErrorSummary.js';
import type { Repair } from '../shared.js';
import { newId } from '../state/ids.js';
import type { RepairFields } from '../state/actions.js';
import { collectProblems } from './collect-problems.js';
import {
  REPAIR_FIELDS,
  REPAIR_FIELD_ORDER,
  blankRepairDrafts,
  draftsFromRepair,
  readRepair,
} from './repair-form.js';
import type { RepairDrafts, RepairField } from './repair-form.js';
import { useFieldVisibility } from './use-field-visibility.js';

export interface RepairFormState {
  readonly drafts: RepairDrafts;
  /** True after Save was tried. */
  readonly isSubmitted: boolean;
  readonly messageOf: (field: RepairField) => string | undefined;
  readonly problems: readonly Problem[];
  readonly setText: (field: RepairField, text: string) => void;
  readonly blur: (field: RepairField) => void;
  /** Shows every message. Returns what to save, or null when a box is wrong. */
  readonly submit: () => RepairFields | null;
}

export function repairFieldId(field: RepairField): string {
  return `repair-${field}`;
}

/**
 * The repair form, for adding and for editing. Nothing reaches the store until Save, and Save needs
 * every box to parse (FRONTEND.md).
 */
export function useRepairForm(initial: Repair | null): RepairFormState {
  const [id] = useState(() => initial?.id ?? newId());
  const [drafts, setDrafts] = useState(() =>
    initial === null ? blankRepairDrafts() : draftsFromRepair(initial),
  );
  const visibility = useFieldVisibility();
  const { repair, errors } = readRepair(drafts, id);
  const problems = collectProblems(REPAIR_FIELD_ORDER, errors, REPAIR_FIELDS, {
    idOf: repairFieldId,
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
    submit: () => {
      visibility.showAll();
      return repair;
    },
  };
}
