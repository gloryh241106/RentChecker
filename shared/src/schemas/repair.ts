import { z } from 'zod';
import { dateSchema, idSchema, shortTextSchema } from './fields.js';

export const repairSchema = z.strictObject({
  id: idSchema,
  date: dateSchema,
  description: shortTextSchema,
  reportedTo: shortTextSchema,
  deductionId: idSchema.optional(),
});

export type Repair = z.infer<typeof repairSchema>;
