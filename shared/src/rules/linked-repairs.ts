import { isAfter } from '../dates.js';
import type { Repair } from '../schemas/repair.js';

export type RepairLink = Pick<Repair, 'id' | 'date' | 'deductionId'>;

export interface LinkedRepairs {
  /** Every linked repair, in log order. */
  readonly repairIds: readonly string[];
  /** The linked repairs that give REPAIR_REPORTED (D-37). */
  readonly reportedRepairIds: readonly string[];
}

export function findLinkedRepairs(
  deductionId: string,
  repairs: readonly RepairLink[],
  handoverDate: string,
): LinkedRepairs {
  const linked = repairs.filter((repair) => repair.deductionId === deductionId);
  const reported = linked.filter((repair) => !isAfter(repair.date, handoverDate));
  return {
    repairIds: linked.map((repair) => repair.id),
    reportedRepairIds: reported.map((repair) => repair.id),
  };
}
