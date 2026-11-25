// POST /api/assistant/read in API.md.
import { z } from 'zod';
import {
  MAX_DOUBTS,
  MAX_FACTS,
  MAX_PROMPT_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  MIN_PROMPT_LENGTH,
} from '../limits.js';
import { matchModeSchema } from './evidence.js';
import { MATCH_WARNINGS } from './match.js';

export const ASSISTANT_TASKS = [
  'check_deductions',
  'ask_lease',
  'review_lease',
  'check_bill',
  'log_repair',
  'out_of_scope',
] as const;

export const FACT_KINDS = [
  'deposit',
  'monthly_rent',
  'handover_date',
  'start_date',
  'stated_refund',
  'deduction',
  'question',
] as const;

export const DOUBT_REASONS = ['amount', 'date', 'meaning'] as const;

const sourceSchema = z.string().trim().min(1).max(MAX_PROMPT_LENGTH);

export const assistantRequestSchema = z.strictObject({
  prompt: z.string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
});

/** F9-R2. A source is words of the prompt. Code reads the value from it (F9-R5). */
const factSchema = z.strictObject({
  kind: z.enum(FACT_KINDS),
  source: sourceSchema,
  label: z.string().trim().min(1).max(MAX_SHORT_TEXT_LENGTH).nullable(),
});

const doubtSchema = z.strictObject({ source: sourceSchema, reason: z.enum(DOUBT_REASONS) });

export const assistantResponseSchema = z.strictObject({
  mode: matchModeSchema,
  warnings: z.array(z.enum(MATCH_WARNINGS)),
  task: z.enum(ASSISTANT_TASKS),
  facts: z.array(factSchema).max(MAX_FACTS),
  doubts: z.array(doubtSchema).max(MAX_DOUBTS),
});

export type AssistantTask = (typeof ASSISTANT_TASKS)[number];
export type FactKind = (typeof FACT_KINDS)[number];
export type DoubtReason = (typeof DOUBT_REASONS)[number];
export type AssistantFact = z.infer<typeof factSchema>;
export type AssistantDoubt = z.infer<typeof doubtSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
/** What a prompt says, before the mode and warnings are added. */
export type PromptReading = Pick<AssistantResponse, 'task' | 'facts' | 'doubts'>;
