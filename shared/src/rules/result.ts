import { aboveExpectedPaise, hasClauseState } from './assessment.js';
import type { Assessment } from './assessment.js';
import type { PrimaryResult } from './codes.js';
import { KIND_RULES } from './kinds.js';

interface ResultRule {
  readonly result: PrimaryResult;
  readonly applies: (assessment: Assessment) => boolean;
}

function lacksFactsFor(result: PrimaryResult, { kind, calculatedPaise }: Assessment): boolean {
  return calculatedPaise === null && KIND_RULES[kind].whenUnknown?.result === result;
}

/** The first rule that applies wins. D-36 is what is left. */
const RESULT_RULES: readonly ResultRule[] = [
  {
    result: 'not_found', // D-32
    applies: (assessment) => hasClauseState(assessment, 'none'),
  },
  {
    result: 'recalculate', // D-33
    applies: (assessment) => assessment.isDuplicate || aboveExpectedPaise(assessment) > 0,
  },
  {
    result: 'unclear', // D-34
    applies: (assessment) =>
      hasClauseState(assessment, 'unconfirmed', 'excludes') || lacksFactsFor('unclear', assessment),
  },
  {
    result: 'needs_proof', // D-35
    applies: (assessment) => lacksFactsFor('needs_proof', assessment),
  },
];

export function primaryResult(assessment: Assessment): PrimaryResult {
  return RESULT_RULES.find((rule) => rule.applies(assessment))?.result ?? 'supported';
}
