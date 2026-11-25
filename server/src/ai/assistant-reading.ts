import { z } from 'zod';
import {
  ASSISTANT_TASKS,
  DOUBT_REASONS,
  FACT_KINDS,
  MAX_DOUBTS,
  MAX_FACTS,
  MAX_PROMPT_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
} from '../../../shared/src/index.js';

const sourceSchema = z.string().trim().min(1).max(MAX_PROMPT_LENGTH);

// A label is optional help, so one that cannot be used becomes null and the fact stays (F9-R3).
const labelSchema = z.string().trim().min(1).max(MAX_SHORT_TEXT_LENGTH).nullable().catch(null);

// The task and each item are strict: a reply that does not parse is a failure (BACKEND.md).
export const readingSchema = z.object({
  task: z.enum(ASSISTANT_TASKS),
  facts: z
    .array(z.object({ kind: z.enum(FACT_KINDS), source: sourceSchema, label: labelSchema }))
    .transform((facts) => facts.slice(0, MAX_FACTS)),
  doubts: z
    .array(z.object({ source: sourceSchema, reason: z.enum(DOUBT_REASONS) }))
    .transform((doubts) => doubts.slice(0, MAX_DOUBTS)),
});

const text = { type: 'string' };

/** The same shape for the model. It has no field for an amount or a date (F9-R2). */
export const READING_JSON_SCHEMA = {
  type: 'object',
  properties: {
    task: { type: 'string', enum: [...ASSISTANT_TASKS] },
    facts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { kind: { type: 'string', enum: [...FACT_KINDS] }, source: text, label: text },
        required: ['kind', 'source', 'label'],
        additionalProperties: false,
      },
    },
    doubts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { source: text, reason: { type: 'string', enum: [...DOUBT_REASONS] } },
        required: ['source', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['task', 'facts', 'doubts'],
  additionalProperties: false,
};
