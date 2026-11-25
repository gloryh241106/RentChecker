import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAINTING, caseWith } from '../../test-support/builders.js';
import { RESULTS_ROUTE, renderApp, renderSampleResults } from '../../test-support/render-app.js';
import { createSampleWorkspace } from '../../state/sample.js';
import { expectNoAxeViolations } from '../../test-support/axe.js';

const BOX = 'Message to your landlord';
const REGENERATE_ASK = 'Regenerating will replace your edits. Continue?';

/** The sample case, checked, on the Message step. */
async function openMessage() {
  const view = renderSampleResults();
  await view.user.click(screen.getByRole('button', { name: 'Run check' }));
  await view.user.click(screen.getByRole('button', { name: 'Next' }));
  return view;
}

function box(): HTMLTextAreaElement {
  return screen.getByRole('textbox', { name: BOX });
}

describe('Message step', () => {
  it('T-168 F3-AC1 the sample case gets blocks for the three deductions, in order', async () => {
    await openMessage();
    const lines = box().value.split('\n');
    const heads = lines.filter((line) => /^\d\. /.test(line));
    expect(heads).toEqual([
      '1. Repainting: ₹12,000',
      '2. June rent: ₹15,000',
      '3. Service fee: ₹3,000',
    ]);
    expect(screen.getByText('Replace the text in square brackets before you send.')).toBeTruthy();
    expect(within(screen.getByRole('main')).getByText(/It is not legal advice/)).toBeTruthy();
  });

  it('T-168 F3-AC13 F3-R13 Copy puts the edited text on the clipboard and announces Copied', async () => {
    const { user } = await openMessage();
    await user.type(box(), ' EDIT');
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe(box().value);
    expect(box().value.endsWith(' EDIT')).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Copied');
  });

  it('T-168 F3-R13 a blocked clipboard selects the text and shows the copy help', async () => {
    const { user } = await openMessage();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByText('Press Ctrl+C or long-press to copy.')).toBeTruthy();
    expect(document.activeElement).toBe(box());
    expect(box().selectionEnd - box().selectionStart).toBe(box().value.length);
  });

  it('T-168 F3-AC10 F3-R12 Cancel keeps the edit and Continue replaces it with the template', async () => {
    const { user } = await openMessage();
    const template = box().value;
    await user.type(box(), ' EDIT');
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(screen.getByRole('dialog').textContent).toContain(REGENERATE_ASK);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(box().value).toBe(`${template} EDIT`);
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(box().value).toBe(template);
  });

  it('F3-R12 an edited draft says so, because a later check does not change it', async () => {
    const { user } = await openMessage();
    expect(screen.queryByText(/^You edited this message/)).toBeNull();
    await user.type(box(), ' EDIT');
    expect(screen.getByText(/^You edited this message/)).toBeTruthy();
  });

  it('F3-R12 Regenerate with no edits does not ask', async () => {
    const { user } = await openMessage();
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('F3-R11 edits are kept in the stored workspace and shown again after a reload', async () => {
    const { user, storage, unmount } = await openMessage();
    await user.type(box(), ' EDIT');
    unmount();
    const again = renderApp({ route: '/move-out?step=message', storage });
    expect(box().value.endsWith(' EDIT')).toBe(true);
    expect(String(again.storage.raw)).toContain(' EDIT');
  });

  it('F3-R14 an out-of-date check disables Regenerate, says why and flags the draft', async () => {
    const { user } = renderSampleResults();
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    await user.click(screen.getByRole('link', { name: /Lease/ }));
    await user.type(screen.getByRole('textbox', { name: /Lease text/ }), ' more');
    await user.click(screen.getByRole('link', { name: /Message/ }));
    const regenerate = screen.getByRole('button', { name: 'Regenerate' });
    expect((regenerate as HTMLButtonElement).disabled).toBe(true);
    const help = screen.getByText('Run the check again first.');
    expect(regenerate.getAttribute('aria-describedby')).toBe(help.id);
    expect(screen.getByText('This draft may be out of date.')).toBeTruthy();
  });

  it('T-169 F3-R15 with no check and no draft the step says to run the check, with no Copy', () => {
    renderApp({ route: '/move-out?step=message', stored: createSampleWorkspace() });
    expect(screen.getByText('Run the check first.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: BOX })).toBeNull();
  });

  it('F3-R14 F3-R15 a stored draft with no check is shown, flagged and cannot be regenerated', () => {
    const stored = { ...createSampleWorkspace(), draftMessage: 'My own words' };
    renderApp({ route: '/move-out?step=message', stored });
    expect(box().value).toBe('My own words');
    expect(screen.getByText('This draft may be out of date.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Regenerate' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText('Run the check first.')).toBeTruthy();
  });

  it('T-169 F3-AC11 when every deduction is supported there is a note and no message or Copy', async () => {
    const supported = { ...PAINTING, receiptAmountPaise: PAINTING.amountPaise };
    const stored = caseWith(
      [supported],
      {},
      {
        leaseText: 'The tenant shall pay for repainting the walls.',
        evidence: [
          { deductionId: 'd1', state: 'verified', quote: 'repainting the walls', source: 'user' },
        ],
      },
    );
    const { user } = renderApp({ route: RESULTS_ROUTE, stored });
    await user.click(screen.getByRole('button', { name: 'Run check' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Nothing to ask about. Every deduction is supported.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: BOX })).toBeNull();
  });

  it('UI.md the Message step is listed fifth, has an h1 and no accessibility violations', async () => {
    await openMessage();
    const names = screen.getByRole('navigation', { name: 'Steps' }).textContent;
    expect(names?.indexOf('Results')).toBeLessThan(names?.indexOf('Message') ?? -1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Message');
    await expectNoAxeViolations();
  });
});
