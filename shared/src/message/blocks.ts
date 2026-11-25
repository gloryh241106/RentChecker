import { formatRupees } from '../money.js';
import type { PrimaryResult } from '../rules/codes.js';
import type { DeductionResult } from '../rules/evaluate.js';
import type { Deduction } from '../schemas/deduction.js';
import type { Repair } from '../schemas/repair.js';
import { formatDateText } from '../wording/index.js';
import { messageSentence } from './reason-lines.js';
import { joinLines, oneLine } from './text.js';

/** F3-R2. The results that get a block. */
export type AskedResult = Exclude<PrimaryResult, 'supported'>;

/** F3-R4. The last line of a block depends only on the primary result. */
export const BLOCK_REQUESTS: Readonly<Record<AskedResult, string>> = {
  not_found: 'Could you please tell me which clause of the lease covers this charge?',
  recalculate: 'Could you please check this amount?',
  needs_proof: 'Could you please send me the receipt for this charge?',
  unclear: 'Could you please tell me which clause of the lease applies to this charge?',
};

export function isAsked(result: PrimaryResult): result is AskedResult {
  return result !== 'supported';
}

/** What a block reads besides the result. */
export interface BlockSource {
  readonly deduction: Deduction;
  readonly result: DeductionResult;
  readonly asked: AskedResult;
  readonly quote: string | null;
  /** F3-R7. The linked repairs that give REPAIR_REPORTED, in log order. */
  readonly repairs: readonly Repair[];
}

function reasonLines({ result, repairs }: BlockSource): string[] {
  const facts = {
    amountPaise: result.amountPaise,
    expectedPaise: result.expectedPaise,
    rentDays: result.rentDays,
    repairDates: repairs.map((repair) => repair.date),
  };
  return result.reasons.flatMap((code) => messageSentence(code, facts) ?? []);
}

function repairLine({ date, reportedTo, description }: Repair): string {
  return `I reported a repair on ${formatDateText(date)} to ${oneLine(reportedTo)}: ${oneLine(description)}`;
}

/** D-25: a duplicate has no expected amount, whatever the calculation says. */
function expectedLine({ result }: BlockSource): string[] {
  const isDuplicate = result.reasons.includes('DUPLICATE_CHARGE');
  return result.expectedPaise === null || isDuplicate
    ? []
    : [`Amount I worked out: ${formatRupees(result.expectedPaise)}`];
}

/** One block of F3-R3. The line order is that of the Template. */
export function buildBlock(number: number, source: BlockSource): string {
  const { deduction, result, quote, repairs, asked } = source;
  return joinLines([
    `${number}. ${oneLine(deduction.label)}: ${formatRupees(result.amountPaise)}`,
    ...expectedLine(source),
    ...reasonLines(source),
    ...(quote === null ? [] : [`The lease says: "${oneLine(quote)}"`]),
    ...repairs.map(repairLine),
    BLOCK_REQUESTS[asked],
  ]);
}
