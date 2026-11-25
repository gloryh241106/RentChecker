import type { Deduction, Repair, Tenancy, Workspace } from '../shared.js';
import { createSampleWorkspace } from '../state/sample.js';
import { EMPTY_WORKSPACE } from '../state/empty-workspace.js';
import { workspaceReducer } from '../state/reducer.js';
import type { WorkspaceAction } from '../state/actions.js';

export const LEASE = 'The tenant shall pay for repainting the walls on leaving. Rent is monthly.';
export const QUOTE = 'pay for repainting the walls';

export const PAINTING: Deduction = {
  id: 'd1',
  kind: 'cost',
  label: 'Repainting',
  amountPaise: 1_200_000,
};
export const FEE: Deduction = {
  id: 'd2',
  kind: 'fixed_fee',
  label: 'Service fee',
  amountPaise: 300_000,
};
export const RENT: Deduction = {
  id: 'd3',
  kind: 'rent',
  label: 'June rent',
  amountPaise: 1_500_000,
  rentMonth: '2026-06',
  alreadyPaidPaise: 0,
};
export const REPAIR: Repair = {
  id: 'r1',
  date: '2026-03-10',
  description: 'Damp wall',
  reportedTo: 'Landlord',
};

export function run(
  actions: readonly WorkspaceAction[],
  from: Workspace = EMPTY_WORKSPACE,
): Workspace {
  return actions.reduce(workspaceReducer, from);
}

export function add(deduction: Deduction, repairIds: readonly string[] = []): WorkspaceAction {
  return { type: 'deduction/add', deduction, repairIds };
}

/** A workspace with a lease, three deductions and a repair in the log. */
export function filledWorkspace(): Workspace {
  const start: Workspace = { ...EMPTY_WORKSPACE, repairs: [REPAIR] };
  return run([{ type: 'lease/set', text: LEASE }, add(PAINTING), add(FEE), add(RENT)], start);
}

/** The tenancy of the worked example, with these deductions, no lease and no evidence. */
export function caseWith(
  deductions: readonly Deduction[],
  tenancy: Partial<Tenancy> = {},
  extra: Partial<Workspace> = {},
): Workspace {
  return {
    ...EMPTY_WORKSPACE,
    tenancy: { ...createSampleWorkspace().tenancy, ...tenancy },
    deductions: [...deductions],
    ...extra,
  };
}
