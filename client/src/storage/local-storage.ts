import type { Workspace } from '../shared.js';
import { readStoredWorkspace } from './read-stored.js';
import { CORRUPT_KEY, STORAGE_KEY } from './workspace-storage.js';
import type { LoadOutcome, WorkspaceStorage, WriteOutcome } from './workspace-storage.js';

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** A bad value is kept so it can be recovered. If even that fails, the app still starts empty. */
function keepCopy(store: KeyValueStore, raw: string): void {
  try {
    store.setItem(CORRUPT_KEY, raw);
  } catch {
    // A storage that refuses writes cannot keep a copy either.
  }
}

/** The WorkspaceStorage that uses the browser's local storage. */
export function createLocalWorkspaceStorage(store: KeyValueStore): WorkspaceStorage {
  return {
    load(): LoadOutcome {
      let raw: string | null;
      try {
        raw = store.getItem(STORAGE_KEY);
      } catch {
        return { status: 'unavailable' };
      }
      if (raw === null) {
        return { status: 'empty' };
      }
      const outcome = readStoredWorkspace(raw);
      if (outcome.status === 'corrupt' || outcome.status === 'version_mismatch') {
        keepCopy(store, raw);
      }
      return outcome;
    },
    save(workspace: Workspace): WriteOutcome {
      try {
        store.setItem(STORAGE_KEY, JSON.stringify(workspace));
        return 'done';
      } catch {
        return 'failed'; // Quota or blocked storage.
      }
    },
    clear(): WriteOutcome {
      try {
        store.removeItem(STORAGE_KEY);
        store.removeItem(CORRUPT_KEY);
        return 'done';
      } catch {
        return 'failed';
      }
    },
  };
}
