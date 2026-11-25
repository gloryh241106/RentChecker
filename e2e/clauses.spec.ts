import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const MATCH_URL = '**/api/clauses/match';
const QUOTE = 'The tenant shall pay for repainting the walls on leaving';
const FAILED =
  'Matching failed. Your calculations still work. Run the check without clauses, or try again.';

const aiAnswer = {
  mode: 'ai',
  warnings: [],
  matches: [
    { itemId: 'sample-painting', state: 'verified', quote: QUOTE, source: 'ai' },
    { itemId: 'sample-fee', state: 'none', quote: null, source: 'ai' },
  ],
};

async function openSampleLease(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample case' }).click();
  await page
    .getByRole('navigation', { name: 'Steps' })
    .getByRole('link', { name: 'Lease' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lease' })).toBeVisible();
}

async function findClauses(page: Page, answer: 'Continue' | 'Cancel'): Promise<void> {
  await page.getByRole('button', { name: 'Find clauses' }).click();
  await page.getByRole('dialog').getByRole('button', { name: answer }).click();
}

test('T-203 FR-12 nothing is sent before consent, and an AI answer is shown', async ({ page }) => {
  let calls = 0;
  await page.route(MATCH_URL, async (route) => {
    calls += 1;
    await route.fulfill({ json: aiAnswer });
  });
  await openSampleLease(page);
  await findClauses(page, 'Cancel');
  await expect(page.getByRole('button', { name: 'Find clauses' })).toBeFocused();
  expect(calls).toBe(0);

  await findClauses(page, 'Continue');
  await expect(page.getByRole('status')).toHaveText('Clause matching finished.');
  expect(calls).toBe(1);
  await expect(page.getByText(QUOTE, { exact: true })).toBeVisible();
  await expect(page.getByText('(AI match)')).toHaveCount(2);
  await page.getByRole('button', { name: 'Run check' }).click();
  await expect(page.getByRole('status')).toContainText('Ask about ₹10,500');
});

test('T-204 FR-10 without a key the real server matches by keyword', async ({ page }) => {
  await openSampleLease(page);
  await page.getByRole('button', { name: 'Find clauses' }).click();
  await expect(page.getByText(/looks for matching words/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/^AI matching was not used/)).toBeVisible();
  await expect(
    page.getByText('AI matching is not set up on this server.', { exact: true }),
  ).toBeVisible();
  const lease = await page.getByLabel('Lease text').inputValue();
  const quotes = await page.getByRole('blockquote').allTextContents();
  expect(quotes.length).toBeGreaterThan(0);
  for (const quote of quotes) {
    expect(lease).toContain(quote);
  }
});

test('T-205 NFR-3 a failed match says so, and the check still runs', async ({ page, context }) => {
  await page.route(MATCH_URL, (route) =>
    route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'x' } } }),
  );
  await openSampleLease(page);
  await findClauses(page, 'Continue');
  await expect(page.getByText(FAILED)).toBeVisible();

  await page.unroute(MATCH_URL);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(FAILED)).toBeVisible();
  await page.getByRole('button', { name: 'Run check' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Results' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Ask about ₹10,500');
});
