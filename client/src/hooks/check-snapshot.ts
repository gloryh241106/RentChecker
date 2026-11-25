import { evaluate, formatRupees, isCheckableTenancy } from '../shared.js';
import type { CheckResult, MessageInput, Workspace } from '../shared.js';

/** The facts of the last check, kept in memory only (FRONTEND.md useCheck). */
export interface CheckSnapshot {
  /** Carries the quotes and the repair entries that the message needs (F3). */
  readonly input: MessageInput;
  readonly key: string;
}

/** F1-R14: what an edit can change. A text key makes "same facts again" a plain comparison. */
function keyOf(workspace: Workspace): string {
  const { tenancy, deductions, evidence, repairs, leaseText } = workspace;
  return JSON.stringify([tenancy, deductions, evidence, repairs, leaseText]);
}

/** F1-R3. Null when the check cannot run yet. */
export function takeSnapshot(workspace: Workspace): CheckSnapshot | null {
  const { tenancy, deductions, evidence, repairs } = workspace;
  if (!isCheckableTenancy(tenancy) || deductions.length === 0) {
    return null;
  }
  return { input: { tenancy, deductions, evidence, repairs }, key: keyOf(workspace) };
}

/** F1-R14. */
export function isOutOfDate(snapshot: CheckSnapshot | null, workspace: Workspace): boolean {
  return snapshot !== null && snapshot.key !== keyOf(workspace);
}

export function checkResultOf(snapshot: CheckSnapshot | null): CheckResult | null {
  return snapshot === null ? null : evaluate(snapshot.input);
}

/** UI.md: said in the status region when a check finishes. */
export function describeCheck({ totals }: CheckResult): string {
  return (
    `Check finished. Ask about ${formatRupees(totals.askAboutPaise)}, ` +
    `awaiting proof ${formatRupees(totals.awaitingProofPaise)}, ` +
    `unclear ${formatRupees(totals.unclearPaise)}.`
  );
}
