import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { workspaceSchema } from '../../shared.js';
import { renderApp } from '../../test-support/render-app.js';

const DETAILS = '/move-out';

function field(label: RegExp): HTMLInputElement {
  const element = screen.getByLabelText(label);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('Not an input');
  }
  return element;
}

describe('Details step', () => {
  it('T-153 partial month offers Not sure (selected), Per day, Full month, and the day checkbox is off', () => {
    renderApp({ route: DETAILS });
    const select = screen.getByLabelText('How does the lease charge a partial month?');
    expect((select as HTMLSelectElement).value).toBe('unsure');
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Not sure', 'Per day', 'Full month']);
    expect(
      (screen.getByLabelText('The handover day does not count as a day of use') as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it('F1-R8 fields have visible labels with "required", hints, and no autocomplete', () => {
    renderApp({ route: DETAILS });
    const deposit = field(/^Deposit/);
    expect(screen.getByText('Deposit (required)')).toBeTruthy();
    expect(deposit.getAttribute('autocomplete')).toBe('off');
    expect(deposit.getAttribute('inputmode')).toBe('decimal');
    expect(deposit.getAttribute('aria-describedby')).toBe('tenancy-deposit-hint');
    expect(document.getElementById('tenancy-deposit-hint')?.textContent).toBe(
      'For example 15,000 or 1,30,000',
    );
  });

  it('F1-R8 an error does not appear while typing, only after leaving the field', async () => {
    const { user } = renderApp({ route: DETAILS });
    await user.type(field(/^Deposit/), 'ab');
    expect(screen.queryByText(/Enter an amount in rupees/)).toBeNull();
    await user.tab();
    expect(screen.getByText(/Enter an amount in rupees/)).toBeTruthy();
  });

  it.each([
    ['0', 'Enter an amount above 0.'],
    ['-5', 'Enter an amount in rupees, like 15,000 or 15,000.50. Use at most 2 decimals.'],
    ['abc', 'Enter an amount in rupees, like 15,000 or 15,000.50. Use at most 2 decimals.'],
    ['1,00,00,001', 'Enter an amount up to ₹1,00,00,000.'],
  ])('F1-AC6 deposit %j is rejected next to the field (T-007, T-008)', async (text, message) => {
    const { user } = renderApp({ route: DETAILS });
    const deposit = field(/^Deposit/);
    await user.type(deposit, text);
    await user.tab();
    expect(screen.getByText(message)).toBeTruthy();
    expect(deposit.getAttribute('aria-invalid')).toBe('true');
    expect(deposit.getAttribute('aria-describedby')).toContain('tenancy-deposit-error');
  });

  it('F1-AC6 1,30,000 is accepted and stored as paise (T-014)', async () => {
    const { user, storage } = renderApp({ route: DETAILS });
    await user.type(field(/^Deposit/), '1,30,000');
    await user.tab();
    expect(screen.queryByText(/Enter an amount/)).toBeNull();
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.raw).toContain('"depositPaise":13000000');
  });

  it('T-152 Run check with deposit abc and no handover date reports both, focuses the first, and sends nothing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { user } = renderApp({ route: DETAILS });
    await user.type(field(/^Deposit/), 'abc');
    await user.type(field(/^Monthly rent/), '15,000');
    await user.click(screen.getByRole('link', { name: 'Lease' }));
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    const summary = screen.getByText('There are 2 problems').closest('div');
    expect(summary?.textContent).toContain('Deposit:');
    expect(summary?.textContent).toContain('Handover date: Enter the handover date.');
    expect(document.activeElement).toBe(field(/^Deposit/));
    expect(field(/^Handover date/).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('2 problems');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('F1-R8 a summary link moves focus to its field', async () => {
    const { user } = renderApp({ route: DETAILS });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('link', { name: 'Monthly rent: Enter the monthly rent.' }));
    expect(document.activeElement).toBe(field(/^Monthly rent/));
  });

  it('F1-AC7 a start date after the handover date is rejected on the start date (T-017)', async () => {
    const { user } = renderApp({ route: DETAILS });
    await user.type(field(/^Handover date/), '2026-06-15');
    await user.type(field(/^Start date/), '2026-06-20');
    await user.tab();
    expect(screen.getByText('The start date must be on or before the handover date.')).toBeTruthy();
    expect(field(/^Start date/).getAttribute('aria-invalid')).toBe('true');
  });

  it('D-5 either date can be edited out of a conflict and the store never holds a bad pair (F1-R8)', async () => {
    const { user, storage } = renderApp({ route: DETAILS });
    await user.type(field(/^Handover date/), '2026-06-15');
    await user.type(field(/^Start date/), '2026-06-20');
    await user.tab();
    window.dispatchEvent(new Event('pagehide'));
    expect(workspaceSchema.safeParse(JSON.parse(storage.raw ?? 'null')).success).toBe(true);
    expect(storage.raw).not.toContain('startDate');
    await user.clear(field(/^Handover date/));
    await user.type(field(/^Handover date/), '2026-06-25');
    expect(screen.queryByText('The start date must be on or before the handover date.')).toBeNull();
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.raw).toContain('"startDate":"2026-06-20"');
    expect(workspaceSchema.safeParse(JSON.parse(storage.raw ?? 'null')).success).toBe(true);
  });

  it('F1-R8 partly typed invalid text is kept when the tenant changes steps and comes back', async () => {
    const { user } = renderApp({ route: DETAILS });
    await user.type(field(/^Deposit/), 'abc');
    await user.click(screen.getByRole('link', { name: 'Deductions' }));
    await user.click(screen.getByRole('link', { name: 'Details' }));
    expect(field(/^Deposit/).value).toBe('abc');
  });

  it('F1-R3 a valid Details step moves on to Deductions with focus on the new heading', async () => {
    const { user } = renderApp({ route: DETAILS });
    await user.type(field(/^Deposit/), '30,000');
    await user.type(field(/^Monthly rent/), '15,000');
    await user.type(field(/^Handover date/), '2026-06-15');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const heading = screen.getByRole('heading', { level: 1, name: 'Deductions' });
    expect(document.activeElement).toBe(heading);
    expect(document.title).toBe('Deductions - RentChecker');
    expect(screen.getByRole('link', { name: 'Deductions' }).getAttribute('aria-current')).toBe(
      'step',
    );
  });
});
