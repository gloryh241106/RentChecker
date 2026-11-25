import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createSampleWorkspace } from '../state/sample.js';
import { FakeClauseApi } from '../test-support/fake-clause-api.js';
import { totalOf } from '../test-support/queries.js';
import { RESULTS_ROUTE, renderApp } from '../test-support/render-app.js';

const OUT_OF_DATE = 'Results are out of date. Run the check again.';

/** Every charge has no clause, which differs from the sample evidence. */
function nothingFound(): FakeClauseApi {
  const api = new FakeClauseApi();
  api.answer = ({ items }) => ({
    ok: true,
    value: {
      mode: 'ai',
      warnings: [],
      matches: items.map(({ id }) => ({ itemId: id, state: 'none', quote: null, source: 'ai' })),
    },
  });
  return api;
}

async function openStep(user: UserEvent, name: string): Promise<void> {
  await user.click(screen.getByRole('link', { name }));
}

async function findClauses(user: UserEvent): Promise<void> {
  await openStep(user, 'Lease');
  await user.click(screen.getByRole('button', { name: 'Find clauses' }));
  await user.click(await screen.findByRole('button', { name: 'Continue' }));
  await screen.findAllByText(/AI match/);
  await openStep(user, 'Results');
}

function renderSample() {
  return renderApp({
    route: RESULTS_ROUTE,
    stored: createSampleWorkspace(),
    clauseApi: nothingFound(),
  });
}

describe('Check after a match run (F1-R14)', () => {
  it('runs again by itself when results were shown (T-221)', async () => {
    const { user } = renderSample();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(totalOf('Awaiting proof')).toBe('₹12,000');
    await findClauses(user);
    expect(screen.queryByText(OUT_OF_DATE)).toBeNull();
    expect(totalOf('Awaiting proof')).toBe('₹0');
    expect(totalOf('Ask about')).toBe('₹22,500');
  });

  it('does not run when no results were shown (T-221)', async () => {
    const { user } = renderSample();
    await findClauses(user);
    expect(screen.getByText('You have not run the check yet.')).toBeTruthy();
  });

  it('keeps the old results when the facts are not valid (T-221)', async () => {
    const { user } = renderSample();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    await openStep(user, 'Details');
    await user.clear(screen.getByLabelText('Deposit (required)'));
    await findClauses(user);
    expect(screen.getByText(OUT_OF_DATE)).toBeTruthy();
    expect(totalOf('Awaiting proof')).toBe('₹12,000');
  });
});
