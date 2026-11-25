import { MAX_DEDUCTIONS } from '../../shared.js';
import type { Deduction, Workspace } from '../../shared.js';
import type { HandlersFor } from '../actions.js';
import { linkRepairs, unlinkDeduction } from './repair-links.js';

interface Change {
  readonly deduction: Deduction;
  readonly repairIds: readonly string[];
}

function addDeduction(state: Workspace, { deduction, repairIds }: Change): Workspace {
  const isKnown = state.deductions.some(({ id }) => id === deduction.id);
  if (isKnown || state.deductions.length >= MAX_DEDUCTIONS) {
    return state;
  }
  return {
    ...state,
    deductions: [...state.deductions, deduction],
    repairs: linkRepairs(state.repairs, deduction.id, repairIds),
  };
}

function updateDeduction(state: Workspace, { deduction, repairIds }: Change): Workspace {
  const before = state.deductions.find(({ id }) => id === deduction.id);
  if (before === undefined) {
    return state;
  }
  // F1-R15: a new label or kind means the old match no longer applies.
  const isRenamed = before.label !== deduction.label || before.kind !== deduction.kind;
  return {
    ...state,
    deductions: state.deductions.map((each) => (each.id === deduction.id ? deduction : each)),
    evidence: isRenamed
      ? state.evidence.filter(({ deductionId }) => deductionId !== deduction.id)
      : state.evidence,
    repairs: linkRepairs(state.repairs, deduction.id, repairIds),
  };
}

export const deductionHandlers: HandlersFor<
  'deduction/add' | 'deduction/update' | 'deduction/remove'
> = {
  'deduction/add': addDeduction,
  'deduction/update': updateDeduction,
  'deduction/remove': (state, { id }) => ({
    ...state,
    deductions: state.deductions.filter((each) => each.id !== id),
    evidence: state.evidence.filter(({ deductionId }) => deductionId !== id),
    repairs: unlinkDeduction(state.repairs, id),
  }),
};
