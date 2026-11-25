import type { ClauseMatch, Deduction, Tenancy, Workspace } from '../shared.js';

/** FR-11. `unconfirmed` removes an override (F2-R14). */
export type EvidenceOverride =
  | { readonly state: 'verified'; readonly quote: string }
  | { readonly state: 'none' }
  | { readonly state: 'unconfirmed' };

/** What each action carries, by action type. FRONTEND.md lists them. */
interface ActionPayloads {
  'tenancy/update': { readonly tenancy: Tenancy };
  'lease/set': { readonly text: string };
  /** `repairIds` are the log entries linked to this deduction afterwards (F1-R16). */
  'deduction/add': { readonly deduction: Deduction; readonly repairIds: readonly string[] };
  'deduction/update': { readonly deduction: Deduction; readonly repairIds: readonly string[] };
  'deduction/remove': { readonly id: string };
  'evidence/apply': { readonly matches: readonly ClauseMatch[] };
  'evidence/override': { readonly deductionId: string; readonly override: EvidenceOverride };
  'sample/load': unknown;
  'workspace/replace': { readonly workspace: Workspace };
  'workspace/reset': unknown;
  'draft/set': { readonly text: string };
}

export type ActionType = keyof ActionPayloads;

export type ActionOf<Type extends ActionType> = {
  [Each in Type]: { readonly type: Each } & ActionPayloads[Each];
}[Type];

export type WorkspaceAction = ActionOf<ActionType>;

export type Handler<Type extends ActionType> = (
  state: Workspace,
  action: ActionOf<Type>,
) => Workspace;

/** A table with one entry per action type, so a missing handler does not compile. */
export type HandlersFor<Type extends ActionType> = { [Each in Type]: Handler<Each> };
