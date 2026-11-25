import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSampleWorkspace } from '../state/sample.js';
import { FakeClauseApi } from '../test-support/fake-clause-api.js';
import { renderApp } from '../test-support/render-app.js';

const LOADING = 'Finding clauses. This can take up to 30 seconds.';

function render(clauseApi: FakeClauseApi) {
  return renderApp({ route: '/move-out?step=lease', stored: createSampleWorkspace(), clauseApi });
}

type Setup = ReturnType<typeof render>;

async function openNotice({ user }: Setup) {
  await user.click(screen.getByRole('button', { name: 'Find clauses' }));
}

async function continueNotice(setup: Setup) {
  await openNotice(setup);
  await setup.user.click(await screen.findByRole('button', { name: 'Continue' }));
}

describe('Find clauses focus and announcements', () => {
  it('NFR-6 health is not read while no match is possible', () => {
    const clauseApi = new FakeClauseApi();
    renderApp({ route: '/move-out?step=lease', clauseApi });
    expect(clauseApi.healthCalls).toBe(0);
  });

  it('NFR-5 focus goes back to Find clauses on Cancel, and to the status during a run', async () => {
    const api = new FakeClauseApi();
    api.answer = () => ({ ok: false, error: { kind: 'network' } });
    const setup = render(api);
    await openNotice(setup);
    await setup.user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Find clauses' }));
    api.answer = () => new Promise(() => undefined);
    await continueNotice(setup);
    expect(document.activeElement?.textContent).toBe(LOADING);
  });

  it('T-167 a failed run is announced, and Cancel after Try again keeps focus in place', async () => {
    const api = new FakeClauseApi();
    api.answer = () => ({ ok: false, error: { kind: 'network' } });
    const setup = render(api);
    await continueNotice(setup);
    const again = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByRole('status').textContent).toBe('Clause matching failed.');
    await setup.user.click(again);
    await setup.user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Find clauses' }));
  });
});
