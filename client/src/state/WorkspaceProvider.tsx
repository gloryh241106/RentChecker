import { useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { usePersistence } from '../hooks/use-persistence.js';
import type { WorkspaceStorage } from '../storage/workspace-storage.js';
import { EMPTY_WORKSPACE } from './empty-workspace.js';
import { workspaceReducer } from './reducer.js';
import { WorkspaceContext } from './workspace-context.js';

interface WorkspaceProviderProps {
  readonly storage: WorkspaceStorage;
  readonly children: ReactNode;
}

/** Reads the stored workspace once, then keeps it in a reducer and saves changes. */
export function WorkspaceProvider({ storage, children }: WorkspaceProviderProps) {
  const [loaded] = useState(() => {
    const outcome = storage.load();
    return {
      status: outcome.status,
      workspace: outcome.status === 'ok' ? outcome.workspace : EMPTY_WORKSPACE,
    };
  });
  const [workspace, dispatch] = useReducer(workspaceReducer, loaded.workspace);
  const { notice, clearStorage } = usePersistence(storage, workspace, loaded);
  const value = useMemo(
    () => ({ workspace, dispatch, notice, clearStorage }),
    [workspace, notice, clearStorage],
  );
  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}
