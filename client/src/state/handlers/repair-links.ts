import type { Repair } from '../../shared.js';

function unlinked(repair: Repair): Repair {
  return {
    id: repair.id,
    date: repair.date,
    description: repair.description,
    reportedTo: repair.reportedTo,
  };
}

/** F1-R16. Afterwards exactly `repairIds` are linked to the deduction, and each to it alone. */
export function linkRepairs(
  repairs: readonly Repair[],
  deductionId: string,
  repairIds: readonly string[],
): Repair[] {
  return repairs.map((repair) => {
    if (repairIds.includes(repair.id)) {
      return { ...repair, deductionId };
    }
    return repair.deductionId === deductionId ? unlinked(repair) : repair;
  });
}

/** Removing a deduction removes its links and keeps the log entries. */
export function unlinkDeduction(repairs: readonly Repair[], deductionId: string): Repair[] {
  return linkRepairs(repairs, deductionId, []);
}
