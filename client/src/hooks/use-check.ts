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
  /** F1-R14. Runs the check again on the facts of the next render, if results are shown. */
  readonly refresh: () => void;
}

/**
 * Holds the facts of the last check. Results are derived from them by shared/. `startsChecked`
 * runs the check on the first render (F1-R17).
 */
export function useCheck(workspace: Workspace, startsChecked: boolean): Check {
  const [snapshot, setSnapshot] = useState<CheckSnapshot | null>(() =>
    startsChecked ? takeSnapshot(workspace) : null,
  );
  const [isRefreshDue, setIsRefreshDue] = useState(false);
  if (isRefreshDue) {
    // This render has the workspace that the matches were applied to.
    setIsRefreshDue(false);
    setSnapshot(snapshot === null ? null : (takeSnapshot(workspace) ?? snapshot));
  }
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
    refresh: () => setIsRefreshDue(true),
  };
}
