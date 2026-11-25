import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cardOf, totalOf } from '../../test-support/queries.js';
import { renderSampleResults } from '../../test-support/render-app.js';

async function runSample() {
  const view = renderSampleResults();
  await view.user.click(screen.getByRole('button', { name: 'Run check' }));
  return view;
}

describe('sample case results', () => {
  it('F1-R9 before a check the Results step offers to run it', () => {
    renderSampleResults();
    expect(screen.getByText('You have not run the check yet.')).toBeTruthy();
  });

  it('F1-AC2 the totals are Ask about 10,500, Awaiting proof 12,000, Unclear 0, Consistent 7,500 (T-156)', async () => {
    await runSample();
    expect(totalOf('Total deducted')).toBe('₹30,000');
    expect(totalOf('Ask about')).toBe('₹10,500');
    expect(totalOf('Awaiting proof')).toBe('₹12,000');
    expect(totalOf('Unclear')).toBe('₹0');
    expect(totalOf('Consistent')).toBe('₹7,500');
  });

  it('F1-AC1 Repainting needs proof, June rent is recalculated at 7,500, Service fee is not found (T-155)', async () => {
    await runSample();
    expect(within(cardOf('Repainting')).getByText('Needs proof')).toBeTruthy();
    const rent = within(cardOf('June rent'));
    expect(rent.getByText('Recalculate')).toBeTruthy();
    expect(rent.getByText('₹7,500')).toBeTruthy();
    expect(within(cardOf('Service fee')).getByText('Not found in the lease')).toBeTruthy();
  });

  it('F1-AC3 each card lists every reason in one plain sentence (F1-R9)', async () => {
    await runSample();
    expect(
      within(cardOf('Repainting')).getByText('No receipt was given for this cost.'),
    ).toBeTruthy();
    expect(
      within(cardOf('June rent')).getByText(
        'You used 15 of the 30 days. The rent still due for this month works out to ₹7,500. This charge is ₹15,000.',
      ),
    ).toBeTruthy();
    const fee = within(cardOf('Service fee'));
    expect(fee.getByText('No clause in the lease you pasted covers this.')).toBeTruthy();
    expect(fee.getByText('The lease amount for this fee was not entered.')).toBeTruthy();
  });

  it('F1-R10 cards follow the order the deductions were entered, and icons are hidden from assistive technology (T-155)', async () => {
    const { container } = await runSample();
    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(['Repainting', 'June rent', 'Service fee']);
    const icons = container.querySelectorAll('li svg');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => expect(icon.getAttribute('aria-hidden')).toBe('true'));
  });

  it('T-156 completion is announced once in the status region', async () => {
    await runSample();
    expect(screen.getByRole('status').textContent).toBe(
      'Check finished. Ask about ₹10,500, awaiting proof ₹12,000, unclear ₹0.',
    );
  });

  it('F1-R17 matches are tagged Sample match, with the quote for Repainting (T-159)', async () => {
    await runSample();
    const repainting = within(cardOf('Repainting'));
    expect(repainting.getByText(/Sample match/)).toBeTruthy();
    expect(repainting.getByText(/shall pay for repainting the walls/)).toBeTruthy();
    expect(
      screen.getByText('Sample data. This is an example case, not your tenancy.'),
    ).toBeTruthy();
  });

  it('F1-R14 pressing Run check twice gives the same output', async () => {
    const { user } = await runSample();
    const before = document.querySelector('main')?.textContent;
    await user.click(screen.getByRole('link', { name: /Lease/ }));
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(document.querySelector('main')?.textContent).toBe(before);
  });
});
