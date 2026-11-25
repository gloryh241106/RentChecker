import { z } from 'zod';
import { idSchema } from './fields.js';

// D-30. The states are split by whether a quote was found, because that decides `quote`.
const quotedStateSchema = z.enum(['verified', 'excludes']);
const unquotedStateSchema = z.enum(['none', 'unconfirmed']);

export type EvidenceState = z.infer<typeof quotedStateSchema> | z.infer<typeof unquotedStateSchema>;

/** The two halves of a union on `state`, so a quote exists only where one was found. */
export const quotedShape = { state: quotedStateSchema, quote: z.string().trim().min(1) };
export const unquotedShape = { state: unquotedStateSchema, quote: z.null() };

/** API.md. The only sources the server may return. */
export const matchModeSchema = z.enum(['ai', 'keyword']);

/** `user` and `sample` exist only in the browser. */
export const evidenceSourceSchema = z.enum([...matchModeSchema.options, 'user', 'sample']);

const ownerShape = { deductionId: idSchema, source: evidenceSourceSchema };

export const clauseEvidenceSchema = z.discriminatedUnion('state', [
  z.strictObject({ ...ownerShape, ...quotedShape }),
  z.strictObject({ ...ownerShape, ...unquotedShape }),
]);

export type MatchMode = z.infer<typeof matchModeSchema>;
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;
export type ClauseEvidence = z.infer<typeof clauseEvidenceSchema>;
