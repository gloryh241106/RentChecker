import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cardOf } from '../../test-support/queries.js';
import { renderApp, renderSampleResults } from '../../test-support/render-app.js';
import { createSampleWorkspace } from '../../state/sample.js';

const LEASE_ROUTE = '/move-out?step=lease';

function panelOf(label: string): HTMLElement {
  const panel = screen.getByRole('heading', { level: 3, name: label }).closest('li');
  if (panel === null) {
    throw new Error(`No panel for ${label}`);
  }
  return panel;
}

function leaseRender() {
  return renderApp({ route: LEASE_ROUTE, stored: createSampleWorkspace() });
}

describe('Lease step', () => {
  it('F1-R15 the empty state, the count and the hint are shown', () => {
    renderApp({ route: LEASE_ROUTE });
    expect(screen.getByText('0 of 40,000')).toBeTruthy();
    expect(
      screen.getByText('No lease pasted. Charges that need a clause will show Unclear.'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Paste the whole lease. A missing page can cause a wrong Not found in the lease.',
      ),
    ).toBeTruthy();
  });

  it('F1-R15 typing in the lease updates the count', async () => {
    const { user } = renderApp({ route: LEASE_ROUTE });
    await user.type(screen.getByLabelText('Lease text'), 'Rent is due.');
    expect(screen.getByText('12 of 40,000')).toBeTruthy();
  });

  it('F1-R17 evidence is shown in words with its source tag and quote, rent has none', () => {
    leaseRender();
    const painting = within(panelOf('Repainting'));
    expect(painting.getByText(/Clause found/)).toBeTruthy();
    expect(painting.getByText(/Sample match/)).toBeTruthy();
    expect(painting.getByText(/repainting the walls on leaving/)).toBeTruthy();
    expect(within(panelOf('Service fee')).getByText(/No clause found/)).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 3, name: 'June rent' })).toBeNull();
  });

  it('T-165 a quote found in the lease is kept and tagged Set by you', async () => {
    const { user } = leaseRender();
    await user.click(screen.getByRole('button', { name: 'Paste a quote for Service fee' }));
    await user.type(
      screen.getByLabelText(/^Quote from the lease/),
      'the deposit of Rs 30,000 is refunded',
    );
    await user.click(screen.getByRole('button', { name: 'Use this quote' }));
    const fee = within(panelOf('Service fee'));
    expect(fee.getByText(/Clause found/)).toBeTruthy();
    expect(fee.getByText(/Set by you/)).toBeTruthy();
  });

  it('T-165 a quote that is not in the lease is refused with the fixed message and nothing changes', async () => {
    const { user } = leaseRender();
    await user.click(screen.getByRole('button', { name: 'Paste a quote for Service fee' }));
    const box = screen.getByLabelText(/^Quote from the lease/);
    await user.type(box, 'This sentence is nowhere in the lease');
    await user.click(screen.getByRole('button', { name: 'Use this quote' }));
    expect(
      screen.getByText('That text was not found in the lease. Paste it exactly as written.'),
    ).toBeTruthy();
    expect(box.getAttribute('aria-invalid')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(within(panelOf('Service fee')).getByText(/No clause found/)).toBeTruthy();
  });

  it('T-165 No clause here sets none, and Remove override returns the item to not confirmed', async () => {
    const { user } = leaseRender();
    await user.click(screen.getByRole('button', { name: 'No clause here for Repainting' }));
    const painting = within(panelOf('Repainting'));
    expect(painting.getByText(/No clause found/)).toBeTruthy();
    expect(painting.getByText(/Set by you/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Remove override for Repainting' }));
    expect(within(panelOf('Repainting')).getByText(/Not confirmed/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove override for Repainting' })).toBeNull();
  });

  it('T-166 changing the lease text resets every state, and the next check shows Repainting as Unclear (F1-AC10)', async () => {
    const { user } = leaseRender();
    await user.type(screen.getByLabelText('Lease text'), ' ');
    expect(within(panelOf('Repainting')).getByText(/Not confirmed/)).toBeTruthy();
    expect(within(panelOf('Service fee')).getByText(/Not confirmed/)).toBeTruthy();
    expect(screen.getByText('The lease text changed. Find clauses again.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(within(cardOf('Repainting')).getByText('Unclear')).toBeTruthy();
  });

  it('T-166 changing one label resets only that deduction', async () => {
    const { user } = renderApp({
      route: '/move-out?step=deductions',
      stored: createSampleWorkspace(),
    });
    await user.click(screen.getByRole('button', { name: 'Edit Repainting' }));
    await user.clear(screen.getByLabelText(/^Label/));
    await user.type(screen.getByLabelText(/^Label/), 'Wall painting');
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    await user.click(screen.getByRole('link', { name: 'Lease' }));
    expect(within(panelOf('Wall painting')).getByText(/Not confirmed/)).toBeTruthy();
    expect(within(panelOf('Service fee')).getByText(/No clause found/)).toBeTruthy();
  });

  it('F2-R12 the override controls are also on the result cards', async () => {
    const { user } = renderSampleResults();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(
      within(cardOf('Service fee')).getByRole('button', { name: 'Paste a quote for Service fee' }),
    ).toBeTruthy();
  });

  it('T-211 a lease over the limit stays in the box, is not used, and says so', async () => {
    const { user } = leaseRender();
    const box = screen.getByLabelText<HTMLTextAreaElement>('Lease text');
    await user.clear(box);
    await user.click(box);
    await user.paste('x'.repeat(40_001));
    expect(box.value).toHaveLength(40_001);
    expect(screen.getByText('40,001 of 40,000')).toBeTruthy();
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/longer than 40,000 characters/)).toBeTruthy();
    await user.type(box, '{Backspace}');
    expect(box.getAttribute('aria-invalid')).toBeNull();
    expect(box.value).toHaveLength(40_000);
  });

  it('T-212 focus goes into the quote form, stays on a refused quote, and comes back on Cancel', async () => {
    const { user } = leaseRender();
    await user.click(screen.getByRole('button', { name: 'Paste a quote for Service fee' }));
    const box = screen.getByLabelText(/^Quote from the lease/);
    expect(document.activeElement).toBe(box);
    await user.type(box, 'nowhere in the lease');
    await user.click(screen.getByRole('button', { name: 'Use this quote' }));
    expect(document.activeElement).toBe(box);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Paste a quote for Service fee',
    );
  });

  it('T-212 focus moves to Paste a quote when Remove override goes away', async () => {
    const { user } = leaseRender();
    await user.click(screen.getByRole('button', { name: 'No clause here for Repainting' }));
    await user.click(screen.getByRole('button', { name: 'Remove override for Repainting' }));
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Paste a quote for Repainting');
  });

  it('F1-R3 Run check without facts goes to Details instead of running', async () => {
    const { user } = renderApp({ route: LEASE_ROUTE });
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Details' })).toBeTruthy();
    expect(screen.getByText(/There are 3 problems/)).toBeTruthy();
  });
});
