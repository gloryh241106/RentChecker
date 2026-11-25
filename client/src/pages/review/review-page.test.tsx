import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { REVIEW_TOPICS } from '../../shared.js';
import { FakeClauseApi } from '../../test-support/fake-clause-api.js';
import {
  DEPOSIT_QUOTE,
  renderReview,
  reviewAnswer,
  rowOf,
  runReview,
} from '../../test-support/review-case.js';

const REFUND_QUESTION = 'By what date will the deposit be refunded after I hand over?';
const PAINTING_QUESTION = 'Who pays for painting, and is it a fixed amount or the actual cost?';

function apiAnswering(...args: Parameters<typeof reviewAnswer>): FakeClauseApi {
  const api = new FakeClauseApi();
  api.answer = () => reviewAnswer(...args);
  return api;
}

describe('Before signing page', () => {
  it('F4-R1 the page has its heading, the empty note, and no rows before a review', () => {
    renderReview('');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Review a lease before you sign' }),
    ).toBeTruthy();
    expect(screen.getByText('Paste the lease to see which deposit topics it covers.')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.queryByText(/A found clause is not a check/)).toBeNull();
  });

  it('F4-AC7 a lease of 49 characters leaves Run review disabled with its reason', () => {
    renderReview('x'.repeat(49));
    const button = screen.getByRole('button', { name: 'Run review' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Paste at least 50 characters of the lease first.')).toBeTruthy();
  });

  it('F4-R2 a lease of 50 characters enables Run review', () => {
    renderReview('x'.repeat(50));
    expect((screen.getByRole('button', { name: 'Run review' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('F4-AC1 a covers answer with a passing quote shows Found and the quote', async () => {
    const setup = renderReview(
      undefined,
      apiAnswering({ 'deposit-amount': { state: 'verified', quote: DEPOSIT_QUOTE } }),
    );
    await runReview(setup);
    const row = within(await waitFor(() => rowOf('Deposit amount')));
    expect(row.getByText(/Found/)).toBeTruthy();
    expect(row.getByText(DEPOSIT_QUOTE)).toBeTruthy();
    expect(row.getByText(/AI match/)).toBeTruthy();
    expect(row.queryByText(/Question to ask/)).toBeNull();
  });

  it('F4-AC2 a none answer for Painting shows Not found and the painting question', async () => {
    const setup = renderReview(undefined, apiAnswering({ painting: 'none' }));
    await runReview(setup);
    const row = within(await waitFor(() => rowOf('Painting')));
    expect(row.getByText(/Not found/)).toBeTruthy();
    expect(row.getByText(PAINTING_QUESTION)).toBeTruthy();
  });

  it('F4-AC3 a failed quote shows Could not confirm, and QUOTE_REJECTED says so', async () => {
    const setup = renderReview(
      undefined,
      apiAnswering({ cleaning: 'unconfirmed' }, 'ai', ['QUOTE_REJECTED']),
    );
    await runReview(setup);
    const row = within(await waitFor(() => rowOf('Cleaning')));
    expect(row.getByText(/Could not confirm/)).toBeTruthy();
    expect(row.getByText('Is cleaning charged when I leave, and how much?')).toBeTruthy();
    expect(screen.getByText(/Those topics show Could not confirm\./)).toBeTruthy();
  });

  it('T-170 F4-R3 a mix gives ten topics in order, and Copy questions copies the other lines', async () => {
    const setup = renderReview(
      undefined,
      apiAnswering({
        'deposit-amount': { state: 'verified', quote: DEPOSIT_QUOTE },
        'refund-deadline': 'none',
        painting: { state: 'excludes', quote: 'shall pay for painting on exit' },
      }),
    );
    await runReview(setup);
    await screen.findByRole('heading', { level: 3, name: 'Deposit amount' });
    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(REVIEW_TOPICS.map(({ name }) => name));
    expect(within(rowOf('Painting')).getByText(/Lease may rule this out/)).toBeTruthy();
    expect(within(rowOf('Painting')).getByText('shall pay for painting on exit')).toBeTruthy();
    expect(within(rowOf('Painting')).getByText(PAINTING_QUESTION)).toBeTruthy();
    expect(within(rowOf('Refund deadline')).getByText(/Not found/)).toBeTruthy();
    expect(screen.getByText('A found clause is not a check that its terms are fair.')).toBeTruthy();
    await setup.user.click(screen.getByRole('button', { name: 'Copy questions' }));
    const lines = (await navigator.clipboard.readText()).split('\n');
    expect(lines).toHaveLength(9);
    expect(lines[0]).toBe(REFUND_QUESTION);
    expect(lines[1]).toBe('How is rent charged if I leave part way through a month?');
    expect(screen.getByRole('status').textContent).toBe('Copied');
    expect(screen.getByLabelText<HTMLTextAreaElement>('Questions to ask').value).toBe(
      lines.join('\n'),
    );
  });

  it('F4-R5 every topic Found replaces the button with the sentence and there is no copy', async () => {
    const found = Object.fromEntries(
      REVIEW_TOPICS.map(({ id }) => [id, { state: 'verified', quote: DEPOSIT_QUOTE }]),
    );
    const setup = renderReview(undefined, apiAnswering(found));
    await runReview(setup);
    expect(
      await screen.findByText('Every topic has a clause. Read each quote to check the terms.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy questions' })).toBeNull();
    expect(screen.queryByLabelText('Questions to ask')).toBeNull();
  });

  it('F4-AC6 Cancel on the notice sends nothing and the rows do not change', async () => {
    const setup = renderReview();
    await setup.user.click(screen.getByRole('button', { name: 'Run review' }));
    expect(await screen.findByText(/each topic/)).toBeTruthy();
    await setup.user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(setup.clauseApi.requests).toHaveLength(0);
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Run review' }));
  });

  it('F4-R1 F4-R2 one request holds the ten topic names, and the notice names the topics', async () => {
    const setup = renderReview();
    await runReview(setup);
    await waitFor(() => expect(setup.clauseApi.requests).toHaveLength(1));
    expect(setup.clauseApi.requests[0]?.items).toEqual(
      REVIEW_TOPICS.map(({ id, name }) => ({ id, label: name })),
    );
  });
});
