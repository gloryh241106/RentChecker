import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Deduction, Workspace } from '../../shared.js';
import { REPAIR, caseWith } from '../../test-support/builders.js';
import { cardOf, totalOf } from '../../test-support/queries.js';
import { RESULTS_ROUTE, renderApp } from '../../test-support/render-app.js';

const PAINTING: Deduction = {
  id: 'd1',
  kind: 'cost',
  label: 'Repainting',
  amountPaise: 2_000_000,
  receiptAmountPaise: 2_000_000,
};

const LEASE = 'The tenant shall pay for repainting the walls on leaving.';

/** One painting charge with a receipt and a clause, so it is Supported. */
function paintingCase(refundPaise: number | undefined, extra: Partial<Workspace> = {}): Workspace {
  return caseWith(
    [PAINTING],
    { statedRefundPaise: refundPaise },
    {
      leaseText: LEASE,
      evidence: [
        { deductionId: 'd1', state: 'verified', quote: 'repainting the walls', source: 'user' },
      ],
      ...extra,
    },
  );
}

async function runCheck(stored: Workspace) {
  const view = renderApp({ route: RESULTS_ROUTE, stored });
  await view.user.click(screen.getByRole('button', { name: 'Run check' }));
  return view;
}

describe('Results step states', () => {
  it('F1-AC4 a stated refund that leaves a gap shows Refund gap on its own line, not in Ask about (T-106, T-157)', async () => {
    await runCheck(paintingCase(700_000));
    expect(totalOf('Refund gap')).toBe('₹3,000');
    expect(totalOf('Ask about')).toBe('₹0');
    expect(totalOf('Consistent')).toBe('₹20,000');
  });

  it.each([
    ['zero', 1_000_000],
    ['negative', 1_200_000],
    ['not entered', undefined],
  ])('D-42 a refund gap that is %s is not shown (T-107, T-108, T-157)', async (_name, refund) => {
    await runCheck(paintingCase(refund));
    expect(screen.queryByText('Refund gap', { selector: 'dt' })).toBeNull();
  });

  it('F1-AC5 deductions above the deposit show the excess in a notice (T-157)', async () => {
    const big: Deduction = { ...PAINTING, amountPaise: 3_500_000, receiptAmountPaise: 3_500_000 };
    await runCheck({ ...paintingCase(undefined), deductions: [big] });
    expect(screen.getByText('The deductions are ₹5,000 more than the deposit.')).toBeTruthy();
  });

  it('F1-AC9 a changed handover date marks results out of date, and Run check clears it (T-158)', async () => {
    const { user } = await runCheck(paintingCase(undefined));
    expect(screen.queryByText('Results are out of date. Run the check again.')).toBeNull();
    await user.click(screen.getByRole('link', { name: 'Details' }));
    const handover = screen.getByLabelText(/^Handover date/);
    await user.clear(handover);
    await user.type(handover, '2026-06-20');
    await user.click(screen.getByRole('link', { name: 'Results' }));
    expect(screen.getByText('Results are out of date. Run the check again.')).toBeTruthy();
    expect(totalOf('Total deducted')).toBe('₹20,000');
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(screen.queryByText('Results are out of date. Run the check again.')).toBeNull();
  });

  it('F1-R14 an override on the results marks them out of date, and Run check shows the new result', async () => {
    const { user } = await runCheck(paintingCase(undefined));
    await user.click(screen.getByRole('button', { name: 'No clause here for Repainting' }));
    expect(screen.getByText('Results are out of date. Run the check again.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(within(cardOf('Repainting')).getByText('Not found in the lease')).toBeTruthy();
  });

  it('F1-AC12 a linked repair is listed with its date, and REPAIR_REPORTED does not change the result', async () => {
    const linked = { ...REPAIR, deductionId: 'd1' };
    await runCheck(paintingCase(undefined, { repairs: [linked] }));
    const card = within(cardOf('Repainting'));
    expect(card.getByText('10 March 2026: Damp wall, reported to Landlord')).toBeTruthy();
    expect(
      card.getByText('You reported a repair on 10 March 2026, on or before handover.'),
    ).toBeTruthy();
    expect(card.getByText('Supported')).toBeTruthy();
  });

  it('F1-R14 the old values stay visible in the out-of-date results', async () => {
    const { user } = await runCheck(paintingCase(undefined));
    await user.click(screen.getByRole('link', { name: 'Lease' }));
    await user.type(screen.getByLabelText('Lease text'), '!');
    await user.click(screen.getByRole('link', { name: 'Results' }));
    expect(totalOf('Consistent')).toBe('₹20,000');
    expect(within(cardOf('Repainting')).getByText('Supported')).toBeTruthy();
  });
});
