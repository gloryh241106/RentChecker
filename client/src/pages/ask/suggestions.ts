import { MAX_SHORT_TEXT_LENGTH, sortRepairs } from '../../shared.js';
import type { Workspace } from '../../shared.js';

const MAX_SUGGESTIONS = 5;
const MAX_DEDUCTION_QUESTIONS = 3;

const FIXED_QUESTIONS = [
  'When is the deposit refunded?',
  'How much notice must I give?',
  'Can the rent increase?',
  'Who pays for repairs?',
  'Is there a lock-in period?',
];

type Facts = Pick<Workspace, 'deductions' | 'repairs'>;

/** F7-R5. The questions that fit what the tenant entered, without those already answered. */
export function suggestQuestions(
  { deductions, repairs }: Facts,
  answered: readonly string[],
): readonly string[] {
  const aboutDeductions = deductions
    .filter(({ kind }) => kind !== 'rent')
    .slice(0, MAX_DEDUCTION_QUESTIONS)
    .map(({ label }) => `Can the landlord charge me for ${label}?`);
  const latest = sortRepairs(repairs).at(-1);
  const aboutRepair =
    latest === undefined ? [] : [`Who pays for this repair: ${latest.description}?`];
  return [...new Set([...aboutDeductions, ...aboutRepair, ...FIXED_QUESTIONS])]
    .filter((question) => question.length <= MAX_SHORT_TEXT_LENGTH && !answered.includes(question))
    .slice(0, MAX_SUGGESTIONS);
}
