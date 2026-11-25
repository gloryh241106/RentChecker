import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';
import { STEP_PATH, expectNoHorizontalScroll } from './support/move-out';

const MESSAGE = 'Repainting: Rs 12,000\nJune rent - 15000/-\nService fee ₹3,000\nTotal 30,000';

test.describe('at 320 px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('T-238 UC-9, F8-AC1, F8-AC3, F8-R8 charges are read from a message and added', async ({
    page,
  }) => {
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });
    await page.goto(STEP_PATH.details);
    await page.getByLabel(/^Deposit/).fill('30000');
    await page.getByLabel(/^Monthly rent/).fill('15000');
    await page.getByLabel(/^Handover date/).fill('2026-06-15');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('button', { name: "Read the landlord's message" }).click();
    await page.getByLabel('Message from your landlord').fill(MESSAGE);
    await page.getByRole('button', { name: 'Find charges' }).click();
    await expect(page.getByRole('checkbox')).toHaveCount(3);
    await expect(page.getByText(/^1 amount was left out/)).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);

    await page.getByRole('checkbox', { name: /^Service fee/ }).uncheck();
    await page.getByRole('button', { name: 'Add 2 charges' }).click();
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Repainting', 'June rent']);
    await expect(page.getByRole('heading', { name: 'Charges from your landlord' })).toBeFocused();
    expect(apiCalls).toEqual([]);

    await page.reload();
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Repainting', 'June rent']);
    const stored = await page.evaluate(() => localStorage.getItem('rentchecker:v1'));
    expect(stored).not.toContain('Total 30,000');
  });
});
