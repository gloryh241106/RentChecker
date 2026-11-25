import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test-support/render-app.js';

describe('Home stage links', () => {
  it('UI Home lists Moving out, Before signing, then During the tenancy, and the last opens /tenancy', () => {
    renderApp();
    const stages = ['Moving out', 'Before signing', 'During the tenancy'];
    const names = screen
      .getAllByRole('link')
      .map((link) => link.textContent)
      .filter((text) => stages.includes(text ?? ''));
    expect(names).toEqual(stages);
    expect(screen.getByRole('link', { name: 'Before signing' }).getAttribute('href')).toBe(
      '/lease-review',
    );
    expect(screen.getByRole('link', { name: 'During the tenancy' }).getAttribute('href')).toBe(
      '/tenancy',
    );
  });

  it('UI Home gives the During the tenancy link one line of help and no saved note', () => {
    renderApp();
    expect(screen.getByText(/Check a metered bill against your readings/)).toBeTruthy();
    expect(screen.queryByText('Saved in this browser')).toBeNull();
  });
});
