import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';
import {
  STEP_PATH,
  expectNoHorizontalScroll,
  loadSampleCase,
  openMessage,
  runSampleCheck,
} from './support/move-out';

test('T-207 NFR-5 Home has no axe violations', async ({ page }) => {
  await page.goto('/');
  await expectNoAxeViolations(page);
});

test('T-207 NFR-5 Details has no axe violations, empty and with errors', async ({ page }) => {
  await page.goto(STEP_PATH.details);
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/^(There is 1 problem|There are \d+ problems)$/)).toBeVisible();
  await expectNoAxeViolations(page);
});

test('T-207 NFR-5 Deductions has no axe violations, empty and with form errors', async ({
  page,
}) => {
  await page.goto(STEP_PATH.deductions);
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'Add deduction' }).click();
  await page.getByRole('button', { name: 'Save deduction' }).click();
  await expect(page.getByText(/^(There is 1 problem|There are \d+ problems)$/)).toBeVisible();
  await expectNoAxeViolations(page);
});

test('T-207 NFR-5 Lease has no axe violations, empty and with the sample clause', async ({
  page,
}) => {
  await page.goto(STEP_PATH.lease);
  await expectNoAxeViolations(page);

  await loadSampleCase(page);
  await page.getByRole('link', { name: 'Lease', exact: true }).click();
  await expect(page.getByText(/Sample match/).first()).toBeVisible();
  await expectNoAxeViolations(page);
});

test('T-207 NFR-5 Results has no axe violations, empty and with results', async ({ page }) => {
  await page.goto(STEP_PATH.results);
  await expectNoAxeViolations(page);

  await runSampleCheck(page);
  await expect(page.getByRole('definition').first()).toBeVisible();
  await expectNoAxeViolations(page);
});

test('T-207 NFR-5 Message has no axe violations, empty and with a draft', async ({ page }) => {
  await page.goto(STEP_PATH.message);
  await expect(page.getByText('Run the check first.')).toBeVisible();
  await expectNoAxeViolations(page);

  await openMessage(page);
  await expectNoAxeViolations(page);
});

test('T-207 NFR-5 the consent notice has no axe violations', async ({ page }) => {
  await loadSampleCase(page);
  await page.getByRole('link', { name: 'Lease', exact: true }).click();
  await page.getByRole('button', { name: 'Find clauses' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoAxeViolations(page);
});

test.describe('T-208 at 320 px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('T-208 NFR-5 Home has no horizontal scroll at 320 px', async ({ page }) => {
    await page.goto('/');
    await expectNoHorizontalScroll(page);
  });

  test('T-208 NFR-5 Details has no horizontal scroll, empty and with errors', async ({ page }) => {
    await page.goto(STEP_PATH.details);
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/^(There is 1 problem|There are \d+ problems)$/)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('T-208 NFR-5 Deductions has no horizontal scroll, empty and with form errors', async ({
    page,
  }) => {
    await page.goto(STEP_PATH.deductions);
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Add deduction' }).click();
    await page.getByRole('button', { name: 'Save deduction' }).click();
    await expect(page.getByText(/^(There is 1 problem|There are \d+ problems)$/)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('T-208 NFR-5 Lease has no horizontal scroll with the sample clause', async ({ page }) => {
    await loadSampleCase(page);
    await page.getByRole('link', { name: 'Lease', exact: true }).click();
    await expect(page.getByText(/Sample match/).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('T-208 NFR-5 Results has no horizontal scroll, empty and with results', async ({ page }) => {
    await page.goto(STEP_PATH.results);
    await expectNoHorizontalScroll(page);
    await runSampleCheck(page);
    await expect(page.getByRole('definition').first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('T-208 NFR-5 Message has no horizontal scroll', async ({ page }) => {
    await openMessage(page);
    await expectNoHorizontalScroll(page);
  });
});
