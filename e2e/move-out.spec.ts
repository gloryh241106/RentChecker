import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Moves on with Tab until the focused control has this accessible name. */
async function tabTo(page: Page, name: string | RegExp): Promise<void> {
  const wanted = page
    .getByLabel(name)
    .or(page.getByRole('button', { name, exact: true }))
    .first();
  for (let press = 0; press < 40; press += 1) {
    await page.keyboard.press('Tab');
    if (await wanted.evaluate((element) => element === document.activeElement).catch(() => false)) {
      return;
    }
  }
  throw new Error(`Tab never reached ${String(name)}`);
}

async function typeInto(page: Page, name: string | RegExp, text: string): Promise<void> {
  await tabTo(page, name);
  await page.keyboard.type(text);
}

async function pressButton(page: Page, name: string): Promise<void> {
  await tabTo(page, name);
  await page.keyboard.press('Enter');
}

interface TypedDeduction {
  readonly label: string;
  /** Presses of Arrow Down in the Kind list, which starts on Rent. */
  readonly kindDown: number;
  readonly amount: string;
  readonly month?: string;
}

async function addDeduction(page: Page, deduction: TypedDeduction): Promise<void> {
  await pressButton(page, 'Add deduction');
  await expect(page.getByLabel(/^Label/)).toBeFocused();
  await page.keyboard.type(deduction.label);
  await tabTo(page, 'Kind');
  for (let press = 0; press < deduction.kindDown; press += 1) {
    await page.keyboard.press('ArrowDown');
  }
  await typeInto(page, /^Amount charged/, deduction.amount);
  if (deduction.month !== undefined) {
    await typeInto(page, /^Rent month/, deduction.month);
  }
  await pressButton(page, 'Save deduction');
  await expect(page.getByRole('heading', { name: deduction.label })).toBeVisible();
}

test('T-201 UC-1 works offline and by keyboard alone', async ({ page, context }) => {
  const requests: string[] = [];
  await page.goto('/move-out');
  await context.setOffline(true);
  page.on('request', (request) => requests.push(request.url()));

  await typeInto(page, /^Deposit/, '30,000');
  await typeInto(page, /^Monthly rent/, '15,000');
  await typeInto(page, /^Handover date/, '2026-06-15');
  await tabTo(page, /partial month/);
  await page.keyboard.press('ArrowDown');
  await pressButton(page, 'Next');
  await expect(page.getByRole('heading', { level: 1, name: 'Deductions' })).toBeFocused();

  await addDeduction(page, { label: 'Repainting', kindDown: 3, amount: '12,000' });
  await addDeduction(page, { label: 'June rent', kindDown: 0, amount: '15,000', month: '2026-06' });
  await addDeduction(page, { label: 'Service fee', kindDown: 2, amount: '3,000' });
  await pressButton(page, 'Next');
  await expect(page.getByRole('heading', { level: 1, name: 'Lease' })).toBeFocused();
  await pressButton(page, 'Run check');

  await expect(page.getByRole('heading', { level: 1, name: 'Results' })).toBeFocused();
  await expect(page.getByRole('status')).toHaveText(
    'Check finished. Ask about ₹7,500, awaiting proof ₹0, unclear ₹15,000.',
  );
  const rent = page.getByRole('listitem').filter({ hasText: 'June rent' }).first();
  await expect(rent.getByText('Recalculate')).toBeVisible();
  await expect(rent.getByText('Worked out: ₹7,500')).toBeVisible();
  expect(requests).toEqual([]);
});

test('T-213 F1-R8 one click on Save deduction is enough after a bad amount', async ({ page }) => {
  await page.goto('/move-out?step=deductions');
  await page.getByRole('button', { name: 'Add deduction' }).click();
  await page.getByLabel(/^Label/).fill('Repainting');
  await page.getByLabel(/^Amount charged/).fill('abc');
  await page.getByRole('button', { name: 'Save deduction' }).click();
  await expect(page.getByText('There are 2 problems')).toBeVisible();
  await expect(page.getByLabel(/^Amount charged/)).toBeFocused();
});
