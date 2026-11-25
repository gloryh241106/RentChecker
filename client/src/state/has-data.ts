import type { Workspace } from '../shared.js';

type Check = (workspace: Workspace) => boolean;

const CHECKS: readonly Check[] = [
  ({ deductions }) => deductions.length > 0,
  ({ repairs }) => repairs.length > 0,
  ({ leaseText, reviewLeaseText }) => leaseText !== '' || reviewLeaseText !== '',
  ({ bill, leaseReview }) => bill !== undefined || leaseReview.length > 0,
  ({ draftMessage }) => draftMessage !== undefined && draftMessage !== '',
  ({ tenancy }) =>
    Object.entries(tenancy).some(
      ([key, value]) =>
        value !== undefined &&
        !(key === 'partialMonth' && value === 'unsure') &&
        !(key === 'handoverDayCounts' && value === true),
    ),
];

/** Whether replacing the workspace would lose something the tenant entered (F1-R17). */
export function hasData(workspace: Workspace): boolean {
  return CHECKS.some((check) => check(workspace));
}
