import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSampleWorkspace } from '../state/sample.js';
import { InMemoryWorkspaceStorage } from '../test-support/in-memory-storage.js';
import { totalOf } from '../test-support/queries.js';
import { renderApp } from '../test-support/render-app.js';

const DELETE_QUESTION =
  'Delete all data stored by RentChecker in this browser? This cannot be undone.';
const SAMPLE_BANNER = 'Sample data. This is an example case, not your tenancy.';

function footerDelete(): HTMLElement {
  const button = screen.getByRole('contentinfo').querySelector('button');
  if (button === null) {
    throw new Error('No delete button in the footer');
  }
  return button;
}

function confirmButton(name: string): HTMLElement {
  return within(screen.getByRole('dialog')).getByRole('button', { name });
}

describe('page frame', () => {
  it('NFR-5 every screen has a skip link, one header, one main, one footer and one h1', () => {
    renderApp();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip.getAttribute('href')).toBe('#main');
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('NFR-5 the status region is in the page from the start', () => {
    renderApp();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('FRONTEND an unknown address shows the Not found page with a link home', () => {
    renderApp({ route: '/nothing-here' });
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
    const home = screen.getByRole('link', { name: 'Go to the home page' });
    expect(home.getAttribute('href')).toBe('/');
    expect(document.title).toBe('Page not found - RentChecker');
  });

  it('UI Home offers only the stages that exist, and says when data is saved', () => {
    renderApp({ stored: createSampleWorkspace() });
    const title = 'Check your rent and deposit charges';
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Moving out' })).toBeTruthy();
    expect(screen.getByText('Saved in this browser')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Before signing/ })).toBeTruthy();
  });

  it('UI Home shows no saved note for an empty browser', () => {
    renderApp();
    expect(screen.queryByText('Saved in this browser')).toBeNull();
  });
});

describe('Delete everything', () => {
  it('F1-AC13 Cancel changes nothing and focus returns to the control (T-160)', async () => {
    const { user, storage } = renderApp({ route: '/move-out', stored: createSampleWorkspace() });
    await user.click(footerDelete());
    expect(screen.getByRole('dialog', { name: 'Delete everything' }).textContent).toContain(
      DELETE_QUESTION,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(storage.raw).not.toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(footerDelete());
  });

  it('T-175 Escape closes the dialog and focus returns to the control', async () => {
    const { user, storage } = renderApp({ stored: createSampleWorkspace() });
    await user.click(footerDelete());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(footerDelete());
    expect(storage.raw).not.toBeNull();
  });

  it('F1-R19 the dialog starts on Cancel, so the safe choice is the default', async () => {
    const { user } = renderApp({ stored: createSampleWorkspace() });
    await user.click(footerDelete());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('F1-AC13 Confirm leaves no RentChecker data, shows Home and focuses its heading (T-160)', async () => {
    const { user, storage } = renderApp({ route: '/move-out', stored: createSampleWorkspace() });
    await user.click(footerDelete());
    await user.click(confirmButton('Delete everything'));
    expect(storage.raw).toBeNull();
    expect(storage.corruptRaw).toBeNull();
    const title = 'Check your rent and deposit charges';
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: title }));
    expect(screen.queryByText('Saved in this browser')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Everything was deleted.');
  });

  it('UC-6 a refusing browser keeps the dialog open with a message', async () => {
    const storage = new InMemoryWorkspaceStorage(createSampleWorkspace());
    const { user } = renderApp({ storage });
    storage.isBroken = true;
    await user.click(footerDelete());
    await user.click(confirmButton('Delete everything'));
    expect(screen.getByText(/Clear the site data for this page/)).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

describe('Load sample case', () => {
  const OWN_DATA = { ...createSampleWorkspace(), isSample: false, leaseText: 'My own lease text' };

  it('F1-AC14 with data a confirmation comes first, and Cancel replaces nothing (T-159)', async () => {
    const { user, storage } = renderApp({ stored: OWN_DATA });
    await user.click(screen.getByRole('button', { name: 'Load sample case' }));
    expect(screen.getByRole('dialog', { name: 'Load the sample case' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(SAMPLE_BANNER)).toBeNull();
    expect(storage.saves).toBe(0);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Load sample case' }));
  });

  it('F1-AC14 Confirm replaces the data, shows the banner and opens the results (T-159)', async () => {
    const { user } = renderApp({ stored: OWN_DATA });
    await user.click(screen.getByRole('button', { name: 'Load sample case' }));
    await user.click(confirmButton('Load sample case'));
    expect(screen.getByRole('heading', { level: 1, name: 'Results' })).toBeTruthy();
    expect(screen.getByText(SAMPLE_BANNER)).toBeTruthy();
  });

  it('F1-R17 the sample opens with the check already run (T-220)', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Load sample case' }));
    expect(totalOf('Ask about')).toBe('₹10,500');
    expect(screen.queryByRole('button', { name: 'Run check' })).toBeNull();
  });

  it('F1-R17 with nothing stored the sample loads at once, without a question', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Load sample case' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(SAMPLE_BANNER)).toBeTruthy();
  });

  it('F1-R17 the sample banner stays on every step until everything is deleted', async () => {
    const { user } = renderApp({ route: '/move-out?step=lease', stored: createSampleWorkspace() });
    for (const step of ['Details', 'Deductions', 'Lease', 'Results']) {
      await user.click(screen.getByRole('link', { name: step }));
      expect(screen.getByText(SAMPLE_BANNER)).toBeTruthy();
    }
  });
});

describe('storage problems', () => {
  it('F1-R18 storage that throws shows the notice and the app still works (T-174)', async () => {
    const storage = new InMemoryWorkspaceStorage();
    storage.isBroken = true;
    const { user } = renderApp({ storage, route: '/move-out' });
    expect(
      screen.getByText(
        'Your browser is blocking storage. Nothing will be saved, but the app still works until you close this page.',
      ),
    ).toBeTruthy();
    await user.type(screen.getByLabelText(/^Deposit/), '30,000');
    expect((screen.getByLabelText(/^Deposit/) as HTMLInputElement).value).toBe('30,000');
  });

  it('F1-R18 a corrupt value is ignored with a notice, the form is empty and the raw text is kept (T-174)', () => {
    const storage = new InMemoryWorkspaceStorage();
    storage.raw = '{broken';
    renderApp({ storage, route: '/move-out' });
    expect(
      screen.getByText('Your saved data could not be read, so you are starting empty.'),
    ).toBeTruthy();
    expect((screen.getByLabelText(/^Deposit/) as HTMLInputElement).value).toBe('');
    expect(storage.corruptRaw).toBe('{broken');
    expect(storage.raw).toBe('{broken');
  });

  it('FRONTEND a value from another schema version has its own notice', () => {
    const storage = new InMemoryWorkspaceStorage();
    storage.raw = JSON.stringify({ schemaVersion: 2 });
    renderApp({ storage });
    expect(screen.getByText(/different version of RentChecker/)).toBeTruthy();
  });
});
