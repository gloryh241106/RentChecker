import { screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import { createSampleWorkspace } from '../state/sample.js';
import { expectNoAxeViolations } from '../test-support/axe.js';
import { renderApp } from '../test-support/render-app.js';

const STEP = '/move-out?step=';

describe('automated accessibility check on every screen (T-173)', () => {
  it('T-173 Home, empty and with saved data', async () => {
    const view = renderApp();
    await expectNoAxeViolations();
    view.unmount();
    renderApp({ stored: createSampleWorkspace() });
    await expectNoAxeViolations();
  });

  it('T-173 Not found page', async () => {
    renderApp({ route: '/nowhere' });
    await expectNoAxeViolations();
  });

  it.each(['details', 'deductions', 'lease', 'results'])('T-173 %s step, empty', async (step) => {
    renderApp({ route: `${STEP}${step}` });
    await expectNoAxeViolations();
  });

  it('T-173 Details with errors and the summary', async () => {
    const { user } = renderApp({ route: `${STEP}details` });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await expectNoAxeViolations();
  });

  it('T-173 Deductions with the form open and with errors', async () => {
    const { user } = renderApp({ route: `${STEP}deductions`, stored: createSampleWorkspace() });
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'Add deduction' }));
    await user.click(screen.getByRole('button', { name: 'Save deduction' }));
    await expectNoAxeViolations();
  });

  it('T-173 Deductions with no deduction after Next', async () => {
    const { user } = renderApp({ route: `${STEP}deductions` });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await expectNoAxeViolations();
  });

  it('T-173 Lease with the sample, and the quote form with its error', async () => {
    const { user } = renderApp({ route: `${STEP}lease`, stored: createSampleWorkspace() });
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'Paste a quote for Service fee' }));
    await user.type(screen.getByLabelText(/^Quote from the lease/), 'not in the lease at all');
    await user.click(screen.getByRole('button', { name: 'Use this quote' }));
    await expectNoAxeViolations();
  });

  it('T-173 Results with the sample, and out of date', async () => {
    const { user } = renderApp({ route: `${STEP}results`, stored: createSampleWorkspace() });
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'No clause here for Repainting' }));
    await expectNoAxeViolations();
  });

  it('T-173 both dialogs', async () => {
    const { user } = renderApp({ stored: createSampleWorkspace() });
    await user.click(screen.getByRole('button', { name: 'Load sample case' }));
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('contentinfo').querySelector('button') ?? document.body);
    await expectNoAxeViolations();
  });
});
