import { describe, expect, it } from 'vitest';
import { cost } from '../../test-support/cases.js';
import { messageFor } from './message-case.js';

const UNPROVEN = { label: 'Repainting', evidence: 'verified' } as const;
const CHARGE = cost(2_000_000, UNPROVEN);
const GAP_OPENING =
  'You stated a refund of ₹7,000. Together with the deductions of ₹20,000, that is ₹3,000 less than the deposit of ₹30,000. Could you please explain the difference?';

describe('F3 refund gap and repairs', () => {
  it('F3-AC8 F3-R8 asks about the difference in the opening paragraph', () => {
    const text = messageFor({ statedRefundPaise: 700_000 }, [CHARGE]);
    const opening = text?.split('\n\n')[1] ?? '';
    expect(opening).toContain(GAP_OPENING);
    expect(opening).toContain('The deposit was ₹30,000 and the total deducted is ₹20,000.');
  });

  it.each([
    ['0', 1_000_000],
    ['negative', 1_200_000],
  ])('F3-R8 gives no gap line when the gap is %s', (_name, refundPaise) => {
    const text = messageFor({ statedRefundPaise: refundPaise }, [CHARGE]);
    expect(text).not.toContain('You stated a refund');
  });

  it('F3-R8 gives no gap line when no refund was stated', () => {
    expect(messageFor({}, [CHARGE])).not.toContain('You stated a refund');
  });

  it('F3-AC7 F3-R7 gives the date, description and recipient of a repair before handover', () => {
    const text = messageFor({}, [cost(2_000_000, { ...UNPROVEN, repairDate: '2026-03-10' })], {
      repair: { description: 'Damp on the wall', reportedTo: 'Mr Rao' },
    });
    expect(text).toContain('I reported a repair on 10 March 2026 to Mr Rao: Damp on the wall');
  });

  it('F3-AC7 F3-R7 leaves out a repair dated after the handover date', () => {
    const text = messageFor({}, [cost(2_000_000, { ...UNPROVEN, repairDate: '2026-07-01' })]);
    expect(text).not.toContain('I reported a repair');
    expect(text).not.toContain('Leaking tap');
  });

  it('F3-R7 puts the repair line after the quote and before the request', () => {
    const text = messageFor({}, [cost(2_000_000, { ...UNPROVEN, repairDate: '2026-03-10' })], {
      quotes: { 0: 'Walls are repainted at the tenant cost.' },
    });
    const lines = (text ?? '').split('\n');
    const at = (start: string): number => lines.findIndex((line) => line.startsWith(start));
    const order = [at('The lease says'), at('I reported a repair'), at('Could you please send me')];
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((position) => position >= 0)).toBe(true);
  });
});
