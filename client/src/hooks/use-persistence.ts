import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workspace } from '../shared.js';
import { EMPTY_WORKSPACE } from '../state/empty-workspace.js';
import type { LoadOutcome, WorkspaceStorage } from '../storage/workspace-storage.js';

/** Saves wait this long after the last change (FRONTEND.md: debounced). */
export const SAVE_DELAY_MS = 500;

/** Which UI.md notice applies. */
export type StorageNotice = 'unavailable' | 'corrupt' | 'version_mismatch';

export interface Persistence {
  readonly notice: StorageNotice | null;
  /** FR-6. Removes everything stored. False when the browser refuses. */
  readonly clearStorage: () => boolean;
}

function noticeOf(outcome: LoadOutcome['status']): StorageNotice | null {
  return outcome === 'unavailable' || outcome === 'corrupt' || outcome === 'version_mismatch'
    ? outcome
    : null;
}

/**
 * Saves the workspace after changes. Nothing is written for the workspace that was loaded or for
 * the empty one, so a bad stored value is not overwritten by opening the page (FRONTEND.md).
 */
export function usePersistence(
  storage: WorkspaceStorage,
  workspace: Workspace,
  loaded: { readonly workspace: Workspace; readonly status: LoadOutcome['status'] },
): Persistence {
  const [loadNotice, setLoadNotice] = useState(noticeOf(loaded.status));
  const [saveFailed, setSaveFailed] = useState(false);
  const pending = useRef<Workspace | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    pending.current = null;
    if (next !== null) {
      setSaveFailed(storage.save(next) === 'failed');
    }
  }, [storage]);

  useEffect(() => {
    if (workspace === loaded.workspace || workspace === EMPTY_WORKSPACE) {
      return;
    }
    pending.current = workspace;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [workspace, loaded.workspace, flush]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  const clearStorage = useCallback(() => {
    window.clearTimeout(timer.current);
    pending.current = null;
    const isCleared = storage.clear() === 'done';
    if (isCleared) {
      setLoadNotice(null);
      setSaveFailed(false);
    }
    return isCleared;
  }, [storage]);

  return { notice: saveFailed ? 'unavailable' : loadNotice, clearStorage };
}
