import { z } from 'zod';
import { evidenceSourceSchema, quotedShape, unquotedShape } from './evidence.js';
import { idSchema } from './fields.js';

// F4 names the ten topics but gives them no ids, so only the id format is checked.
const ownerShape = { topicId: idSchema, source: evidenceSourceSchema };

export const leaseReviewItemSchema = z.discriminatedUnion('state', [
  z.strictObject({ ...ownerShape, ...quotedShape }),
  z.strictObject({ ...ownerShape, ...unquotedShape }),
]);

export type LeaseReviewItem = z.infer<typeof leaseReviewItemSchema>;
