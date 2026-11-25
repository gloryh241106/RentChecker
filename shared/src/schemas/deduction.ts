import { z } from 'zod';
import { isCurrentBelowPrevious } from '../readings.js';
import {
  amountSchema,
  idSchema,
  meterShape,
  positiveAmountSchema,
  shortTextSchema,
  yearMonthSchema,
} from './fields.js';
import { addIssue } from './issues.js';

const commonShape = { id: idSchema, label: shortTextSchema, amountPaise: positiveAmountSchema };

const rentSchema = z.strictObject({
  ...commonShape,
  kind: z.literal('rent'),
  rentMonth: yearMonthSchema,
  alreadyPaidPaise: amountSchema.default(0),
});

const meteredSchema = z
  .strictObject({ ...commonShape, kind: z.literal('metered'), ...meterShape })
  .superRefine((metered, ctx) => {
    // D-22
    if (isCurrentBelowPrevious(metered)) {
      addIssue(ctx, ['currentReading'], 'CURRENT_BELOW_PREVIOUS');
    }
  });

const fixedFeeSchema = z.strictObject({
  ...commonShape,
  kind: z.literal('fixed_fee'),
  leaseAmountPaise: amountSchema.optional(),
});

const costSchema = z.strictObject({
  ...commonShape,
  kind: z.literal('cost'),
  receiptAmountPaise: amountSchema.optional(),
});

/** D-10. A blank fact is an absent key, which D-34 and D-35 read as missing. */
export const deductionSchema = z.discriminatedUnion('kind', [
  rentSchema,
  meteredSchema,
  fixedFeeSchema,
  costSchema,
]);

export type Deduction = z.infer<typeof deductionSchema>;
export type DeductionKind = Deduction['kind'];
export type DeductionOf<Kind extends DeductionKind> = Extract<Deduction, { kind: Kind }>;
