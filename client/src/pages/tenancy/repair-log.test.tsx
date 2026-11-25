import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MAX_REPAIRS } from '../../shared.js';
import type { Workspace } from '../../shared.js';
import { EMPTY_WORKSPACE } from '../../state/empty-workspace.js';
import { PAINTING, REPAIR } from '../../test-support/builders.js';
import { renderApp } from '../../test-support/render-app.js';

type User = ReturnType<typeof renderApp>['user'];

async function addRepair(user: User, date: string, description: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Add repair' }));
  await user.type(screen.getByLabelText(/^Date/), date);
  await user.type(screen.getByLabelText(/^What was wrong/), description);
  await user.type(screen.getByLabelText(/^Reported to/), 'Landlord, by WhatsApp');
  await user.click(screen.getByRole('button', { name: 'Save repair' }));
}

function dates(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent ?? '');
}

function fiftyRepairs(): Workspace {
  const repairs = Array.from({ length: MAX_REPAIRS }, (_, index) => ({
    ...REPAIR,
    id: `r${index}`,
  }));
  return { ...EMPTY_WORKSPACE, repairs };
}

const linkedWorkspace: Workspace = {
  ...EMPTY_WORKSPACE,
  deductions: [PAINTING],
  repairs: [{ ...REPAIR, deductionId: 'd1' }],
};

describe('Repair log', () => {
  it('UI the empty state says what to do', () => {
    renderApp({ route: '/tenancy' });
    expect(
      screen.getByText('No repairs recorded. Add one when you report a problem.'),
    ).toBeTruthy();
  });

  it('F5-AC7 T-172 entries added out of date order are listed oldest first', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await addRepair(user, '2026-05-01', 'Broken lock');
    await addRepair(user, '2026-03-10', 'Damp wall');
    await addRepair(user, '2026-04-02', 'Leaking tap');
    expect(dates()).toEqual(['10 March 2026', '2 April 2026', '1 May 2026']);
  });

  it('F5-R5 an add focuses the date, and after Save focus returns to the log heading', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await user.click(screen.getByRole('button', { name: 'Add repair' }));
    expect(document.activeElement).toBe(screen.getByLabelText(/^Date/));
    await user.type(screen.getByLabelText(/^Date/), '2026-03-10');
    await user.type(screen.getByLabelText(/^What was wrong/), 'Damp wall');
    await user.type(screen.getByLabelText(/^Reported to/), 'Landlord');
    await user.click(screen.getByRole('button', { name: 'Save repair' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Repair log' }));
    expect(screen.getByRole('status').textContent).toBe('Saved the repair of 10 March 2026.');
  });

  it('F5-R5 Save with empty boxes shows messages, the summary, and focuses the first wrong box', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await user.click(screen.getByRole('button', { name: 'Add repair' }));
    await user.click(screen.getByRole('button', { name: 'Save repair' }));
    expect(screen.getByText('There are 3 problems')).toBeTruthy();
    expect(screen.getAllByText('Enter the date.').length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(screen.getByLabelText(/^Date/));
  });

  it('D-5 a date that does not exist is rejected next to the field', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await user.click(screen.getByRole('button', { name: 'Add repair' }));
    await user.type(screen.getByLabelText(/^Date/), '2026-02-30');
    await user.click(screen.getByRole('button', { name: 'Save repair' }));
    expect(screen.getAllByText(/Write the date as YYYY-MM-DD/).length).toBeGreaterThan(0);
  });

  it('F5-R5 an entry is edited in the same form, and Cancel keeps the old text', async () => {
    const { user } = renderApp({
      route: '/tenancy',
      stored: { ...EMPTY_WORKSPACE, repairs: [REPAIR] },
    });
    await user.click(screen.getByRole('button', { name: 'Edit repair Damp wall' }));
    expect((screen.getByLabelText(/^Date/) as HTMLInputElement).value).toBe('2026-03-10');
    await user.clear(screen.getByLabelText(/^What was wrong/));
    await user.type(screen.getByLabelText(/^What was wrong/), 'Mould');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Repair log' }));
    expect(screen.getByText('Damp wall')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit repair Damp wall' }));
    await user.clear(screen.getByLabelText(/^What was wrong/));
    await user.type(screen.getByLabelText(/^What was wrong/), 'Mould');
    await user.click(screen.getByRole('button', { name: 'Save repair' }));
    expect(screen.getByText('Mould')).toBeTruthy();
    expect(screen.queryByText('Damp wall')).toBeNull();
  });

  it('F5-R5 deleting an entry without a link says so without mentioning a link', async () => {
    const { user } = renderApp({
      route: '/tenancy',
      stored: { ...EMPTY_WORKSPACE, repairs: [REPAIR] },
    });
    await user.click(screen.getByRole('button', { name: 'Delete repair Damp wall' }));
    expect(screen.getByRole('status').textContent).toBe('Removed the repair of 10 March 2026.');
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Repair log' }));
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('F5-R7 F5-AC9 T-172 deleting a linked entry says its link was removed, and the link is gone', async () => {
    const { user, storage } = renderApp({ route: '/tenancy', stored: linkedWorkspace });
    expect(screen.getByText('Linked to: Repainting')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Delete repair Damp wall' }));
    expect(screen.getByRole('status').textContent).toBe(
      'Removed the repair of 10 March 2026. Its link to Repainting was removed.',
    );
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.raw).not.toContain('"deductionId":"d1"');
  });

  it('F5-R6 editing a linked entry keeps its link', async () => {
    const { user } = renderApp({ route: '/tenancy', stored: linkedWorkspace });
    await user.click(screen.getByRole('button', { name: 'Edit repair Damp wall' }));
    await user.click(screen.getByRole('button', { name: 'Save repair' }));
    expect(screen.getByText('Linked to: Repainting')).toBeTruthy();
  });

  it('F5-AC8 T-172 with 50 entries the add control is disabled and says why', () => {
    renderApp({ route: '/tenancy', stored: fiftyRepairs() });
    const add = screen.getByRole('button', { name: 'Add repair' }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    expect(screen.getByText('The log holds up to 50 entries.')).toBeTruthy();
    expect(add.getAttribute('aria-describedby')).toBe('repair-limit');
  });

  it('F5-AC8 with 49 entries the add control is enabled and has no reason', () => {
    const stored = fiftyRepairs();
    renderApp({ route: '/tenancy', stored: { ...stored, repairs: stored.repairs.slice(1) } });
    const add = screen.getByRole('button', { name: 'Add repair' }) as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    expect(add.getAttribute('aria-describedby')).toBeNull();
  });

  it('F5-R8 entries are kept in this browser only', async () => {
    const { user, storage, clauseApi } = renderApp({ route: '/tenancy' });
    await addRepair(user, '2026-03-10', 'Damp wall');
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.raw).toContain('"description":"Damp wall"');
    expect(clauseApi.requests).toHaveLength(0);
  });

  it('FR-16 each entry shows its date, text and who it was reported to', () => {
    renderApp({ route: '/tenancy', stored: { ...EMPTY_WORKSPACE, repairs: [REPAIR] } });
    const entry = screen.getByRole('heading', { level: 3, name: '10 March 2026' }).closest('li');
    expect(within(entry as HTMLElement).getByText('Reported to: Landlord')).toBeTruthy();
  });
});
