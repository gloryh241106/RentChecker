import { formatRupees } from '../money.js';
import type { CheckInput, CheckResult } from '../rules/evaluate.js';
import type { ClauseEvidence } from '../schemas/evidence.js';
import type { Repair } from '../schemas/repair.js';
import { buildBlock, isAsked } from './blocks.js';
import type { BlockSource } from './blocks.js';
import { joinParts } from './text.js';

/** A CheckInput that also carries the quotes and the repair entries (F3 Inputs). */
export interface MessageInput extends Omit<CheckInput, 'evidence' | 'repairs'> {
  readonly evidence: readonly Pick<ClauseEvidence, 'deductionId' | 'state' | 'quote'>[];
  readonly repairs: readonly Repair[];
}

const GREETING = "Dear [landlord's name],";
const CLOSING =
  'Could you please also send me an itemised statement of all deductions, and the receipts or bills for each cost?';
const SIGN_OFF = 'Thank you,\n[your name]';

/** F3-R8. A question about the difference, with the three amounts it comes from. */
function refundGapSentence({ tenancy }: MessageInput, { totals }: CheckResult): string[] {
  const { refundGapPaise, isRefundGapShown, totalDeductedPaise } = totals;
  if (!isRefundGapShown || refundGapPaise === null || tenancy.statedRefundPaise === undefined) {
    return [];
  }
  return [
    `You stated a refund of ${formatRupees(tenancy.statedRefundPaise)}. ` +
      `Together with the deductions of ${formatRupees(totalDeductedPaise)}, ` +
      `that is ${formatRupees(refundGapPaise)} less than the deposit of ${formatRupees(tenancy.depositPaise)}. ` +
      'Could you please explain the difference?',
  ];
}

function opening(input: MessageInput, result: CheckResult): string {
  return [
    'I am writing about the deductions from my deposit. ' +
      `The deposit was ${formatRupees(input.tenancy.depositPaise)} ` +
      `and the total deducted is ${formatRupees(result.totals.totalDeductedPaise)}. ` +
      'Could you please help me understand the charges below?',
    ...refundGapSentence(input, result),
  ].join(' ');
}

/** The deductions that need asking, in input order, with what their block reads. */
function blockSources(input: MessageInput, check: CheckResult): BlockSource[] {
  return check.deductions.flatMap((result) => {
    const deduction = input.deductions.find(({ id }) => id === result.deductionId);
    if (deduction === undefined || !isAsked(result.result)) {
      return [];
    }
    const evidence = input.evidence.find(({ deductionId }) => deductionId === deduction.id);
    const reported = new Set(result.reportedRepairIds); // F3-R7
    return [
      {
        deduction,
        result,
        asked: result.result,
        quote: evidence?.quote ?? null,
        repairs: input.repairs.filter((repair) => reported.has(repair.id)),
      },
    ];
  });
}

/**
 * F3-R1 to R9, R16. The message to the landlord, or null when nothing needs asking (F3-R15).
 * Built from a template: no AI, no I/O. `result` must be `evaluate(input)`.
 */
export function buildMessage(input: MessageInput, result: CheckResult): string | null {
  const sources = blockSources(input, result);
  if (sources.length === 0) {
    return null;
  }
  const blocks = sources.map((source, index) => buildBlock(index + 1, source));
  return joinParts([GREETING, opening(input, result), ...blocks, CLOSING, SIGN_OFF]);
}
