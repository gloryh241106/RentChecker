import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Deduction, Workspace } from '../../shared.js';
import { expectNoAxeViolations } from '../../test-support/axe.js';
import { caseWith } from '../../test-support/builders.js';
import { renderApp } from '../../test-support/render-app.js';

const ROUTE = '/move-out?step=deductions';
const MESSAGE = 'Repainting: Rs 12,000\nJune rent - 15000/-\nService fee ₹3,000';

function cost(index: number): Deduction {
  return {
    id: `d${String(index)}`,
    kind: 'cost',
    label: `Cost ${String(index)}`,
    amountPaise: 100,
  };
}

async function findCharges(user: UserEvent, message: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: "Read the landlord's message" }));
  await user.click(screen.getByLabelText('Message from your landlord'));
  await user.paste(message);
  await user.click(screen.getByRole('button', { name: 'Find charges' }));
}

async function open(message: string, stored: Workspace = caseWith([])) {
  const view = renderApp({ route: ROUTE, stored });
  await findCharges(view.user, message);
  return view;
}

function cardNames(): (string | null)[] {
  return screen.queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
}

describe('Read the landlord’s message', () => {
  it('F8-AC1 lists the charges, and adds the checked ones (T-233)', async () => {
    const { user, clauseApi } = await open(MESSAGE);
    expect(document.activeElement?.textContent).toBe('Charges found');
    expect(screen.getByLabelText('June rent, ₹15,000, Rent for June 2026')).toBeTruthy();
    await expectNoAxeViolations();
    await user.click(screen.getByLabelText('Service fee, ₹3,000, Fixed fee'));
    await user.click(screen.getByRole('button', { name: 'Add 2 charges' }));
    expect(cardNames()).toEqual(['Repainting', 'June rent']);
    expect(screen.getByRole('status').textContent).toBe('Added 2 charges.');
    expect(clauseApi.requests).toHaveLength(0);
  });

  it('F8-R7 an unchecked charge can be checked again, and none checked adds nothing (T-233)', async () => {
    const { user } = await open('Repainting 12,000');
    const box = screen.getByLabelText('Repainting, ₹12,000, Cost');
    await user.click(box);
    expect(screen.getByRole('button', { name: 'Add 0 charges' }).hasAttribute('disabled')).toBe(
      true,
    );
    await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Add 1 charge' }));
    expect(cardNames()).toEqual(['Repainting']);
  });

  it('F8-AC3 says how many amounts were left out (T-234)', async () => {
    await open(`${MESSAGE}\nTotal 30,000`);
    expect(screen.getByText(/^1 amount was left out/)).toBeTruthy();
  });

  it('F8-AC4 rent without a month cannot be added, and says why (T-234)', async () => {
    await open('June rent 15000', caseWith([], { handoverDate: undefined }));
    expect(screen.getByText(/Enter the handover date on Details first/)).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('F8-AC5 says when no charge was found (T-234)', async () => {
    const { user } = await open('Thank you');
    expect(screen.getByRole('heading', { name: 'No charge was found' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Message from your landlord')).toBeNull();
  });

  it('F8-AC6 adds up to 20 deductions and says so (T-235)', async () => {
    const { user } = await open(MESSAGE, caseWith(Array.from({ length: 19 }, (_, i) => cost(i))));
    expect(screen.getByText(/You can add up to 20 deductions\./)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Add 1 charge' }));
    expect(cardNames()).toHaveLength(20);
    expect(
      screen.getByRole('button', { name: "Read the landlord's message" }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('F8-R8 the sample message fills the box and nothing is stored (T-235)', async () => {
    const { user, storage } = renderApp({ route: ROUTE, stored: caseWith([]) });
    await user.click(screen.getByRole('button', { name: "Read the landlord's message" }));
    await user.click(screen.getByRole('button', { name: 'Use a sample message' }));
    await user.click(screen.getByRole('button', { name: 'Find charges' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(storage.saves).toBe(0);
  });

  it('F8 a message over 4,000 characters is rejected next to the field (T-235)', async () => {
    await open('x'.repeat(4001));
    expect(screen.getByText('Use at most 4,000 characters.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Find charges' }).hasAttribute('disabled')).toBe(
      true,
    );
  });
});
