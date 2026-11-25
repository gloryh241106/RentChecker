import { useMemo, useState } from 'react';
import type { Dispatch } from 'react';
import type { Problem } from '../components/ui/ErrorSummary.js';
import type { Tenancy, Workspace } from '../shared.js';
import type { WorkspaceAction } from '../state/actions.js';
import { collectProblems } from './collect-problems.js';
import { TENANCY_FIELDS, draftsFromTenancy, readTenancy } from './tenancy-form.js';
import type { TenancyDrafts, TenancyField } from './tenancy-form.js';
import { useFieldVisibility } from './use-field-visibility.js';

export const TENANCY_FIELD_ORDER: readonly TenancyField[] = [
  'deposit',
  'monthlyRent',
  'handoverDate',
  'startDate',
  'statedRefund',
];

export interface TenancyForm {
  readonly drafts: TenancyDrafts;
  /** True after Next or Run check was tried. */
  readonly isSubmitted: boolean;
  /** The message of a field, once it may be shown. */
  readonly messageOf: (field: TenancyField) => string | undefined;
  /** Every problem, shown or not. Empty when the check may run (F1-R3). */
  readonly problems: readonly Problem[];
  readonly setText: (field: TenancyField, text: string) => void;
  readonly blur: (field: TenancyField) => void;
  readonly setPartialMonth: (value: Tenancy['partialMonth']) => void;
  readonly setHandoverDayCounts: (counts: boolean) => void;
  /** Makes every message visible. */
  readonly showAll: () => void;
}

export function tenancyFieldId(field: TenancyField): string {
  return `tenancy-${field}`;
}

/**
 * The text boxes of the Details step. The raw text stays here while the user is on the page, and a
 * value reaches the store only when it parses (FRONTEND.md), so the store never holds bad input.
 */
export function useTenancyForm(
  workspace: Workspace,
  dispatch: Dispatch<WorkspaceAction>,
): TenancyForm {
  const [drafts, setDrafts] = useState(() => draftsFromTenancy(workspace.tenancy));
  const visibility = useFieldVisibility();
  const { errors } = useMemo(() => readTenancy(drafts), [drafts]);
  const problems = collectProblems(TENANCY_FIELD_ORDER, errors, TENANCY_FIELDS, {
    idOf: tenancyFieldId,
    isShown: visibility.isShown,
  });

  function change(next: TenancyDrafts): void {
    setDrafts(next);
    const { tenancy } = readTenancy(next);
    if (JSON.stringify(tenancy) !== JSON.stringify(workspace.tenancy)) {
      dispatch({ type: 'tenancy/update', tenancy });
    }
  }

  return {
    drafts,
    isSubmitted: visibility.isSubmitted,
    messageOf: problems.messageOf,
    problems: problems.all,
    setText: (field, text) => {
      visibility.markEdited(field);
      change({ ...drafts, [field]: text });
    },
    blur: visibility.markBlurred,
    setPartialMonth: (partialMonth) => change({ ...drafts, partialMonth }),
    setHandoverDayCounts: (handoverDayCounts) => change({ ...drafts, handoverDayCounts }),
    showAll: visibility.showAll,
  };
}
