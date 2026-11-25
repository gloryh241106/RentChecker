import { useMemo, useState } from 'react';
import type { CheckResult, Workspace } from '../shared.js';
import { checkResultOf, isOutOfDate, takeSnapshot } from './check-snapshot.js';
import type { CheckSnapshot } from './check-snapshot.js';

export interface Check {
  /** Null until a check was run in this session. */
  readonly result: CheckResult | null;
  /** The facts that were checked, for the cards (labels, repairs). */
  readonly snapshot: CheckSnapshot | null;
  readonly isOutOfDate: boolean;
  /** F1-R9. Returns the result, or null when the facts are not complete (F1-R3). */
  readonly run: () => CheckResult | null;
}

/** Holds the facts of the last check. Results are derived from them by shared/. */
export function useCheck(workspace: Workspace): Check {
  const [snapshot, setSnapshot] = useState<CheckSnapshot | null>(null);
  const result = useMemo(() => checkResultOf(snapshot), [snapshot]);
  return {
    result,
    snapshot,
    isOutOfDate: isOutOfDate(snapshot, workspace),
    run: () => {
      const next = takeSnapshot(workspace);
      setSnapshot(next);
      return checkResultOf(next);
    },
  };
}
