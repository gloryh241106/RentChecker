import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// The built axe source, run inside the page. The app's CSP forbids addScriptTag.
const AXE_SOURCE = readFileSync(
  join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8',
);

interface AxeNode {
  readonly target: readonly string[];
}

interface AxeViolation {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly nodes: readonly AxeNode[];
}

interface AxeResult {
  readonly violations: readonly AxeViolation[];
}

interface AxeApi {
  run(context: Document): Promise<AxeResult>;
}

declare global {
  interface Window {
    axe?: AxeApi;
  }
}

/** T-207, NFR-5: every default axe rule, colour contrast included. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  await page.evaluate(AXE_SOURCE);
  const summary = await page.evaluate(async () => {
    const axe = window.axe;
    if (axe === undefined) {
      throw new Error('axe did not load');
    }
    const results = await axe.run(document);
    return results.violations.map(
      ({ id, impact, help, nodes }) =>
        `${id} (${impact ?? 'unknown'}): ${help} [${nodes
          .map((node) => node.target.join(' '))
          .join('; ')}]`,
    );
  });
  expect(summary, 'axe violations').toEqual([]);
}
