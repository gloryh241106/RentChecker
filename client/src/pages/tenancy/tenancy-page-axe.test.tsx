import { screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import { EMPTY_WORKSPACE } from '../../state/empty-workspace.js';
import { REPAIR } from '../../test-support/builders.js';
import { expectNoAxeViolations } from '../../test-support/axe.js';
import { renderApp } from '../../test-support/render-app.js';

describe('automated accessibility check on During the tenancy (T-173)', () => {
  it('T-173 empty', async () => {
    renderApp({ route: '/tenancy' });
    await expectNoAxeViolations();
  });

  it('T-173 bill form with errors and the summary', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await user.click(screen.getByRole('button', { name: 'Check bill' }));
    await expectNoAxeViolations();
  });

  it('T-173 bill form with a result', async () => {
    const { user } = renderApp({ route: '/tenancy' });
    await user.type(screen.getByLabelText(/^Previous reading/), '1200');
    await user.type(screen.getByLabelText(/^Current reading/), '1350.50');
    await user.type(screen.getByLabelText(/^Rate per unit/), '7.50');
    await user.type(screen.getByLabelText(/^Bill total/), '1300');
    await user.click(screen.getByRole('button', { name: 'Check bill' }));
    await expectNoAxeViolations();
  });

  it('T-173 repair form with errors, and the log with entries', async () => {
    const { user } = renderApp({
      route: '/tenancy',
      stored: { ...EMPTY_WORKSPACE, repairs: [REPAIR] },
    });
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'Add repair' }));
    await user.click(screen.getByRole('button', { name: 'Save repair' }));
    await expectNoAxeViolations();
  });
});
