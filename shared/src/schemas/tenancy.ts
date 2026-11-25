import { z } from 'zod';
import { isAfter } from '../dates.js';
import { amountSchema, dateSchema, positiveAmountSchema } from './fields.js';
import { addIssue } from './issues.js';

/** Every fact may be missing, so a half-filled form survives a reload. */
export const tenancySchema = z
  .strictObject({
    depositPaise: positiveAmountSchema.optional(),
    monthlyRentPaise: positiveAmountSchema.optional(),
    handoverDate: dateSchema.optional(),
    startDate: dateSchema.optional(),
    statedRefundPaise: amountSchema.optional(),
    partialMonth: z.enum(['unsure', 'per_day', 'full_month']).default('unsure'), // A-3
    handoverDayCounts: z.boolean().default(true), // A-4
  })
  .superRefine(({ startDate, handoverDate }, ctx) => {
    // D-5
    if (startDate !== undefined && handoverDate !== undefined && isAfter(startDate, handoverDate)) {
      addIssue(ctx, ['startDate'], 'START_AFTER_HANDOVER');
    }
  });

export type Tenancy = z.infer<typeof tenancySchema>;

/** F1-R3. A tenancy with the facts that a check needs. */
export type CheckableTenancy = Tenancy &
  Required<Pick<Tenancy, 'depositPaise' | 'monthlyRentPaise' | 'handoverDate'>>;

export function isCheckableTenancy(tenancy: Tenancy): tenancy is CheckableTenancy {
  return (
    tenancy.depositPaise !== undefined &&
    tenancy.monthlyRentPaise !== undefined &&
    tenancy.handoverDate !== undefined
  );
}
