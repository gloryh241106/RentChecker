import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** Routes of the five Moving out steps (docs/design/FRONTEND.md). */
export const STEP_PATH = {
  details: '/move-out',
  deductions: '/move-out?step=deductions',
  lease: '/move-out?step=lease',
  results: '/move-out?step=results',
  message: '/move-out?step=message',
} as const;

/** F1-R17: the sample case loads from Home and opens on Results. */
export async function loadSampleCase(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample case' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Results' })).toBeVisible();
  await expect(
    page.getByText('Sample data. This is an example case, not your tenancy.'),
  ).toBeVisible();
}

/** F1-R17, F1-AC2: the sample case opens with the check already run. */
export async function runSampleCheck(page: Page): Promise<void> {
  await loadSampleCase(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Totals' })).toBeVisible();
}

/** UC-2: the Message step of the checked sample case. */
export async function openMessage(page: Page): Promise<void> {
  await runSampleCheck(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('Message to your landlord')).toBeVisible();
}

/** One result card, found by the deduction label it shows. */
export function card(page: Page, label: string): Locator {
  return page.getByRole('listitem').filter({ hasText: label }).first();
}

/** The definition list of Totals: Total deducted, then the four buckets. */
export async function expectTotals(page: Page, amounts: readonly string[]): Promise<void> {
  await expect(page.getByRole('definition')).toHaveText([...amounts]);
}

/** NFR-5: the whole document fits the viewport, with no horizontal scroll. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(width.content, `document is ${String(width.content)} px wide`).toBeLessThanOrEqual(
    width.viewport,
  );
}
