import { createLocalWorkspaceStorage } from './local-storage.js';
import type { KeyValueStore } from './local-storage.js';
import type { WorkspaceStorage } from './workspace-storage.js';

/** Some browsers throw when `localStorage` is only looked at. This stands in for it. */
const BLOCKED_STORE: KeyValueStore = {
  getItem: () => {
    throw new Error('Storage is blocked');
  },
  setItem: () => {
    throw new Error('Storage is blocked');
  },
  removeItem: () => {
    throw new Error('Storage is blocked');
  },
};

/** The real storage, chosen once at the root of the app (DIP). */
export function createBrowserStorage(): WorkspaceStorage {
  try {
    return createLocalWorkspaceStorage(window.localStorage);
  } catch {
    return createLocalWorkspaceStorage(BLOCKED_STORE);
  }
}
