import type { Workspace } from '../shared.js';
import { readStoredWorkspace } from '../storage/read-stored.js';
import type { LoadOutcome, WorkspaceStorage, WriteOutcome } from '../storage/workspace-storage.js';

/** A WorkspaceStorage for tests. It counts writes and can be made to fail. */
export class InMemoryWorkspaceStorage implements WorkspaceStorage {
  raw: string | null = null;
  corruptRaw: string | null = null;
  saves = 0;
  isBroken = false;

  constructor(initial?: Workspace) {
    if (initial !== undefined) {
      this.raw = JSON.stringify(initial);
    }
  }

  load(): LoadOutcome {
    if (this.isBroken) {
      return { status: 'unavailable' };
    }
    if (this.raw === null) {
      return { status: 'empty' };
    }
    const outcome = readStoredWorkspace(this.raw);
    if (outcome.status === 'corrupt' || outcome.status === 'version_mismatch') {
      this.corruptRaw = this.raw;
    }
    return outcome;
  }

  save(workspace: Workspace): WriteOutcome {
    if (this.isBroken) {
      return 'failed';
    }
    this.raw = JSON.stringify(workspace);
    this.saves += 1;
    return 'done';
  }

  clear(): WriteOutcome {
    if (this.isBroken) {
      return 'failed';
    }
    this.raw = null;
    this.corruptRaw = null;
    return 'done';
  }
}
