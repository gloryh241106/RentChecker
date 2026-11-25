// The public API of shared/. client/ and server/ import only from here.
export {
  MAX_DEDUCTIONS,
  MAX_LEASE_LENGTH,
  MAX_MATCH_ITEMS,
  MAX_REPAIRS,
  MAX_SHORT_TEXT_LENGTH,
  MIN_MATCH_LEASE_LENGTH,
} from './limits.js';

export type { ParseResult } from './parse-result.js';
export type { NumberInputError } from './hundredths.js';
export type { PositiveAmountError } from './money.js';
export { formatRupees, parseAmount, parsePositiveAmount, parseRate } from './money.js';
export { parseReading } from './readings.js';
export { hasQuoteLength, isQuoteInLease, normaliseText } from './quotes.js';
export type { DateInputError } from './dates.js';
export { parseDate, parseYearMonth } from './dates.js';

export type { SchemaIssue } from './schemas/issues.js';
export type { CheckableTenancy, Tenancy } from './schemas/tenancy.js';
export { isCheckableTenancy, tenancySchema } from './schemas/tenancy.js';
export type { Deduction, DeductionKind, DeductionOf } from './schemas/deduction.js';
export { deductionSchema } from './schemas/deduction.js';
export type {
  ClauseEvidence,
  EvidenceSource,
  EvidenceState,
  MatchMode,
} from './schemas/evidence.js';
export { clauseEvidenceSchema } from './schemas/evidence.js';
export type { Repair } from './schemas/repair.js';
export { repairSchema } from './schemas/repair.js';
export type { BillCheck } from './schemas/bill-check.js';
export { billCheckSchema } from './schemas/bill-check.js';
export type { LeaseReviewItem } from './schemas/lease-review.js';
export { leaseReviewItemSchema } from './schemas/lease-review.js';
export type { Workspace } from './schemas/workspace.js';
export { workspaceSchema } from './schemas/workspace.js';

export type { ErrorCode, ErrorResponse, HealthResponse } from './schemas/api.js';
export { ERROR_CODES, errorResponseSchema, healthResponseSchema } from './schemas/api.js';
export type { ClauseMatch, MatchRequest, MatchResponse, MatchWarning } from './schemas/match.js';
export { MATCH_WARNINGS, matchRequestSchema, matchResponseSchema } from './schemas/match.js';

export type { PrimaryResult, ReasonCode } from './rules/codes.js';
export { REASON_CODES } from './rules/codes.js';
export type { RentDays } from './rules/expected/rent.js';
export type { Buckets } from './rules/buckets.js';
export type { Totals } from './rules/totals.js';
export type { CheckInput, CheckResult, DeductionResult } from './rules/evaluate.js';
export { evaluate } from './rules/evaluate.js';
export type { BillCheckResult, BillReason } from './rules/check-bill.js';
export { checkBill } from './rules/check-bill.js';
export { sortRepairs } from './rules/repair-log.js';

export type { ReasonFacts } from './wording/index.js';
export {
  BUCKET_NAMES,
  BUCKET_ORDER,
  EVIDENCE_STATE_NAMES,
  KIND_NAMES,
  KIND_ORDER,
  PARTIAL_MONTH_NAMES,
  RESULT_NAMES,
  SOURCE_TAGS,
  formatDateText,
  formatMonthText,
  joinWithAnd,
  reasonSentence,
} from './wording/index.js';

export type { MessageInput } from './message/index.js';
export { buildMessage } from './message/index.js';
