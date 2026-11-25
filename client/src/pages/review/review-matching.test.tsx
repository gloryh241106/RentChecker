import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApiResult } from '../../api/api-error.js';
import type { MatchResponse } from '../../shared.js';
import { FakeClauseApi } from '../../test-support/fake-clause-api.js';
import {
  DEPOSIT_QUOTE,
  apiAnswering,
  renderReview,
  reviewed,
  reviewAnswer,
  rowOf,
  runReview,
  storedWorkspace,
} from '../../test-support/review-case.js';

const FAILED = 'Matching failed. The rows did not change. Try again.';

describe('Before signing matching', () => {
  it('F4-AC4 keyword mode gives Found or Could not confirm and says keyword matching was used', async () => {
    await reviewed(
      reviewAnswer({ 'deposit-amount': { state: 'verified', quote: DEPOSIT_QUOTE } }, 'keyword', [
        'AI_NOT_CONFIGURED',
      ]),
    );
    expect(screen.getByText(/AI matching was not used/)).toBeTruthy();
    expect(screen.getByText('AI matching is not set up on this server.')).toBeTruthy();
    expect(within(rowOf('Deposit amount')).getByText(/Found/)).toBeTruthy();
    expect(
      within(rowOf('Receipts or itemised statement')).getByText(/Could not confirm/),
    ).toBeTruthy();
    expect(screen.queryByText('Not found')).toBeNull();
  });

  it('F4-R2 the end of a run is announced as Review finished.', async () => {
    await reviewed();
    expect(screen.getByRole('status').textContent).toBe('Review finished.');
  });

  it('F2 errors a failed run shows the review wording, keeps the rows and announces Review failed.', async () => {
    const setup = await reviewed(reviewAnswer({ painting: 'none' }));
    setup.clauseApi.answer = () => ({ ok: false, error: { kind: 'network' } });
    await runReview(setup);
    expect(await screen.findByText(FAILED)).toBeTruthy();
    expect(within(rowOf('Painting')).getByText(/Not found/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Review failed.');
  });

  it('F2 errors a rate limit uses the F2 sentence', async () => {
    const setup = renderReview(
      undefined,
      apiAnswering({ ok: false, error: { kind: 'rate_limited' } }),
    );
    await runReview(setup);
    expect(await screen.findByText('Too many checks. Try again in a few minutes.')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('F4-R7 editing the lease text clears every outcome and says to run the review again', async () => {
    const setup = await reviewed(reviewAnswer({ painting: 'none' }));
    await waitFor(() => expect(storedWorkspace(setup.storage).leaseReview).toHaveLength(10));
    await setup.user.type(screen.getByLabelText('Lease text'), ' Added.');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.getByText('The lease text changed. Run the review again.')).toBeTruthy();
    await waitFor(() => expect(storedWorkspace(setup.storage).leaseReview).toEqual([]));
  });

  it('F4-R7 an answer that arrives after the lease text changed is never applied', async () => {
    const api = new FakeClauseApi();
    let release: (result: ApiResult<MatchResponse>) => void = () => undefined;
    api.answer = () => new Promise((resolve) => (release = resolve));
    const setup = renderReview(undefined, api);
    await runReview(setup);
    await setup.user.type(screen.getByLabelText('Lease text'), ' Added.');
    release(reviewAnswer({ painting: 'none' }));
    await waitFor(() => expect(api.signals[0]?.aborted).toBe(true));
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    await waitFor(() => expect(storedWorkspace(setup.storage).leaseReview).toEqual([]));
  });

  it('F4-R7 the text over 40,000 characters stays in the box and counts as empty', async () => {
    const setup = renderReview();
    const box = screen.getByLabelText<HTMLTextAreaElement>('Lease text');
    await setup.user.clear(box);
    await setup.user.click(box);
    await setup.user.paste('x'.repeat(40_001));
    expect(box.value).toHaveLength(40_001);
    expect(screen.getByText(/longer than 40,000 characters/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Run review' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
