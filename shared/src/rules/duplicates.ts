import type { Deduction } from '../schemas/deduction.js';

function normaliseLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Two deductions with the same key are the same charge (D-25). */
function duplicateKey(deduction: Deduction): string {
  switch (deduction.kind) {
    case 'rent':
      return JSON.stringify([deduction.kind, deduction.rentMonth]);
    case 'metered':
    case 'fixed_fee':
    case 'cost':
      return JSON.stringify([
        deduction.kind,
        normaliseLabel(deduction.label),
        deduction.amountPaise,
      ]);
  }
}

/** D-25. The ids of the deductions that repeat an earlier one. The first copy is not included. */
export function findDuplicateIds(deductions: readonly Deduction[]): ReadonlySet<string> {
  const seenKeys = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const deduction of deductions) {
    const key = duplicateKey(deduction);
    if (seenKeys.has(key)) {
      duplicateIds.add(deduction.id);
    }
    seenKeys.add(key);
  }
  return duplicateIds;
}
