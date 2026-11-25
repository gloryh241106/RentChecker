import type { HandlersFor } from '../actions.js';
import { EMPTY_WORKSPACE } from '../empty-workspace.js';
import { unlinkDeduction } from './repair-links.js';

export const detailsHandlers: HandlersFor<'details/apply'> = {
  'details/apply': (state, { tenancy, deductions }) => {
    // The lease of the sample case does not belong to the tenant.
    const kept = state.isSample ? EMPTY_WORKSPACE : state;
    const repairs = state.deductions.reduce(
      (rest, { id }) => unlinkDeduction(rest, id),
      kept.repairs,
    );
    return {
      ...kept,
      tenancy,
      deductions: [...deductions],
      evidence: [],
      repairs,
      draftMessage: undefined,
    };
  },
};
