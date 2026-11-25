import { screen } from '@testing-library/react';

/** The value shown for a term in the totals list. */
export function totalOf(name: string): string | null | undefined {
  return screen.getByText(name, { selector: 'dt' }).nextElementSibling?.textContent;
}

/** The result card of a deduction. */
export function cardOf(label: string): HTMLElement {
  const card = screen.getByRole('heading', { name: label, level: 3 }).closest('li');
  if (card === null) {
    throw new Error(`No card for ${label}`);
  }
  return card;
}
