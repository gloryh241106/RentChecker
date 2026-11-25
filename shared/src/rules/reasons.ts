import { aboveExpectedPaise, differenceFromExpected, hasClauseState } from './assessment.js';
import type { Assessment } from './assessment.js';
import { REASON_CODES } from './codes.js';
import type { ReasonCode } from './codes.js';
import { isPartialMonth } from './expected/rent.js';
import { KIND_RULES } from './kinds.js';

type Predicate = (assessment: Assessment) => boolean;

/** Rent with 0 days used has RENT_OUTSIDE_TENANCY instead of an "above" reason. */
function isRentOutsideTenancy({ rentDays }: Assessment): boolean {
  return rentDays?.used === 0;
}

function isAbove(reason: ReasonCode): Predicate {
  return (assessment) =>
    KIND_RULES[assessment.kind].aboveReason === reason &&
    !assessment.isDuplicate &&
    !isRentOutsideTenancy(assessment) &&
    aboveExpectedPaise(assessment) > 0;
}

/** Looks at D-20 to D-24, so a duplicate without a receipt still lists RECEIPT_MISSING. */
function lacksFacts(reason: ReasonCode): Predicate {
  return ({ kind, calculatedPaise }) =>
    calculatedPaise === null && KIND_RULES[kind].whenUnknown?.reason === reason;
}

/** Sign of amount minus expected, where a duplicate has nothing to compare with. */
function hasDifference(sign: -1 | 0): Predicate {
  return ({ amountPaise, expectedPaise, isDuplicate }) => {
    const difference = differenceFromExpected(amountPaise, expectedPaise);
    return !isDuplicate && difference !== null && Math.sign(difference) === sign;
  };
}

/** D-37. A new code does not compile until it has a predicate. */
const REASON_APPLIES: Readonly<Record<ReasonCode, Predicate>> = {
  DUPLICATE_CHARGE: ({ isDuplicate }) => isDuplicate,
  ABOVE_PRORATED_RENT: isAbove('ABOVE_PRORATED_RENT'),
  RENT_OUTSIDE_TENANCY: isRentOutsideTenancy,
  ABOVE_METER_TOTAL: isAbove('ABOVE_METER_TOTAL'),
  ABOVE_LEASE_AMOUNT: isAbove('ABOVE_LEASE_AMOUNT'),
  ABOVE_RECEIPT: isAbove('ABOVE_RECEIPT'),
  CLAUSE_NOT_FOUND: (assessment) => hasClauseState(assessment, 'none'),
  CLAUSE_UNCONFIRMED: (assessment) => hasClauseState(assessment, 'unconfirmed'),
  CLAUSE_EXCLUDES: (assessment) => hasClauseState(assessment, 'excludes'),
  FACTS_MISSING: lacksFacts('FACTS_MISSING'),
  RECEIPT_MISSING: lacksFacts('RECEIPT_MISSING'),
  AMOUNT_NOT_STATED: lacksFacts('AMOUNT_NOT_STATED'),
  ASSUMED_PER_DAY: ({ rentDays, isPartialMonthUnsure }) =>
    isPartialMonthUnsure && rentDays !== null && isPartialMonth(rentDays),
  BELOW_EXPECTED: hasDifference(-1),
  REPAIR_REPORTED: ({ hasReportedRepair }) => hasReportedRepair,
  MATCHES: hasDifference(0),
};

/** Every reason that applies, in D-37 order. */
export function listReasons(assessment: Assessment): readonly ReasonCode[] {
  return REASON_CODES.filter((code) => REASON_APPLIES[code](assessment));
}
