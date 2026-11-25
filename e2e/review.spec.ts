import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';
import { card, expectNoHorizontalScroll } from './support/move-out';

const PAINTING = 'The tenant shall pay for painting the walls on leaving, as per the actual bill.';
const DEPOSIT = 'The security deposit is Rs 30,000 and is paid on signing.';
const LEASE = `${DEPOSIT}\n${PAINTING}\nThe notice period is one month for both sides.`;
const MATCH_URL = '**/api/clauses/match';

const aiAnswer = {
  mode: 'ai',
  warnings: [],
  matches: [
    { itemId: 'deposit-amount', state: 'verified', quote: DEPOSIT, source: 'ai' },
    { itemId: 'refund-deadline', state: 'none', quote: null, source: 'ai' },
    { itemId: 'partial-month-rent', state: 'none', quote: null, source: 'ai' },
    { itemId: 'painting', state: 'verified', quote: PAINTING, source: 'ai' },
    { itemId: 'cleaning', state: 'unconfirmed', quote: null, source: 'ai' },
    { itemId: 'repairs-and-wear', state: 'none', quote: null, source: 'ai' },
    { itemId: 'notice-period', state: 'unconfirmed', quote: null, source: 'ai' },
    { itemId: 'receipts', state: 'none', quote: null, source: 'ai' },
    { itemId: 'handover-inspection', state: 'none', quote: null, source: 'ai' },
    { itemId: 'meter-charges', state: 'none', quote: null, source: 'ai' },
  ],
};

async function openReview(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Before signing' }).click();
  await expect(page.getByRole('button', { name: 'Run review' })).toBeDisabled();
  await page.getByLabel('Lease text').fill(LEASE);
}

async function runReview(page: Page, answer: 'Continue' | 'Cancel'): Promise<void> {
  await page.getByRole('button', { name: 'Run review' }).click();
  await page.getByRole('dialog').getByRole('button', { name: answer }).click();
}

test.describe('with a faked AI answer', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('T-216 UC-3, F4-AC5, F4-AC6 a lease is reviewed and the questions are copied', async ({
    page,
  }) => {
    let calls = 0;
    await page.route(MATCH_URL, async (route) => {
      calls += 1;
      await route.fulfill({ json: aiAnswer });
    });
    await openReview(page);
    await runReview(page, 'Cancel');
    expect(calls).toBe(0);
    await runReview(page, 'Continue');
    await expect(page.getByRole('status')).toHaveText('Review finished.');
    expect(calls).toBe(1);
    await expect(card(page, 'Deposit amount').getByText(DEPOSIT)).toBeVisible();
    await expect(card(page, 'Cleaning').getByText('Could not confirm')).toBeVisible();

    await page.getByRole('button', { name: 'Paste a quote for Notice period' }).click();
    await page.getByLabel('Quote from the lease for Notice period').fill('notice period is one');
    await page.getByRole('button', { name: 'Use this quote' }).click();
    await expect(card(page, 'Notice period').getByText('(Set by you)')).toBeVisible();

    await page.getByRole('button', { name: 'Copy questions' }).click();
    await expect(page.getByRole('status')).toHaveText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.replaceAll('\r\n', '\n').split('\n')).toEqual([
      'By what date will the deposit be refunded after I hand over?',
      'How is rent charged if I leave part way through a month?',
      'Is cleaning charged when I leave, and how much?',
      'Which repairs can be deducted, and is normal wear and tear excluded?',
      'Will you give an itemised statement and receipts for any deduction?',
      'Will we inspect the home together at handover and record its condition?',
      'How are electricity and water charged, and at what rate?',
    ]);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);

    await page.reload();
    await expect(card(page, 'Notice period').getByText('(Set by you)')).toBeVisible();
  });
});

test('T-217 F4-AC4, F4-R7 keyword review, and an edit clears the rows', async ({ page }) => {
  await openReview(page);
  await runReview(page, 'Continue');
  await expect(page.getByText(/^AI matching was not used/)).toBeVisible();
  const outcomes = await page
    .getByRole('paragraph')
    .filter({ hasText: /^Outcome: / })
    .allTextContents();
  expect(outcomes).toHaveLength(10);
  for (const outcome of outcomes) {
    expect(outcome).toMatch(
      /^Outcome: (Found|Could not confirm) \(Keyword match, read the quote\)$/,
    );
  }
  await page.getByLabel('Lease text').press('End');
  await page.getByLabel('Lease text').pressSequentially(' ');
  await expect(page.getByText('The lease text changed. Run the review again.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Deposit topics' })).toHaveCount(0);
});

test.describe('T-208 at 320 px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('T-207 T-208 NFR-5 the empty review page fits and has no axe violations', async ({
    page,
  }) => {
    await page.goto('/lease-review');
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });
});
