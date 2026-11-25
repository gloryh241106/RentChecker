import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test-support/render-app.js';

describe('Home stage links', () => {
  it('UI Home lists Moving out, then During the tenancy, and the latter opens /tenancy', () => {
    renderApp();
    const names = screen
      .getAllByRole('link')
      .map((link) => link.textContent)
      .filter((text) => text === 'Moving out' || text === 'During the tenancy');
    expect(names).toEqual(['Moving out', 'During the tenancy']);
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
