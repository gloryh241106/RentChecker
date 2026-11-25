import { z } from 'zod';
import { isCurrentBelowPrevious } from '../readings.js';
import { meterShape, positiveAmountSchema } from './fields.js';
import { addIssue } from './issues.js';

/** The F5 form. Every field may be blank in storage. */
export const billCheckSchema = z
  .strictObject({ ...meterShape, billedTotalPaise: positiveAmountSchema.optional() })
  .superRefine((bill, ctx) => {
    // D-22
    if (isCurrentBelowPrevious(bill)) {
      addIssue(ctx, ['currentReading'], 'CURRENT_BELOW_PREVIOUS');
    }
  });

export type BillCheck = z.infer<typeof billCheckSchema>;
