import type { HandlersFor } from '../actions.js';
import { EMPTY_WORKSPACE } from '../empty-workspace.js';
import { createSampleWorkspace } from '../sample.js';

export const workspaceHandlers: HandlersFor<
  'sample/load' | 'workspace/replace' | 'workspace/reset'
> = {
  'sample/load': () => createSampleWorkspace(),
  'workspace/replace': (_state, { workspace }) => workspace,
  'workspace/reset': () => EMPTY_WORKSPACE,
};
