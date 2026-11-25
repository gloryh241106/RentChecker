import { z } from 'zod';

// The list and each item ID are strict: a reply that does not parse is a failure, not a partial
// result (BACKEND.md). The other two values are lenient because a rule names their outcome: any
// other answer value leaves only that item unconfirmed (F2-R6, T-123), and an answer without a
// usable quote is a rejected quote (F2-R5). Extra fields are dropped.
export const aiReplySchema = z.object({
  answers: z.array(
    z.object({
      itemId: z.string(),
      answer: z.enum(['covers', 'excludes', 'none', 'unrecognised']).catch('unrecognised'),
      quote: z.string().nullable().catch(null),
    }),
  ),
});

/** The same shape for the model, which is offered only the three answers of F2-R5. */
export const AI_REPLY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          itemId: { type: 'string' },
          answer: { type: 'string', enum: ['covers', 'excludes', 'none'] },
          quote: { type: 'string' },
        },
        required: ['itemId', 'answer', 'quote'],
        additionalProperties: false,
      },
    },
  },
  required: ['answers'],
  additionalProperties: false,
};
