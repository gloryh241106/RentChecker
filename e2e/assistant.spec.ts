import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';
import { expectNoHorizontalScroll } from './support/move-out';

const READ_URL = '**/api/assistant/read';
const PROMPT = 'Landlord kept 12,000 for painting. My deposit was 30,000.';
const FACTS = [
  { kind: 'deduction', source: '12,000 for painting', label: 'painting' },
  { kind: 'deposit', source: '30,000', label: null },
];

async function fakeReading(page: Page): Promise<string[]> {
  const sent: string[] = [];
  await page.route(READ_URL, async (route) => {
    const body = route.request().postDataJSON() as { prompt: string };
    sent.push(body.prompt);
    const reading = { task: 'check_deductions', facts: FACTS, doubts: [] };
    await route.fulfill({ json: { mode: 'ai', warnings: [], ...reading } });
  });
  return sent;
}

async function read(page: Page, prompt: string): Promise<void> {
  await page.getByLabel('Your message', { exact: true }).fill(prompt);
  await page.getByRole('button', { name: 'Read my message' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click();
}

test.describe('at 320 px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('T-261 UC-10, F9-AC2 a prompt and two answers fill in Moving out', async ({ page }) => {
    const sent = await fakeReading(page);
    await page.goto('/');
    await expectNoHorizontalScroll(page);
    await read(page, PROMPT);
    await expect(
      page.getByRole('heading', { name: 'You want to check deductions from your deposit' }),
    ).toBeFocused();

    await page.getByLabel('How much is the rent for one month?').fill('15k');
    await page.keyboard.press('Enter');
    await page.getByLabel('On which day did you give the place back?').fill('15 June 2026');
    await page.keyboard.press('Enter');
    const use = page.getByRole('button', { name: 'Use these details' });
    await expect(use).toBeFocused();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);

    await use.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Lease' })).toBeFocused();
    await page.goto('/move-out');
    await expect(page.getByLabel(/^Deposit/)).toHaveValue('30,000');
    await expect(page.getByLabel(/^Handover date/)).toHaveValue('2026-06-15');
    expect(sent).toEqual([PROMPT]);
    const stored = await page.evaluate(() => localStorage.getItem('rentchecker:v1'));
    expect(stored).not.toContain('Landlord kept');
  });
});

test('T-262 F9-AC4, F9-AC6 the real server without a key reads a question by code', async ({
  page,
}) => {
  await page.goto('/');
  await read(page, 'Who pays for painting?');
  await expect(page.getByText(/^AI was not used\. Your message was read/)).toBeVisible();
  await page
    .getByRole('region', { name: 'Tell the assistant what you need' })
    .getByRole('link', { name: 'Ask your lease' })
    .click();
  await expect(page.getByLabel('Your question')).toHaveValue('Who pays for painting?');
});
