import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DEPOSIT_QUOTE,
  reviewed,
  reviewAnswer,
  rowOf,
  runReview,
} from '../../test-support/review-case.js';

describe('Before signing overrides and copy', () => {
  it('F4-R6 a quote found in the lease sets the row to Found, set by you, and Remove override resets it', async () => {
    const setup = await reviewed();
    await setup.user.click(
      screen.getByRole('button', { name: 'Paste a quote for Deposit amount' }),
    );
    await setup.user.type(screen.getByLabelText(/^Quote from the lease/), DEPOSIT_QUOTE);
    await setup.user.click(screen.getByRole('button', { name: 'Use this quote' }));
    expect(within(rowOf('Deposit amount')).getByText(/Set by you/)).toBeTruthy();
    expect(within(rowOf('Deposit amount')).getByText(/Found/)).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Paste a quote for Deposit amount' }),
    );
    await setup.user.click(
      screen.getByRole('button', { name: 'Remove override for Deposit amount' }),
    );
    expect(within(rowOf('Deposit amount')).getByText(/Could not confirm/)).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Paste a quote for Deposit amount' }),
    );
  });

  it('F4-R6 F2-R12 a quote that is not in the lease is refused with the F2 sentence', async () => {
    const setup = await reviewed();
    await setup.user.click(screen.getByRole('button', { name: 'Paste a quote for Cleaning' }));
    await setup.user.type(
      screen.getByLabelText(/^Quote from the lease/),
      'nowhere in the lease text',
    );
    await setup.user.click(screen.getByRole('button', { name: 'Use this quote' }));
    expect(
      screen.getByText('That text was not found in the lease. Paste it exactly as written.'),
    ).toBeTruthy();
    expect(within(rowOf('Cleaning')).getByText(/Could not confirm/)).toBeTruthy();
  });

  it('F2-R14 F4-R6 No clause here wins over a later run', async () => {
    const setup = await reviewed();
    await setup.user.click(screen.getByRole('button', { name: 'No clause here for Painting' }));
    expect(within(rowOf('Painting')).getByText(/Not found/)).toBeTruthy();
    setup.clauseApi.answer = () =>
      reviewAnswer({ painting: { state: 'verified', quote: 'shall pay for painting on exit' } });
    await runReview(setup);
    await waitFor(() => expect(setup.clauseApi.requests).toHaveLength(2));
    expect(within(rowOf('Painting')).getByText(/Not found/)).toBeTruthy();
    expect(within(rowOf('Painting')).getByText(/Set by you/)).toBeTruthy();
  });

  it('T-168 F4-R5 a blocked clipboard selects the questions and shows the copy help', async () => {
    const setup = await reviewed();
    const clipboard = navigator.clipboard;
    const original = clipboard.writeText.bind(clipboard);
    clipboard.writeText = () => Promise.reject(new Error('denied'));
    await setup.user.click(screen.getByRole('button', { name: 'Copy questions' }));
    clipboard.writeText = original;
    expect(screen.getByText('Press Ctrl+C or long-press to copy.')).toBeTruthy();
    const box = screen.getByLabelText<HTMLTextAreaElement>('Questions to ask');
    expect(document.activeElement).toBe(box);
    expect(box.selectionEnd - box.selectionStart).toBe(box.value.length);
  });
});
