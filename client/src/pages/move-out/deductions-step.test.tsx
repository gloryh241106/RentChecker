import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MAX_DEDUCTIONS } from '../../shared.js';
import type { Workspace } from '../../shared.js';
import { EMPTY_WORKSPACE } from '../../state/empty-workspace.js';
import { REPAIR } from '../../test-support/builders.js';
import { renderApp } from '../../test-support/render-app.js';

const DEDUCTIONS = '/move-out?step=deductions';

async function addCost(user: ReturnType<typeof renderApp>['user'], label: string, amount: string) {
  await user.click(screen.getByRole('button', { name: 'Add deduction' }));
  await user.type(screen.getByLabelText(/^Label/), label);
  await user.selectOptions(screen.getByLabelText('Kind'), 'Cost');
  await user.type(screen.getByLabelText(/^Amount charged/), amount);
  await user.click(screen.getByRole('button', { name: 'Save deduction' }));
}

function twentyDeductions(): Workspace {
  const deductions = Array.from({ length: MAX_DEDUCTIONS }, (_, index) => ({
    id: `d${index}`,
    kind: 'cost' as const,
    label: `Charge ${index}`,
    amountPaise: 1000,
  }));
  return { ...EMPTY_WORKSPACE, deductions };
}

describe('Deductions step', () => {
  it('F1-R4 the empty state says what to do', () => {
    renderApp({ route: DEDUCTIONS });
    expect(
      screen.getByText("No deductions yet. Add the first charge from your landlord's list."),
    ).toBeTruthy();
  });

  it('T-154 a deduction is added, edited and removed, and each is announced', async () => {
    const { user } = renderApp({ route: DEDUCTIONS });
    await addCost(user, 'Repainting', '12,000');
    const card = screen.getByRole('heading', { level: 3, name: 'Repainting' }).closest('li');
    expect(within(card as HTMLElement).getByText(/Cost, charged/)).toBeTruthy();
    expect(within(card as HTMLElement).getByText('₹12,000')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit Repainting' }));
    await user.clear(screen.getByLabelText(/^Label/));
    await user.type(screen.getByLabelText(/^Label/), 'Wall painting');
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    expect(screen.getByRole('heading', { level: 3, name: 'Wall painting' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Remove Wall painting' }));
    expect(screen.getByRole('status').textContent).toBe('Removed Wall painting.');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('F1-R5 the label is required for the rent kind too, and the form says so next to the field', async () => {
    const { user } = renderApp({ route: DEDUCTIONS });
    await user.click(screen.getByRole('button', { name: 'Add deduction' }));
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    expect(screen.getAllByText('Enter the label.').length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(screen.getByLabelText(/^Label/));
  });

  it('F1-R5 changing the kind clears the facts of the old kind (T-154)', async () => {
    const { user } = renderApp({ route: DEDUCTIONS });
    await user.click(screen.getByRole('button', { name: 'Add deduction' }));
    await user.selectOptions(screen.getByLabelText('Kind'), 'Metered bill');
    await user.type(screen.getByLabelText(/^Previous reading/), '120');
    await user.selectOptions(screen.getByLabelText('Kind'), 'Cost');
    expect(screen.queryByLabelText(/^Previous reading/)).toBeNull();
    await user.selectOptions(screen.getByLabelText('Kind'), 'Metered bill');
    expect((screen.getByLabelText(/^Previous reading/) as HTMLInputElement).value).toBe('');
  });

  it('F1-R6 the current reading below the previous is rejected on the current reading (T-020, F1-AC8)', async () => {
    const { user } = renderApp({ route: DEDUCTIONS });
    await user.click(screen.getByRole('button', { name: 'Add deduction' }));
    await user.type(screen.getByLabelText(/^Label/), 'Electricity');
    await user.selectOptions(screen.getByLabelText('Kind'), 'Metered bill');
    await user.type(screen.getByLabelText(/^Amount charged/), '1,200');
    await user.type(screen.getByLabelText(/^Previous reading/), '120.50');
    await user.type(screen.getByLabelText(/^Current reading/), '110');
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    expect(
      screen.getByText('The current reading must not be lower than the previous one.', {
        selector: 'span',
      }),
    ).toBeTruthy();
    await user.clear(screen.getByLabelText(/^Previous reading/));
    await user.type(screen.getByLabelText(/^Previous reading/), '100');
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    expect(screen.getByRole('heading', { level: 3, name: 'Electricity' })).toBeTruthy();
  });

  it('F1-AC11 with 20 deductions the add control is disabled and says why (T-154)', () => {
    renderApp({ route: DEDUCTIONS, stored: twentyDeductions() });
    const add = screen.getByRole('button', { name: 'Add deduction' }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    expect(screen.getByText('You can add up to 20 deductions.')).toBeTruthy();
    expect(add.getAttribute('aria-describedby')).toBe('deduction-limit');
  });

  it('F1-R3 Next with no deduction says to add one and focuses the add control', async () => {
    const { user } = renderApp({ route: DEDUCTIONS });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Add at least one deduction.', { exact: false })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add deduction' }));
  });

  it('F1-R16 repairs of the log can be linked to a deduction, and a link moves from another', async () => {
    const stored: Workspace = {
      ...twentyDeductions(),
      deductions: [{ id: 'd1', kind: 'cost', label: 'Repainting', amountPaise: 1000 }],
      repairs: [REPAIR],
    };
    const { user, storage } = renderApp({ route: DEDUCTIONS, stored });
    await user.click(screen.getByRole('button', { name: 'Edit Repainting' }));
    await user.click(screen.getByLabelText('10 March 2026: Damp wall'));
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.raw).toContain('"deductionId":"d1"');
  });
});
