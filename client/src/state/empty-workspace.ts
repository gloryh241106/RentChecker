import type { Workspace } from '../shared.js';

/** One shared value, so the app can tell "nothing was ever entered" by identity. */
export const EMPTY_WORKSPACE: Workspace = {
  schemaVersion: 1,
  tenancy: { partialMonth: 'unsure', handoverDayCounts: true },
  leaseText: '',
  deductions: [],
  evidence: [],
  repairs: [],
  reviewLeaseText: '',
  leaseReview: [],
  isSample: false,
};
