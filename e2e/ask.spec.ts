import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';
import { expectNoHorizontalScroll } from './support/move-out';

const DEPOSIT = 'The security deposit is refunded within 30 days of handover.';
const LEASE = `${DEPOSIT}\nThe tenant shall pay rent on the fifth day of every month.`;
const MATCH_URL = '**/api/clauses/match';

/** Answers with a quote for a question about the deposit, and with no clause for any other. */
async function fakeAnswers(page: Page): Promise<string[]> {
  const asked: string[] = [];
  await page.route(MATCH_URL, async (route) => {
    const body = route.request().postDataJSON() as { items: { id: string; label: string }[] };
    const [item] = body.items;
    asked.push(item?.label ?? '');
    const isFound = item?.label.includes('deposit') === true;
    const match = { itemId: item?.id, source: 'ai', quote: isFound ? DEPOSIT : null };
    const matches = [{ ...match, state: isFound ? 'verified' : 'none' }];
    await route.fulfill({ json: { mode: 'ai', warnings: [], matches } });
  });
  return asked;
}

async function openAsk(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ask your lease' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ask your lease' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask', exact: true })).toBeDisabled();
}

async function ask(page: Page, question: string): Promise<void> {
  await page.getByLabel('Your question').fill(question);
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
}

test('T-236 UC-8, F7-AC1 to F7-AC3 questions are asked with one consent notice', async ({
  page,
}) => {
  const asked = await fakeAnswers(page);
  await openAsk(page);
  await page.getByLabel('Lease text').fill(LEASE);

  await ask(page, 'When is the deposit refunded?');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  expect(asked).toEqual([]);

  await ask(page, 'When is the deposit refunded?');
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('blockquote')).toHaveText(DEPOSIT);

  await ask(page, 'Can I keep a pet?');
  await expect(page.getByText('No clause about this was found')).toBeVisible();
  expect(asked).toEqual(['When is the deposit refunded?', 'Can I keep a pet?']);
  await expect(page.getByRole('button', { name: 'Copy questions' })).toBeVisible();
  await expectNoAxeViolations(page);
  await expectNoHorizontalScroll(page);

  await page.getByLabel('Lease text').press('End');
  await page.getByLabel('Lease text').pressSequentially(' ');
  await expect(page.getByRole('blockquote')).toHaveCount(0);
});

test('T-237 F7-R9 the real server without a key answers in keyword mode', async ({ page }) => {
  await openAsk(page);
  await page.getByRole('button', { name: 'Use a sample lease' }).click();
  await page.getByRole('button', { name: 'When is the deposit refunded?' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/^AI matching was not used/)).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'When is the deposit refunded?' }),
  ).toBeVisible();
});

test.describe('T-208 at 320 px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('T-207 T-208 NFR-5 the empty Ask page fits and has no axe violations', async ({ page }) => {
    await page.goto('/ask');
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });
});
