import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PROMPT,
  answer,
  press,
  rows,
  send,
  status,
  type,
} from '../../../test-support/assistant.js';
import { expectNoAxeViolations } from '../../../test-support/axe.js';
import { FakeAssistantApi } from '../../../test-support/fake-assistant-api.js';
import { renderApp } from '../../../test-support/render-app.js';

describe('prompt assistant on Home', () => {
  it('F9-R1 asks for consent once, and Cancel sends nothing (T-252)', async () => {
    const { user, assistantApi } = renderApp();
    await type(user, PROMPT);
    expect(screen.getByRole('dialog').textContent).toContain('Google Gemini');
    await press(user, 'Cancel');
    expect(assistantApi.prompts).toEqual([]);
    expect(document.activeElement).toBe(screen.getByLabelText('Your message'));
    await press(user, 'Read my message');
    await press(user, 'Continue');
    await type(user, 'Who pays for painting?');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(assistantApi.prompts).toEqual([PROMPT, 'Who pays for painting?']);
  });

  it('F9-AC1 lists every fact with its words, and fills in Moving out (T-253)', async () => {
    const { user, storage } = await send(PROMPT);
    expect(status()).toBe('Your message was read.');
    expect(document.activeElement?.textContent).toBe(
      'You want to check deductions from your deposit',
    );
    expect(rows().map((row) => row.querySelector('.font-semibold')?.textContent)).toEqual([
      'Deposit: ₹30,000',
      'Monthly rent: ₹15,000',
      'Handover date: 15 June 2026',
      'Painting, ₹12,000, Cost',
      'Service fee, ₹3,000, Fixed fee',
    ]);
    expect(rows()[2]?.textContent).toContain('From your words: “15 June 2026”');
    expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull();
    await expectNoAxeViolations();

    await press(user, 'Use these details');
    expect(screen.getByRole('heading', { level: 1, name: 'Lease' })).toBeTruthy();
    expect(status()).toBe('Details filled in. Check them before you run the check.');
    await vi.waitFor(() =>
      expect(JSON.parse(storage.raw ?? '{}')).toMatchObject({
        tenancy: { depositPaise: 3_000_000, handoverDate: '2026-06-15' },
        deductions: [{ label: 'Painting' }, { label: 'Service fee' }],
      }),
    );
  });

  it('F9-AC2 asks for what is missing, and sends nothing more (T-254)', async () => {
    const { user, assistantApi } = await send('My landlord kept 12,000 for painting');
    await answer(user, 'How much deposit did you pay?', '30k');
    expect(document.activeElement).toBe(
      screen.getByLabelText('How much is the rent for one month?'),
    );
    await answer(user, 'How much is the rent for one month?', '15000');
    const date = 'On which day did you give the place back?';
    await answer(user, date, 'about a month ago');
    expect(screen.getByText(/^Write one full date with its year/)).toBeTruthy();
    await expectNoAxeViolations();
    await user.clear(screen.getByLabelText(date));
    await answer(user, date, '06/07/2026');
    expect(document.activeElement?.textContent).toBe('Use these details');
    expect(screen.getByText(/was read day first, as 6 July 2026/)).toBeTruthy();
    expect(rows()[0]?.textContent).toContain('Your answer');
    expect(assistantApi.prompts).toHaveLength(1);
  });

  it('F9-R8 a skipped question leads to the step that still needs it (T-254)', async () => {
    const { user } = await send(PROMPT.replace('Deposit was 30,000, ', ''));
    await press(user, 'Skip this question');
    await press(user, 'Use these details');
    expect(screen.getByRole('heading', { level: 1, name: 'Details' })).toBeTruthy();
    expect(screen.getByLabelText(/^Monthly rent/)).toHaveProperty('value', '15,000');
  });

  it('F9-R9 Change asks again, and Remove takes a deduction out (T-255)', async () => {
    const { user } = await send(PROMPT);
    await press(user, 'Remove Service fee');
    expect(rows()).toHaveLength(4);
    await press(user, 'Change deposit');
    expect(document.activeElement).toBe(screen.getByLabelText('How much deposit did you pay?'));
    await answer(user, 'How much deposit did you pay?', '35,000');
    expect(rows()[0]?.textContent).toContain('Deposit: ₹35,000');
  });

  it('F9-AC5 warns about likely mistakes and changes nothing (T-256)', async () => {
    await send('Kept 1,20,000 for painting. Deposit 30,000. Rent 15,000. I left on 15 June 2026.');
    expect(screen.getByText('Please check')).toBeTruthy();
    expect(screen.getByText(/^Painting is ₹1,20,000, more than the whole deposit/)).toBeTruthy();
    expect(screen.getByText('Painting, ₹1,20,000, Cost')).toBeTruthy();
    await expectNoAxeViolations();
  });

  it('F9-R2, F9-R6 shows a doubt of the AI, and two values for one fact (T-256)', async () => {
    const assistantApi = new FakeAssistantApi();
    assistantApi.reads({
      facts: [
        { kind: 'deposit', source: '30,000', label: null },
        { kind: 'deposit', source: '35,000', label: null },
      ],
      doubts: [{ source: '31 June', reason: 'date' }],
    });
    await send('deposit 30,000 or 35,000, left 31 June', { assistantApi });
    expect(screen.getByText('Check “31 June”: this date may be wrong.')).toBeTruthy();
    expect(screen.getByText(/gives the deposit as ₹30,000 and as ₹35,000/)).toBeTruthy();
    expect(screen.getByLabelText('How much deposit did you pay?')).toBeTruthy();
  });
});
