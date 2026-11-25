import { cleanup, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach } from 'vitest';
import { App } from '../App.js';
import type { Workspace } from '../shared.js';
import { createSampleWorkspace } from '../state/sample.js';
import { installDialogPolyfill } from './dialog-polyfill.js';
import { FakeAssistantApi } from './fake-assistant-api.js';
import { FakeClauseApi } from './fake-clause-api.js';
import { InMemoryWorkspaceStorage } from './in-memory-storage.js';

installDialogPolyfill();

// Vitest has no globals here, so Testing Library cannot clean up by itself.
afterEach(cleanup);

interface RenderOptions {
  readonly route?: string;
  /** What is in storage when the app starts. */
  readonly stored?: Workspace;
  readonly storage?: InMemoryWorkspaceStorage;
  readonly clauseApi?: FakeClauseApi;
  readonly assistantApi?: FakeAssistantApi;
}

/** The whole app on an in-memory storage, with a user that types like a person. */
export function renderApp(options: RenderOptions = {}) {
  const { route = '/', stored, storage, clauseApi } = options;
  const assistantApi = options.assistantApi ?? new FakeAssistantApi();
  const api = clauseApi ?? new FakeClauseApi();
  const memory = storage ?? new InMemoryWorkspaceStorage(stored);
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <App storage={memory} clauseApi={api} assistantApi={assistantApi} />
    </MemoryRouter>,
  );
  return { user, storage: memory, clauseApi: api, assistantApi, ...view };
}

export const RESULTS_ROUTE = '/move-out?step=results';

/** The sample case, already in storage, on the Results step. */
export function renderSampleResults() {
  return renderApp({ route: RESULTS_ROUTE, stored: createSampleWorkspace() });
}
