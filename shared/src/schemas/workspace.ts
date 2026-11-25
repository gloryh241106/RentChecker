import { z } from 'zod';
import { MAX_DEDUCTIONS, MAX_LEASE_LENGTH, MAX_REPAIRS } from '../limits.js';
import { billCheckSchema } from './bill-check.js';
import { deductionSchema } from './deduction.js';
import { clauseEvidenceSchema } from './evidence.js';
import { addIssue, reportRepeats } from './issues.js';
import { leaseReviewItemSchema } from './lease-review.js';
import { repairSchema } from './repair.js';
import { tenancySchema } from './tenancy.js';

const leaseTextSchema = z.string().max(MAX_LEASE_LENGTH);

const workspaceFieldsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  tenancy: tenancySchema,
  leaseText: leaseTextSchema,
  deductions: z.array(deductionSchema).max(MAX_DEDUCTIONS),
  evidence: z.array(clauseEvidenceSchema),
  repairs: z.array(repairSchema).max(MAX_REPAIRS),
  bill: billCheckSchema.optional(),
  reviewLeaseText: leaseTextSchema,
  leaseReview: z.array(leaseReviewItemSchema),
  draftMessage: z.string().optional(),
  isSample: z.boolean(),
});

export type Workspace = z.infer<typeof workspaceFieldsSchema>;

function checkUnique(workspace: Workspace, ctx: z.RefinementCtx): void {
  const { deductions, repairs, evidence, leaseReview } = workspace;
  const deductionIds = deductions.map((deduction) => deduction.id);
  const repairIds = repairs.map((repair) => repair.id);
  const matchedIds = evidence.map((record) => record.deductionId);
  const topicIds = leaseReview.map((item) => item.topicId);
  reportRepeats(ctx, deductionIds, (index) => ['deductions', index, 'id'], 'DUPLICATE_ID');
  reportRepeats(ctx, repairIds, (index) => ['repairs', index, 'id'], 'DUPLICATE_ID');
  reportRepeats(ctx, matchedIds, (index) => ['evidence', index, 'deductionId'], 'DUPLICATE_MATCH');
  reportRepeats(ctx, topicIds, (index) => ['leaseReview', index, 'topicId'], 'DUPLICATE_MATCH');
}

/** Evidence and repairs may only point at a deduction in the same workspace. */
function checkReferences(workspace: Workspace, ctx: z.RefinementCtx): void {
  const known = new Set(workspace.deductions.map((deduction) => deduction.id));
  workspace.evidence.forEach(({ deductionId }, index) => {
    if (!known.has(deductionId)) {
      addIssue(ctx, ['evidence', index, 'deductionId'], 'UNKNOWN_DEDUCTION');
    }
  });
  workspace.repairs.forEach(({ deductionId }, index) => {
    if (deductionId !== undefined && !known.has(deductionId)) {
      addIssue(ctx, ['repairs', index, 'deductionId'], 'UNKNOWN_DEDUCTION');
    }
  });
}

/** DATA_MODEL.md. Used to read the stored workspace back. */
export const workspaceSchema = workspaceFieldsSchema.superRefine((workspace, ctx) => {
  checkUnique(workspace, ctx);
  checkReferences(workspace, ctx);
});
