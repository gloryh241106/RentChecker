import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '../api/api-error.js';
import type { ClauseApi } from '../api/clause-api.js';
import type { ClauseMatch, MatchMode, MatchWarning } from '../shared.js';
import { requestKey } from './match-request.js';
import type { MatchPlan } from './match-request.js';

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

export interface MatchRunOptions {
  readonly api: ClauseApi;
  readonly plan: MatchPlan;
  /** The `evidence/apply` or `review/apply` action. */
  readonly applyMatches: (matches: readonly ClauseMatch[]) => void;
  readonly announce: (message: string) => void;
  /** What the status region says when a run ends. */
  readonly messages: { readonly finished: string; readonly failed: string };
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
 * FR-8, FR-12, F2-R2, F2-R3, F4-R2. Consent, then one call, then matches. A run is dropped when
 * the request changes (the lease text or the items), or the page is left, so a late answer never
 * lands on other data.
 */
export function useMatchRun(options: MatchRunOptions): ClauseMatching {
  const { api, plan, applyMatches, announce, messages } = options;
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
      announce(messages.finished);
    } else {
      setPhase({ name: 'failed', error: result.error });
      announce(messages.failed);
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
