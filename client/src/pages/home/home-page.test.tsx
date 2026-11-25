import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, renderSampleResults } from '../../test-support/render-app.js';

const stageNav = () => screen.queryByRole('navigation', { name: 'Stages' });

describe('Home', () => {
  it('UI Home shows the example as shared/ works it out (D-40, D-41)', () => {
    renderApp();
    const example = within(screen.getByRole('region', { name: 'Example result' }));
    expect(example.getByText('Ask about ₹10,500')).toBeTruthy();
    expect(example.getByText('of ₹30,000 deducted')).toBeTruthy();
    const rows = example.getAllByRole('listitem').map((row) => row.textContent);
    expect(rows).toEqual([
      'Repainting ₹12,000Needs proof',
      'June rent ₹15,000Recalculate',
      'Service fee ₹3,000Not found in the lease',
    ]);
  });

  it('UI Home leads to Details with Check my deductions', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('link', { name: 'Check my deductions' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Details' })).toBeTruthy();
  });
});

describe('stage links in the header', () => {
  it('UI Home has none, because it has the stage cards', () => {
    renderApp();
    expect(stageNav()).toBeNull();
  });

  it.each([
    ['/move-out?step=lease', 'Moving out'],
    ['/lease-review', 'Before signing'],
    ['/tenancy', 'During the tenancy'],
  ])('UI %s marks %s as the current stage', (route, name) => {
    renderApp({ route });
    const current = within(stageNav() ?? document.body)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
      .map((link) => link.textContent);
    expect(current).toEqual([name]);
  });
});

describe('split bar', () => {
  it('UI Results has one part for each bucket above 0, hidden from assistive technology', async () => {
    const { user, container } = renderSampleResults();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    expect(screen.getByText('Ask about ₹10,500')).toBeTruthy();
    const parts = [...container.querySelectorAll<HTMLElement>('[aria-hidden="true"] > span')];
    expect(parts.map(({ style }) => style.flexGrow)).toEqual(['1050000', '1200000', '750000']);
  });
});
