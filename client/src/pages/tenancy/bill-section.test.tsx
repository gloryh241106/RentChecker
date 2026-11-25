import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSampleWorkspace } from '../../state/sample.js';
import { renderApp } from '../../test-support/render-app.js';

const page = () => within(screen.getByRole('main'));
type User = ReturnType<typeof renderApp>['user'];

async function fill(user: User, total: string, rate = '7.50'): Promise<void> {
  await user.type(screen.getByLabelText(/^Previous reading/), '1,200');
  await user.type(screen.getByLabelText(/^Current reading/), '1350.50');
  if (rate !== '') {
    await user.type(screen.getByLabelText(/^Rate per unit/), rate);
  }
  await user.type(screen.getByLabelText(/^Fixed charge/), '100');
  await user.type(screen.getByLabelText(/^Bill total/), total);
}

const check = (user: User) => user.click(screen.getByRole('button', { name: 'Check bill' }));

describe('Check a bill', () => {
  it('UI During the tenancy shows the heading, two sections and only the form to start with', () => {
    renderApp({ route: '/tenancy' });
    expect(screen.getByRole('heading', { level: 1, name: 'During the tenancy' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Check a bill' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Repair log' })).toBeTruthy();
    expect(page().queryByText(/Worked out from your readings/)).toBeNull();
    expect(document.title).toBe('During the tenancy - RentChecker');
  });

  it('T-064 F5-AC1 a total above expected shows expected, difference and the reason', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await fill(user, '1,300');
    await check(user);
    expect(
      screen.getByText(
        'Worked out from your readings: ₹1,228.75. Your bill: ₹1,300. Difference: ₹71.25.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText('The readings and rate give ₹1,228.75. This charge is ₹1,300.'),
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Bill checked. Worked out');
  });

  it('T-065 F5-AC2 a total equal to expected says it matches', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await fill(user, '1,228.75');
    await check(user);
    expect(page().getByText(/Difference: ₹0\./)).toBeTruthy();
    expect(screen.getByText('This charge matches the ₹1,228.75 that was worked out.')).toBeTruthy();
  });

  it('T-066 F5-AC3 a total below expected shows a negative difference', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await fill(user, '1,000');
    await check(user);
    expect(page().getByText(/Difference: -₹228\.75\./)).toBeTruthy();
    expect(
      screen.getByText('This charge is lower than the ₹1,228.75 that was worked out.'),
    ).toBeTruthy();
  });

  it('T-171 F5-AC5 a missing rate shows a message next to the field and no amount', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await fill(user, '1,300', '');
    await check(user);
    expect(screen.getAllByText('Enter the rate.').length).toBeGreaterThan(0);
    expect(page().queryByText(/Worked out from your readings/)).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText(/^Rate per unit/));
    expect(screen.getByRole('status').textContent).toBe('1 problem');
  });

  it('F5-AC4 F5-R1 a current reading below the previous is rejected and no amount is shown', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await user.type(screen.getByLabelText(/^Previous reading/), '1,200');
    await user.type(screen.getByLabelText(/^Current reading/), '1,100');
    await user.type(screen.getByLabelText(/^Rate per unit/), '7.50');
    await user.type(screen.getByLabelText(/^Bill total/), '1,000');
    await check(user);
    expect(
      screen.getAllByText('The current reading must not be lower than the previous one.').length,
    ).toBeGreaterThan(0);
    expect(page().queryByText(/Worked out from your readings/)).toBeNull();
  });

  it('F5-R2 an amount that was shown goes away when a box is made wrong', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await fill(user, '1,300');
    await check(user);
    await user.clear(screen.getByLabelText(/^Rate per unit/));
    expect(page().queryByText(/Worked out from your readings/)).toBeNull();
  });

  it('F5-R4 typing is never undone: invalid text stays in the box and out of the store', async () => {
    const { user, storage } = renderApp({ route: '/tenancy' });
    const box = screen.getByLabelText(/^Previous reading/) as HTMLInputElement;
    await user.type(box, '12abc');
    expect(box.value).toBe('12abc');
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.raw ?? '').not.toContain('12abc');
    expect(storage.raw ?? '').not.toContain('previousReading');
  });

  it('F5-R4 valid values are stored as hundredths and paise, and come back after a reload', async () => {
    const first = renderApp({ route: '/tenancy' });
    await fill(first.user, '1,300');
    window.dispatchEvent(new Event('pagehide'));
    expect(first.storage.raw).toContain('"previousReading":120000');
    expect(first.storage.raw).toContain('"billedTotalPaise":130000');
    first.unmount();
    renderApp({ route: '/tenancy', storage: first.storage });
    expect((screen.getByLabelText(/^Bill total/) as HTMLInputElement).value).toBe('1,300');
    expect((screen.getByLabelText(/^Current reading/) as HTMLInputElement).value).toBe('1,350.50');
  });

  it('F5-R8 the bill check calls no clause API', async () => {
    const { user, clauseApi } = renderApp({ route: '/tenancy' });
    await fill(user, '1,300');
    await check(user);
    expect(clauseApi.requests).toHaveLength(0);
  });

  it('FR-7 the sample banner shows on this page while sample data is in use', () => {
    renderApp({ route: '/tenancy', stored: createSampleWorkspace() });
    expect(
      screen.getByText('Sample data. This is an example case, not your tenancy.'),
    ).toBeTruthy();
  });

  it('FR-7 no banner without sample data', () => {
    renderApp({ route: '/tenancy' });
    expect(screen.queryByText(/^Sample data/)).toBeNull();
  });
});
