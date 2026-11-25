import { screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import { FakeClauseApi } from '../../test-support/fake-clause-api.js';
import { expectNoAxeViolations } from '../../test-support/axe.js';
import {
  DEPOSIT_QUOTE,
  renderReview,
  reviewAnswer,
  runReview,
} from '../../test-support/review-case.js';

describe('automated accessibility check on Before signing (T-173)', () => {
  it('T-173 empty', async () => {
    renderReview('');
    await expectNoAxeViolations();
  });

  it('T-173 ten rows with outcomes, quotes and the questions box', async () => {
    const api = new FakeClauseApi();
    api.answer = () =>
      reviewAnswer({
        'deposit-amount': { state: 'verified', quote: DEPOSIT_QUOTE },
        painting: { state: 'excludes', quote: 'shall pay for painting on exit' },
        cleaning: 'none',
      });
    const setup = renderReview(undefined, api);
    await runReview(setup);
    await screen.findByRole('heading', { level: 3, name: 'Painting' });
    await expectNoAxeViolations();
    await setup.user.click(screen.getByRole('button', { name: 'Paste a quote for Cleaning' }));
    await expectNoAxeViolations();
  });

  it('T-173 the consent notice and the keyword notice', async () => {
    const api = new FakeClauseApi();
    api.answer = () => reviewAnswer({}, 'keyword', ['AI_UNAVAILABLE']);
    const setup = renderReview(undefined, api);
    await setup.user.click(screen.getByRole('button', { name: 'Run review' }));
    await screen.findByRole('button', { name: 'Continue' });
    await expectNoAxeViolations();
    await setup.user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/AI matching was not used/);
    await expectNoAxeViolations();
  });

  it('T-173 the error state with Try again, and the lease over the limit', async () => {
    const api = new FakeClauseApi();
    api.answer = () => ({ ok: false, error: { kind: 'network' } });
    const setup = renderReview(undefined, api);
    await runReview(setup);
    await screen.findByRole('button', { name: 'Try again' });
    await expectNoAxeViolations();
    const box = screen.getByLabelText('Lease text');
    await setup.user.clear(box);
    await setup.user.click(box);
    await setup.user.paste('x'.repeat(40_001));
    await expectNoAxeViolations();
  });
});
