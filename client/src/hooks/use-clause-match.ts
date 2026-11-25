import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '../api/api-error.js';
import type { ClauseApi } from '../api/clause-api.js';
import type { ClauseMatch, Deduction, MatchMode, MatchWarning } from '../shared.js';
import { planMatch, requestKey } from './match-request.js';

export type MatchPhase =
  | { readonly name: 'idle' }
  | { readonly name: 'consent' }
  | { readonly name: 'running' }
  | { readonly name: 'failed'; readonly error: ApiError }
  | {
      readonly name: 'done';
      readonly mode: MatchMode;
      readonly warnings: readonly MatchWarning[];
    };

const IDLE: MatchPhase = { name: 'idle' };
export const FINISHED_TEXT = 'Clause matching finished.';
export const FAILED_TEXT = 'Clause matching failed.';

interface Options {
  readonly api: ClauseApi;
  readonly leaseText: string;
  readonly deductions: readonly Deduction[];
  /** The `evidence/apply` action. */
  readonly applyMatches: (matches: readonly ClauseMatch[]) => void;
  readonly announce: (message: string) => void;
}

export interface ClauseMatching {
  readonly phase: MatchPhase;
  readonly blockers: readonly string[];
  /** Opens the consent notice. */
  readonly start: () => void;
  /** The tenant chose Continue. */
  readonly confirm: () => void;
  /** The notice closed without Continue. Nothing is sent (F2-AC12). */
  readonly dismiss: () => void;
}

/**
 * FR-8, FR-12, F2-R2, F2-R3. Consent, then one call, then evidence. A run is dropped when the
 * lease text or the items change, or the page is left, so a late answer never lands on other
 * data.
 */
export function useClauseMatch(options: Options): ClauseMatching {
  const { api, leaseText, deductions, applyMatches, announce } = options;
  const plan = useMemo(() => planMatch(leaseText, deductions), [leaseText, deductions]);
  const key = requestKey(plan.request);
  const [phase, setPhase] = useState<MatchPhase>(IDLE);
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
      setPhase(IDLE);
    },
    [key],
  );

  async function run(): Promise<void> {
    if (plan.request === null) {
      return;
    }
    const mine = new AbortController();
    controller.current?.abort();
    controller.current = mine;
    setPhase({ name: 'running' });
    const result = await api.matchClauses(plan.request, mine.signal);
    if (mine.signal.aborted) {
      return;
    }
    if (result.ok) {
      applyMatches(result.value.matches);
      setPhase({ name: 'done', mode: result.value.mode, warnings: result.value.warnings });
      announce(FINISHED_TEXT);
    } else {
      setPhase({ name: 'failed', error: result.error });
      announce(FAILED_TEXT);
    }
  }

  return {
    phase,
    blockers: plan.blockers,
    start: () =>
      setPhase((now) =>
        plan.request === null || now.name === 'running' ? now : { name: 'consent' },
      ),
    confirm: () => void run(),
    dismiss: () => setPhase((now) => (now.name === 'consent' ? IDLE : now)),
  };
}
