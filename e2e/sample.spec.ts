import { expect, test } from '@playwright/test';
import { card, expectTotals, runSampleCheck } from './support/move-out';

test('T-200 UC-1, F1-AC2 the sample case shows the worked example results', async ({ page }) => {
  await runSampleCheck(page);

  // DOMAIN_RULES.md worked example: deposit 30,000, per-day rent, three deductions.
  await expectTotals(page, ['₹30,000', '₹10,500', '₹12,000', '₹0', '₹7,500']);
  await expect(page.getByRole('status')).toHaveText('Sample case loaded.');

  const repainting = card(page, 'Repainting');
  await expect(repainting.getByText('Needs proof')).toBeVisible();
  await expect(repainting.getByText('Cost, charged ₹12,000')).toBeVisible();
  await expect(repainting.getByText('No receipt was given for this cost.')).toBeVisible();
  await expect(repainting.getByText(/Sample match/)).toBeVisible();
  await expect(repainting.getByText(/shall pay for repainting the walls on leaving/)).toBeVisible();

  const rent = card(page, 'June rent');
  await expect(rent.getByText('Recalculate')).toBeVisible();
  await expect(rent.getByText('Worked out: ₹7,500')).toBeVisible();
  await expect(
    rent.getByText(
      'You used 15 of the 30 days. The rent still due for this month works out to ₹7,500. This charge is ₹15,000.',
    ),
  ).toBeVisible();

  const fee = card(page, 'Service fee');
  await expect(fee.getByText('Not found in the lease')).toBeVisible();
  await expect(fee.getByText('No clause in the lease you pasted covers this.')).toBeVisible();
  await expect(fee.getByText('The lease amount for this fee was not entered.')).toBeVisible();

  await page.getByRole('link', { name: 'Lease', exact: true }).click();
  await page.getByRole('button', { name: 'Run check' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Check finished. Ask about ₹10,500, awaiting proof ₹12,000, unclear ₹0.',
  );
});
