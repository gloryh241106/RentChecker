import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClauseMatch, EvidenceState } from '../../shared.js';
import { createSampleWorkspace, SAMPLE_DEPOSIT_SENTENCE } from '../../state/sample.js';
import { expectNoAxeViolations } from '../../test-support/axe.js';
import { FakeClauseApi } from '../../test-support/fake-clause-api.js';
import { renderApp } from '../../test-support/render-app.js';
import { ASK_WORDING } from './ask-text.js';

function matchOf(itemId: string, state: EvidenceState): ClauseMatch {
  return state === 'verified' || state === 'excludes'
    ? { itemId, state, quote: SAMPLE_DEPOSIT_SENTENCE, source: 'ai' }
    : { itemId, state, quote: null, source: 'ai' };
}

/** One state for each request in turn, then `verified`. */
function apiAnswering(...states: readonly EvidenceState[]): FakeClauseApi {
  const api = new FakeClauseApi();
  api.answer = ({ items }) => {
    const state = states[api.requests.length - 1] ?? 'verified';
    const matches = items.map(({ id }) => matchOf(id, state));
    return { ok: true, value: { mode: 'ai', warnings: [], matches } };
  };
  return api;
}

function renderAsk(clauseApi = apiAnswering(), stored = createSampleWorkspace()) {
  return renderApp({ route: '/ask', stored, clauseApi });
}

async function type(user: UserEvent, question: string): Promise<void> {
  const box = screen.getByLabelText('Your question');
  await user.clear(box);
  await user.type(box, `${question}{Enter}`);
}

async function agree(user: UserEvent): Promise<void> {
  await user.click(await screen.findByRole('button', { name: 'Continue' }));
}

describe('Ask your lease', () => {
  it('F7-AC1 shows the question with the sentence of the lease (T-223)', async () => {
    const { user, clauseApi } = renderAsk();
    await type(user, 'When do I get my deposit?');
    await agree(user);
    expect(
      await screen.findByRole('heading', { level: 3, name: 'When do I get my deposit?' }),
    ).toBeTruthy();
    expect(screen.getByText(/The lease says:/)).toBeTruthy();
    expect(screen.getByText(SAMPLE_DEPOSIT_SENTENCE, { selector: 'blockquote' })).toBeTruthy();
    expect(clauseApi.requests[0]?.items).toEqual([
      { id: 'question', label: 'When do I get my deposit?' },
    ]);
    await expectNoAxeViolations();
  });

  it('F7-AC2 asks for consent once, and Cancel sends nothing (T-224)', async () => {
    const { user, clauseApi } = renderAsk();
    await type(user, 'First?');
    expect(await screen.findByText(ASK_WORDING.consentAiOn)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(clauseApi.requests).toHaveLength(0);
    await type(user, 'First?');
    await agree(user);
    await screen.findByRole('heading', { level: 3, name: 'First?' });
    await type(user, 'Second?');
    await screen.findByRole('heading', { level: 3, name: 'Second?' });
    expect(clauseApi.requests).toHaveLength(2);
  });

  it('F7-AC3 says when there is no answer, and copies those questions oldest first (T-225)', async () => {
    const { user } = renderAsk(apiAnswering('none', 'unconfirmed', 'excludes'));
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await type(user, 'One?');
    await agree(user);
    expect(
      await screen.findByText('No clause about this was found in the lease you pasted.'),
    ).toBeTruthy();
    await type(user, 'Two?');
    expect(await screen.findByText('An answer could not be confirmed.')).toBeTruthy();
    await type(user, 'Three?');
    await screen.findByRole('heading', { level: 3, name: 'Three?' });
    await user.click(screen.getByRole('button', { name: 'Copy questions' }));
    expect(write).toHaveBeenCalledWith('One?\nTwo?');
  });

  it('F7-AC4 a suggested question is asked with one press and then goes (T-226)', async () => {
    const { user } = renderAsk();
    const name = 'Can the landlord charge me for Repainting?';
    await user.click(screen.getByRole('button', { name }));
    await agree(user);
    expect(await screen.findByRole('heading', { level: 3, name })).toBeTruthy();
    expect(screen.queryByRole('button', { name })).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('Your question'));
  });

  it('F7-AC5 a changed lease drops the answers and asks for consent again (T-227)', async () => {
    const { user } = renderAsk();
    await type(user, 'First?');
    await agree(user);
    await screen.findByRole('heading', { level: 3, name: 'First?' });
    await user.type(screen.getByLabelText('Lease text'), ' More.');
    expect(screen.queryByRole('heading', { level: 3, name: 'First?' })).toBeNull();
    await type(user, 'Again?');
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeTruthy();
  });

  it('F7-AC6 an empty or long question is rejected next to the field (T-228)', async () => {
    const { user, clauseApi } = renderAsk();
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByText('Enter the question.')).toBeTruthy();
    await type(user, 'x'.repeat(121));
    expect(screen.getByText('Use at most 120 characters.')).toBeTruthy();
    expect(clauseApi.requests).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('F7-R1 asking is disabled without a lease, and says why (T-228)', async () => {
    const { user } = renderApp({ route: '/ask' });
    expect(screen.getByRole('button', { name: 'Ask' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Paste at least 50 characters of the lease first.')).toBeTruthy();
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'Use a sample lease' }));
    expect(screen.getByRole('button', { name: 'Ask' }).hasAttribute('disabled')).toBe(false);
  });

  it('F7-R9 a failed question can be tried again and keeps the answers (T-229)', async () => {
    const api = apiAnswering();
    const answer = api.answer;
    const { user } = renderAsk(api);
    await type(user, 'First?');
    await agree(user);
    await screen.findByRole('heading', { level: 3, name: 'First?' });
    api.answer = () => ({ ok: false, error: { kind: 'network' } });
    await type(user, 'Second?');
    await screen.findByText('The question could not be answered. Try again.');
    expect(screen.getByRole('heading', { level: 3, name: 'First?' })).toBeTruthy();
    api.answer = answer;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Second?' })).toBeTruthy();
  });

  it('F7-R9 a running question blocks another one, and leaving the page drops it (T-229)', async () => {
    const api = new FakeClauseApi();
    api.answer = () => new Promise(() => undefined);
    const { user } = renderAsk(api);
    await type(user, 'Slow?');
    await agree(user);
    await waitFor(() => expect(api.requests).toHaveLength(1));
    await type(user, 'Next?');
    expect(api.requests).toHaveLength(1);
    await user.click(screen.getByRole('link', { name: 'Moving out' }));
    expect(api.signals[0]?.aborted).toBe(true);
  });

  it('F7-R9 keyword mode says so (T-229)', async () => {
    const { user } = renderAsk(new FakeClauseApi());
    await type(user, 'Anything?');
    await agree(user);
    expect(await screen.findByText(ASK_WORDING.keywordNotice)).toBeTruthy();
  });
});
