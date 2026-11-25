import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApiError, ApiResult } from '../api/api-error.js';
import type { MatchResponse, MatchWarning, Workspace } from '../shared.js';
import { createSampleWorkspace } from '../state/sample.js';
import { FakeClauseApi } from '../test-support/fake-clause-api.js';
import { renderApp } from '../test-support/render-app.js';
import { CONSENT_AI_OFF, CONSENT_AI_ON, ERROR_TEXT, WARNING_TEXT } from './match-text.js';

const LEASE_ROUTE = '/move-out?step=lease';
const QUOTE = 'pay for repainting the walls on leaving';
const LOADING = 'Finding clauses. This can take up to 30 seconds.';

/** The sample case, with no evidence yet. */
function unmatched(): Workspace {
  return { ...createSampleWorkspace(), evidence: [], isSample: false };
}

function answer(
  mode: MatchResponse['mode'],
  warnings: readonly MatchWarning[] = [],
): ApiResult<MatchResponse> {
  const source = mode;
  return {
    ok: true,
    value: {
      mode,
      warnings: [...warnings],
      matches: [
        { itemId: 'sample-painting', state: 'verified', quote: QUOTE, source },
        { itemId: 'sample-fee', state: 'none', quote: null, source },
      ],
    },
  };
}

function render(clauseApi = new FakeClauseApi()) {
  return renderApp({ route: LEASE_ROUTE, stored: unmatched(), clauseApi });
}

type Setup = ReturnType<typeof render>;

async function findClauses({ user }: Setup) {
  await user.click(screen.getByRole('button', { name: 'Find clauses' }));
}

async function continueNotice(setup: Setup) {
  await findClauses(setup);
  await setup.user.click(await screen.findByRole('button', { name: 'Continue' }));
}

function panelOf(label: string): HTMLElement {
  const panel = screen.getByRole('heading', { level: 3, name: label }).closest('li');
  if (panel === null) {
    throw new Error(`No panel for ${label}`);
  }
  return panel;
}

describe('Find clauses', () => {
  it('T-161 Cancel sends nothing', async () => {
    const setup = render();
    await findClauses(setup);
    await setup.user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(setup.clauseApi.requests).toHaveLength(0);
  });

  it('T-161 Continue sends one request', async () => {
    const setup = render();
    await continueNotice(setup);
    await waitFor(() => expect(setup.clauseApi.requests).toHaveLength(1));
  });

  it('T-161 the AI-on notice is shown when health says AI is configured', async () => {
    const setup = render();
    await findClauses(setup);
    expect(await screen.findByText(CONSENT_AI_ON)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Before we send your lease' })).toBeTruthy();
  });

  it('T-161 the keyword-only notice is shown when AI is not configured', async () => {
    const api = new FakeClauseApi();
    api.setAiConfigured(false);
    const setup = render(api);
    await waitFor(() => expect(api.healthCalls).toBe(1));
    await findClauses(setup);
    expect(await screen.findByText(CONSENT_AI_OFF)).toBeTruthy();
    expect(screen.queryByText(CONSENT_AI_ON)).toBeNull();
  });

  it('F2-R3 the stricter AI-on notice is used when health cannot be read', async () => {
    const api = new FakeClauseApi();
    api.health = { ok: false, error: { kind: 'network' } };
    const setup = render(api);
    await waitFor(() => expect(api.healthCalls).toBe(1));
    await findClauses(setup);
    expect(await screen.findByText(CONSENT_AI_ON)).toBeTruthy();
  });

  it('T-162 only the non-rent labels are sent', async () => {
    const setup = render();
    await continueNotice(setup);
    await waitFor(() => expect(setup.clauseApi.requests).toHaveLength(1));
    expect(setup.clauseApi.requests[0]?.items.map(({ label }) => label)).toEqual([
      'Repainting',
      'Service fee',
    ]);
  });

  it('T-163 a quote is shown for verified and not for none, and the end is announced', async () => {
    const api = new FakeClauseApi();
    api.answer = () => answer('ai');
    const setup = render(api);
    await continueNotice(setup);
    await waitFor(() => expect(within(panelOf('Repainting')).getByText(QUOTE)).toBeTruthy());
    expect(within(panelOf('Repainting')).getByText(/AI match/)).toBeTruthy();
    expect(within(panelOf('Service fee')).queryByRole('blockquote')).toBeNull();
    expect(within(panelOf('Service fee')).getByText(/No clause found/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Clause matching finished.');
  });

  it.each(['AI_NOT_CONFIGURED', 'AI_UNAVAILABLE', 'AI_TIMEOUT'] as const)(
    'T-164 %s in keyword mode shows the keyword notice and its reason',
    async (warning) => {
      const api = new FakeClauseApi();
      api.answer = () => answer('keyword', [warning]);
      const setup = render(api);
      await continueNotice(setup);
      expect(await screen.findByText(/AI matching was not used/)).toBeTruthy();
      expect(screen.getByText(WARNING_TEXT[warning])).toBeTruthy();
      expect(within(panelOf('Repainting')).getByText(QUOTE)).toBeTruthy();
    },
  );

  it('T-164 QUOTE_REJECTED in AI mode shows only the quote notice', async () => {
    const api = new FakeClauseApi();
    api.answer = () => answer('ai', ['QUOTE_REJECTED']);
    const setup = render(api);
    await continueNotice(setup);
    expect(await screen.findByText(WARNING_TEXT.QUOTE_REJECTED)).toBeTruthy();
    expect(screen.queryByText(/AI matching was not used/)).toBeNull();
  });

  it.each<[string, ApiError]>([
    ['validation', { kind: 'validation', fields: [] }],
    ['too_large', { kind: 'too_large' }],
    ['rate_limited', { kind: 'rate_limited' }],
    ['server', { kind: 'server' }],
    ['network', { kind: 'network' }],
    ['bad_response', { kind: 'bad_response' }],
  ])('T-167 the %s error shows its message with no retry and no change', async (_n, error) => {
    const api = new FakeClauseApi();
    api.answer = () => ({ ok: false, error });
    const setup = render(api);
    await continueNotice(setup);
    expect(await screen.findByText(ERROR_TEXT[error.kind])).toBeTruthy();
    expect(api.requests).toHaveLength(1);
    expect(within(panelOf('Repainting')).queryByText(QUOTE)).toBeNull();
    expect(screen.getByRole('button', { name: 'Run check' }).hasAttribute('disabled')).toBe(false);
  });

  it('T-167 Try again asks for consent again before it sends', async () => {
    const api = new FakeClauseApi();
    api.answer = () => ({ ok: false, error: { kind: 'network' } });
    const setup = render(api);
    await continueNotice(setup);
    await setup.user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(api.requests).toHaveLength(1);
    await setup.user.click(await screen.findByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(api.requests).toHaveLength(2));
  });

  it('F2-R1 the button is disabled with its reasons while the lease is short', () => {
    renderApp({ route: LEASE_ROUTE });
    expect(screen.getByRole('button', { name: 'Find clauses' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(
      screen.getByText(
        'Paste at least 50 characters of the lease first. Add a deduction other than rent first.',
      ),
    ).toBeTruthy();
  });

  it('F2-R2 the button is disabled and the loading text shows during a run', async () => {
    const api = new FakeClauseApi();
    api.answer = () => new Promise(() => undefined);
    const setup = render(api);
    await continueNotice(setup);
    expect(await screen.findByText(LOADING)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Find clauses' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: 'Run check' }).hasAttribute('disabled')).toBe(false);
  });

  it('F2-R9 editing the lease during a run drops the late answer', async () => {
    const api = new FakeClauseApi();
    let release: (result: ApiResult<MatchResponse>) => void = () => undefined;
    api.answer = () => new Promise((resolve) => (release = resolve));
    const setup = render(api);
    await continueNotice(setup);
    await screen.findByText(LOADING);
    await setup.user.type(screen.getByLabelText('Lease text'), ' More.');
    release(answer('ai'));
    await waitFor(() => expect(screen.queryByText(LOADING)).toBeNull());
    expect(screen.queryByText(QUOTE)).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });
});
