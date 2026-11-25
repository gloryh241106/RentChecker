// The health route and the error body of API.md.
import { z } from 'zod';

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'CASE_NOT_FOUND',
  'REVISION_CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'STORAGE_UNAVAILABLE',
] as const;

export const healthResponseSchema = z.strictObject({
  status: z.literal('ok'),
  aiConfigured: z.boolean(),
  cloudSaveConfigured: z.boolean(),
});

export const errorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    /** Paths such as `items.0.label`, sent with VALIDATION_ERROR. */
    fields: z.array(z.string()).optional(),
    /** Sent with REVISION_CONFLICT. */
    currentRevision: z.int().min(1).optional(),
  }),
});

export type ErrorCode = (typeof ERROR_CODES)[number];
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
