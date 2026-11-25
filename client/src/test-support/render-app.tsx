import { cleanup, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach } from 'vitest';
import { App } from '../App.js';
import type { Workspace } from '../shared.js';
import { createSampleWorkspace } from '../state/sample.js';
import { installDialogPolyfill } from './dialog-polyfill.js';
import { InMemoryWorkspaceStorage } from './in-memory-storage.js';

installDialogPolyfill();

// Vitest has no globals here, so Testing Library cannot clean up by itself.
afterEach(cleanup);

interface RenderOptions {
  readonly route?: string;
  /** What is in storage when the app starts. */
  readonly stored?: Workspace;
  readonly storage?: InMemoryWorkspaceStorage;
}

/** The whole app on an in-memory storage, with a user that types like a person. */
export function renderApp({ route = '/', stored, storage }: RenderOptions = {}) {
  const memory = storage ?? new InMemoryWorkspaceStorage(stored);
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <App storage={memory} />
    </MemoryRouter>,
  );
  return { user, storage: memory, ...view };
}

export const RESULTS_ROUTE = '/move-out?step=results';

/** The sample case, already in storage, on the Results step. */
export function renderSampleResults() {
  return renderApp({ route: RESULTS_ROUTE, stored: createSampleWorkspace() });
}
