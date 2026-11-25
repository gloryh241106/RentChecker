import { expect, test } from '@playwright/test';

test('T-209 NFR-1 a direct link loads without a CSP violation or page error', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  const response = await page.goto('/move-out');
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self'");
  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();
  expect(problems).toEqual([]);
});
