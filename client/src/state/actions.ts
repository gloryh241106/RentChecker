import type { BillCheck, ClauseMatch, Deduction, Repair, Tenancy, Workspace } from '../shared.js';

/** FR-11. `unconfirmed` removes an override (F2-R14). */
export type EvidenceOverride =
  | { readonly state: 'verified'; readonly quote: string }
  | { readonly state: 'none' }
  | { readonly state: 'unconfirmed' };

/** A log entry as typed. The link to a deduction is made from the deduction side (F1-R16). */
export type RepairFields = Omit<Repair, 'deductionId'>;

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
  /** F4-R7. A changed text clears every topic outcome. */
  'review/set': { readonly text: string };
  'review/apply': { readonly matches: readonly ClauseMatch[] };
  'review/override': { readonly topicId: string; readonly override: EvidenceOverride };
  'sample/load': unknown;
  'workspace/replace': { readonly workspace: Workspace };
  'workspace/reset': unknown;
  'repair/add': { readonly repair: RepairFields };
  /** Keeps the link of the entry (F5-R6). */
  'repair/update': { readonly repair: RepairFields };
  /** Removes the entry, and with it its link (F5-R7). */
  'repair/remove': { readonly id: string };
  'bill/set': { readonly bill: BillCheck };
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
