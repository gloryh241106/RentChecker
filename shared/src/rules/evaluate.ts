import type { Deduction } from '../schemas/deduction.js';
import type { ClauseEvidence, EvidenceState } from '../schemas/evidence.js';
import type { CheckableTenancy } from '../schemas/tenancy.js';
import type { Assessment } from './assessment.js';
import { splitIntoBuckets } from './buckets.js';
import type { Buckets } from './buckets.js';
import type { PrimaryResult, ReasonCode } from './codes.js';
import { findDuplicateIds } from './duplicates.js';
import { calculateExpected } from './expected/calculate.js';
import type { RentDays } from './expected/rent.js';
import { findLinkedRepairs } from './linked-repairs.js';
import type { LinkedRepairs, RepairLink } from './linked-repairs.js';
import { listReasons } from './reasons.js';
import { primaryResult } from './result.js';
import { calculateTotals } from './totals.js';
import type { Totals } from './totals.js';

/** The facts of a check. A Workspace with a checkable tenancy fits. */
export interface CheckInput {
  readonly tenancy: CheckableTenancy;
  readonly deductions: readonly Deduction[];
  readonly evidence: readonly Pick<ClauseEvidence, 'deductionId' | 'state'>[];
  readonly repairs: readonly RepairLink[];
}

export interface DeductionResult extends LinkedRepairs {
  readonly deductionId: string;
  readonly amountPaise: number;
  /** Null when unknown. 0 for a duplicate (D-25). */
  readonly expectedPaise: number | null;
  /** Null for every kind but rent. */
  readonly rentDays: RentDays | null;
  readonly result: PrimaryResult;
  /** In D-37 order. */
  readonly reasons: readonly ReasonCode[];
  readonly buckets: Buckets;
}

export interface CheckResult {
  /** In the order the deductions were entered (F1-R10). */
  readonly deductions: readonly DeductionResult[];
  readonly totals: Totals;
}

/** What one deduction needs to know about the rest of the case. */
interface CaseFacts {
  readonly tenancy: CheckableTenancy;
  readonly repairs: readonly RepairLink[];
  readonly duplicateIds: ReadonlySet<string>;
  readonly stateById: ReadonlyMap<string, EvidenceState>;
}

function assess(deduction: Deduction, facts: CaseFacts, linked: LinkedRepairs): Assessment {
  const calculation = calculateExpected(deduction, facts.tenancy);
  const isDuplicate = facts.duplicateIds.has(deduction.id);
  return {
    kind: deduction.kind,
    amountPaise: deduction.amountPaise,
    calculatedPaise: calculation.expectedPaise,
    expectedPaise: isDuplicate ? 0 : calculation.expectedPaise, // D-25
    isDuplicate,
    evidenceState: facts.stateById.get(deduction.id) ?? 'unconfirmed', // D-30
    rentDays: calculation.rentDays,
    isPartialMonthUnsure: facts.tenancy.partialMonth === 'unsure',
    hasReportedRepair: linked.reportedRepairIds.length > 0,
  };
}

function evaluateDeduction(deduction: Deduction, facts: CaseFacts): DeductionResult {
  const linked = findLinkedRepairs(deduction.id, facts.repairs, facts.tenancy.handoverDate);
  const assessment = assess(deduction, facts, linked);
  const result = primaryResult(assessment);
  return {
    ...linked,
    deductionId: deduction.id,
    amountPaise: assessment.amountPaise,
    expectedPaise: assessment.expectedPaise,
    rentDays: assessment.rentDays,
    result,
    reasons: listReasons(assessment),
    buckets: splitIntoBuckets(assessment, result),
  };
}

/** D-20 to D-43 for one tenancy. Pure: the same facts always give the same result. */
export function evaluate(input: CheckInput): CheckResult {
  const facts: CaseFacts = {
    tenancy: input.tenancy,
    repairs: input.repairs,
    duplicateIds: findDuplicateIds(input.deductions),
    stateById: new Map(input.evidence.map(({ deductionId, state }) => [deductionId, state])),
  };
  const deductions = input.deductions.map((deduction) => evaluateDeduction(deduction, facts));
  return { deductions, totals: calculateTotals(deductions, input.tenancy) };
}
