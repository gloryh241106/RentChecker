import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { REVIEW_TOPICS } from '../../shared.js';
import { FakeClauseApi } from '../../test-support/fake-clause-api.js';
import {
  REVIEW_LEASE,
  renderReview,
  reviewAnswer,
  runReview,
  storedWorkspace,
} from '../../test-support/review-case.js';

function render() {
  const api = new FakeClauseApi();
  api.answer = () => reviewAnswer({ painting: 'none' });
  return renderReview(undefined, api);
}

describe('Before signing storage', () => {
  it('F4-R7 the lease text and the ten outcomes are kept in local storage', async () => {
    const setup = render();
    await runReview(setup);
    await waitFor(() => expect(storedWorkspace(setup.storage).leaseReview).toHaveLength(10));
    const stored = storedWorkspace(setup.storage);
    expect(stored.reviewLeaseText).toBe(REVIEW_LEASE);
    expect(stored.leaseReview.map(({ topicId }) => topicId)).toEqual(
      REVIEW_TOPICS.map(({ id }) => id),
    );
    expect(stored.leaseText).toBe('');
  });

  it('F4-R7 Delete everything removes the review text and the outcomes', async () => {
    const setup = render();
    await runReview(setup);
    await screen.findByRole('heading', { level: 3, name: 'Painting' });
    await setup.user.click(screen.getByRole('button', { name: 'Delete everything' }));
    await setup.user.click(
      screen.getAllByRole('button', { name: 'Delete everything' }).at(-1) ?? document.body,
    );
    await waitFor(() => expect(setup.storage.raw).toBeNull());
    expect(setup.storage.load()).toEqual({ status: 'empty' });
  });
});
