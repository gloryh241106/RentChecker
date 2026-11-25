import { expect, test } from '@playwright/test';

test('T-202 FR-6, F1-R18 facts come back after a reload and are gone after Delete everything', async ({
  page,
}) => {
  await page.goto('/move-out');
  await page.getByLabel(/^Deposit/).fill('30,000');
  await page.getByLabel(/^Monthly rent/).fill('15,000');
  await page.getByLabel(/^Handover date/).fill('2026-06-15');

  await page.reload();
  await expect(page.getByLabel(/^Deposit/)).toHaveValue('30,000');
  await expect(page.getByLabel(/^Monthly rent/)).toHaveValue('15,000');
  await expect(page.getByLabel(/^Handover date/)).toHaveValue('2026-06-15');

  await page.getByRole('button', { name: 'Delete everything' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByText(
      'Delete all data stored by RentChecker in this browser? This cannot be undone.',
    ),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete everything' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Check your rent and deposit charges' }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Check your rent and deposit charges' }),
  ).toBeVisible();
  await expect(page.getByText('Saved in this browser')).toHaveCount(0);

  await page.goto('/move-out');
  await expect(page.getByLabel(/^Deposit/)).toHaveValue('');
  await expect(page.getByLabel(/^Monthly rent/)).toHaveValue('');
  await expect(page.getByLabel(/^Handover date/)).toHaveValue('');
});
