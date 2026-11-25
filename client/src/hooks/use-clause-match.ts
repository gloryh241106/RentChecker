import { useMemo } from 'react';
import type { ClauseApi } from '../api/clause-api.js';
import type { ClauseMatch, Deduction } from '../shared.js';
import { NEEDS_DEDUCTION, planMatch } from './match-request.js';
import { useMatchRun } from './use-match-run.js';
import type { ClauseMatching } from './use-match-run.js';

export type { ClauseMatching, MatchPhase } from './use-match-run.js';

export const FINISHED_TEXT = 'Clause matching finished.';
export const FAILED_TEXT = 'Clause matching failed.';
const MESSAGES = { finished: FINISHED_TEXT, failed: FAILED_TEXT };

interface Options {
  readonly api: ClauseApi;
  readonly leaseText: string;
  readonly deductions: readonly Deduction[];
  /** The `evidence/apply` action. */
  readonly applyMatches: (matches: readonly ClauseMatch[]) => void;
  readonly announce: (message: string) => void;
}

/** FR-8, D-31. Rent is never sent, and one request carries every other deduction. */
export function useClauseMatch({ leaseText, deductions, ...rest }: Options): ClauseMatching {
  const plan = useMemo(() => {
    const items = deductions
      .filter(({ kind }) => kind !== 'rent')
      .map(({ id, label }) => ({ id, label }));
    return planMatch(leaseText, items, NEEDS_DEDUCTION);
  }, [leaseText, deductions]);
  return useMatchRun({ ...rest, plan, messages: MESSAGES });
}
