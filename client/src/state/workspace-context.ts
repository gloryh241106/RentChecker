import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { Persistence } from '../hooks/use-persistence.js';
import type { Workspace } from '../shared.js';
import type { WorkspaceAction } from './actions.js';

export interface WorkspaceContextValue extends Persistence {
  readonly workspace: Workspace;
  readonly dispatch: Dispatch<WorkspaceAction>;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** The workspace, its dispatch and the state of its storage. */
export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (value === null) {
    throw new Error('useWorkspace needs a WorkspaceProvider');
  }
  return value;
}
