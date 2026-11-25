import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * T-173. Colour contrast is off because jsdom has no layout, so contrast is checked by calculation
 * in design/contrast.test.ts instead.
 */
export async function expectNoAxeViolations(): Promise<void> {
  const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
  const summary = results.violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.html ?? ''}`);
  expect(summary).toEqual([]);
}
