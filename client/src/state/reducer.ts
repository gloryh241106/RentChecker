import { workspaceSchema } from '../shared.js';
import type { Workspace } from '../shared.js';
import type { ActionOf, ActionType, Handler, HandlersFor, WorkspaceAction } from './actions.js';
import { billHandlers } from './handlers/bill.js';
import { deductionHandlers } from './handlers/deduction.js';
import { draftHandlers } from './handlers/draft.js';
import { evidenceHandlers } from './handlers/evidence.js';
import { leaseHandlers } from './handlers/lease.js';
import { repairHandlers } from './handlers/repair.js';
import { reviewHandlers } from './handlers/review.js';
import { tenancyHandlers } from './handlers/tenancy.js';
import { workspaceHandlers } from './handlers/workspace.js';

const HANDLERS: HandlersFor<ActionType> = {
  ...tenancyHandlers,
  ...leaseHandlers,
  ...deductionHandlers,
  ...evidenceHandlers,
  ...reviewHandlers,
  ...workspaceHandlers,
  ...draftHandlers,
  ...repairHandlers,
  ...billHandlers,
};

function apply<Type extends ActionType>(state: Workspace, action: ActionOf<Type>): Workspace {
  const handler: Handler<Type> = HANDLERS[action.type];
  return handler(state, action);
}

/** Pure. A change that would break the workspace schema is dropped, so what is stored is valid. */
export function workspaceReducer(state: Workspace, action: WorkspaceAction): Workspace {
  const next = apply(state, action);
  return next === state || workspaceSchema.safeParse(next).success ? next : state;
}
