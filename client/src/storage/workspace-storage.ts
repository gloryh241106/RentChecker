import type { Workspace } from '../shared.js';

/** DATA_MODEL.md. The workspace JSON, and the raw text of an unreadable value. */
export const STORAGE_KEY = 'rentchecker:v1';
export const CORRUPT_KEY = 'rentchecker:v1:corrupt';

/** FRONTEND.md: the five outcomes of reading the stored workspace. */
export type LoadOutcome =
  | { readonly status: 'empty' }
  | { readonly status: 'ok'; readonly workspace: Workspace }
  | { readonly status: 'corrupt' }
  | { readonly status: 'version_mismatch' }
  | { readonly status: 'unavailable' };

/** `failed` covers a full quota and storage that throws. */
export type WriteOutcome = 'done' | 'failed';

/** What the app needs from a place to keep the workspace. */
export interface WorkspaceStorage {
  load(): LoadOutcome;
  save(workspace: Workspace): WriteOutcome;
  /** FR-6: removes the workspace and the kept corrupt copy. */
  clear(): WriteOutcome;
}
