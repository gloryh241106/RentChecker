import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';
import { card, expectNoHorizontalScroll, loadSampleCase } from './support/move-out';

const REPAIR = 'Damp patch on the bedroom wall';

test('T-214 UC-4, F5-AC1 a bill is checked and its form is kept', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'During the tenancy' }).click();
  await page.getByLabel(/^Previous reading/).fill('1,200.00');
  await page.getByLabel(/^Current reading/).fill('1,350.50');
  await page.getByLabel(/^Rate per unit/).fill('7.50');
  await page.getByLabel(/^Fixed charge/).fill('100');
  await page.getByLabel(/^Bill total/).fill('1,300');
  await page.getByRole('button', { name: 'Check bill' }).click();
  const summary =
    'Worked out from your readings: ₹1,228.75. Your bill: ₹1,300. Difference: ₹71.25.';
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  await expect(
    page.getByText('The readings and rate give ₹1,228.75. This charge is ₹1,300.'),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await page.reload();
  await expect(page.getByLabel(/^Bill total/)).toHaveValue(/^1,?300$/);
});

test('T-215 UC-5, F5-AC6, F5-AC9 a repair is recorded, linked, shown and deleted', async ({
  page,
}) => {
  await loadSampleCase(page);
  await page.goto('/tenancy');
  await page.getByRole('button', { name: 'Add repair' }).click();
  await page.getByLabel(/^Date/).fill('2026-03-10');
  await page.getByLabel(/^What was wrong/).fill(REPAIR);
  await page.getByLabel(/^Reported to/).fill('Landlord, by WhatsApp');
  await page.getByRole('button', { name: 'Save repair' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved the repair of 10 March 2026.');

  await page.goto('/move-out?step=deductions');
  await page.getByRole('button', { name: 'Edit Repainting' }).click();
  await page.getByLabel(`10 March 2026: ${REPAIR}`).check();
  await page.getByRole('button', { name: 'Save deduction' }).click();
  await page.getByRole('link', { name: 'Results' }).click();
  await page.getByRole('button', { name: 'Run check' }).click();
  const painting = card(page, 'Repainting');
  await expect(painting.getByText('Needs proof')).toBeVisible();
  await expect(
    painting.getByText('You reported a repair on 10 March 2026, on or before handover.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Message' }).click();
  await expect(page.getByLabel('Message to your landlord')).toHaveValue(
    new RegExp(`I reported a repair on 10 March 2026 to Landlord, by WhatsApp: ${REPAIR}`),
  );

  await page.getByRole('link', { name: 'RentChecker' }).click();
  await page.getByRole('link', { name: 'During the tenancy' }).click();
  await page.getByRole('button', { name: `Delete repair ${REPAIR}` }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Removed the repair of 10 March 2026. Its link to Repainting was removed.',
  );
  await page.goto('/move-out?step=results');
  await page.getByRole('button', { name: 'Run check' }).click();
  await expect(painting.getByText('Needs proof')).toBeVisible();
  await expect(page.getByText(REPAIR)).toHaveCount(0);
});

test.describe('T-208 at 320 px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('T-207 T-208 NFR-5 the repair form with errors fits and has no axe violations', async ({
    page,
  }) => {
    await page.goto('/tenancy');
    await page.getByRole('button', { name: 'Check bill' }).click();
    await page.getByRole('button', { name: 'Add repair' }).click();
    await page.getByRole('button', { name: 'Save repair' }).click();
    await expect(page.getByText('There are 3 problems')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });
});
