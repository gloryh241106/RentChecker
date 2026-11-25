// POST /api/clauses/match in API.md.
import { z } from 'zod';
import { MAX_LEASE_LENGTH, MAX_MATCH_ITEMS, MIN_MATCH_LEASE_LENGTH } from '../limits.js';
import { matchModeSchema, quotedShape, unquotedShape } from './evidence.js';
import type { EvidenceState } from './evidence.js';
import { idSchema, shortTextSchema } from './fields.js';
import { addIssue, reportRepeats } from './issues.js';

export const MATCH_WARNINGS = [
  'AI_NOT_CONFIGURED',
  'AI_UNAVAILABLE',
  'AI_TIMEOUT',
  'QUOTE_REJECTED',
] as const;

export const matchRequestSchema = z
  .strictObject({
    leaseText: z.string().trim().min(MIN_MATCH_LEASE_LENGTH).max(MAX_LEASE_LENGTH),
    items: z
      .array(z.strictObject({ id: idSchema, label: shortTextSchema }))
      .min(1)
      .max(MAX_MATCH_ITEMS),
  })
  .superRefine(({ items }, ctx) => {
    const ids = items.map((item) => item.id);
    reportRepeats(ctx, ids, (index) => ['items', index, 'id'], 'DUPLICATE_ID');
  });

const ownerShape = { itemId: idSchema, source: matchModeSchema };

const clauseMatchSchema = z.discriminatedUnion('state', [
  z.strictObject({ ...ownerShape, ...quotedShape }),
  z.strictObject({ ...ownerShape, ...unquotedShape }),
]);

// F2-R7
const KEYWORD_STATES: ReadonlySet<EvidenceState> = new Set<EvidenceState>([
  'verified',
  'unconfirmed',
]);

export const matchResponseSchema = z
  .strictObject({
    mode: matchModeSchema,
    warnings: z.array(z.enum(MATCH_WARNINGS)),
    matches: z.array(clauseMatchSchema).min(1).max(MAX_MATCH_ITEMS),
  })
  .superRefine(({ mode, matches }, ctx) => {
    const ids = matches.map((match) => match.itemId);
    reportRepeats(ctx, ids, (index) => ['matches', index, 'itemId'], 'DUPLICATE_ID');
    matches.forEach(({ source, state }, index) => {
      if (source !== mode) {
        addIssue(ctx, ['matches', index, 'source'], 'MODE_MISMATCH');
      }
      if (mode === 'keyword' && !KEYWORD_STATES.has(state)) {
        addIssue(ctx, ['matches', index, 'state'], 'MODE_MISMATCH');
      }
    });
  });

export type MatchWarning = (typeof MATCH_WARNINGS)[number];
export type MatchRequest = z.infer<typeof matchRequestSchema>;
export type ClauseMatch = z.infer<typeof clauseMatchSchema>;
export type MatchResponse = z.infer<typeof matchResponseSchema>;
