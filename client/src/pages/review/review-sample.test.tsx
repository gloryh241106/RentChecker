import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SAMPLE_REVIEW_LEASE } from '../../state/sample-lease.js';
import { renderReview } from '../../test-support/review-case.js';

const USE_SAMPLE = { name: 'Use a sample lease' };

describe('Sample lease (F4-R9)', () => {
  it('fills the box, moves focus to it and sends nothing (T-222)', async () => {
    const { user, clauseApi } = renderReview('');
    await user.click(screen.getByRole('button', USE_SAMPLE));
    const box = screen.getByLabelText<HTMLTextAreaElement>('Lease text');
    expect(box.value).toBe(SAMPLE_REVIEW_LEASE);
    expect(document.activeElement).toBe(box);
    expect(clauseApi.requests).toHaveLength(0);
    expect(screen.queryByRole('button', USE_SAMPLE)).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Sample lease added.');
  });

  it('is not offered over a lease that was typed (T-222)', () => {
    renderReview('My own lease');
    expect(screen.queryByRole('button', USE_SAMPLE)).toBeNull();
  });
});
