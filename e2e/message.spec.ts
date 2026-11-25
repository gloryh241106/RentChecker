import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('T-206 UC-2 the message is drafted, edited and copied', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample case' }).click();
  await page.getByRole('button', { name: 'Run check' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  const box = page.getByLabel('Message to your landlord');
  await expect(box).toHaveValue(/1\. Repainting: ₹12,000/);
  await expect(box).toHaveValue(/Amount I worked out: ₹7,500/);
  await expect(box).toHaveValue(/3\. Service fee: ₹3,000/);

  const edited = (await box.inputValue()).replace("[landlord's name]", 'Landlord');
  await box.fill(edited);
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replaceAll('\r\n', '\n')).toBe(edited);

  await page.reload();
  await expect(box).toHaveValue(edited);
  await expect(page.getByText('This draft may be out of date.')).toBeVisible();
});
