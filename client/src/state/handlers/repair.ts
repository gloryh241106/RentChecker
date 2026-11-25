import { MAX_REPAIRS } from '../../shared.js';
import type { Workspace } from '../../shared.js';
import type { HandlersFor, RepairFields } from '../actions.js';

function addRepair(state: Workspace, { repair }: { readonly repair: RepairFields }): Workspace {
  const isKnown = state.repairs.some(({ id }) => id === repair.id);
  if (isKnown || state.repairs.length >= MAX_REPAIRS) {
    return state;
  }
  return { ...state, repairs: [...state.repairs, repair] };
}

function updateRepair(state: Workspace, { repair }: { readonly repair: RepairFields }): Workspace {
  if (!state.repairs.some(({ id }) => id === repair.id)) {
    return state;
  }
  return {
    ...state,
    repairs: state.repairs.map((each) =>
      each.id === repair.id ? { ...repair, deductionId: each.deductionId } : each,
    ),
  };
}

export const repairHandlers: HandlersFor<'repair/add' | 'repair/update' | 'repair/remove'> = {
  'repair/add': addRepair,
  'repair/update': updateRepair,
  'repair/remove': (state, { id }) => ({
    ...state,
    repairs: state.repairs.filter((each) => each.id !== id),
  }),
};
