import { randomUUID } from 'node:crypto';
import type { AiConfig } from '../config.js';
import { AI_REPLY_JSON_SCHEMA, aiReplySchema } from './answers.js';
import type { ClauseMatcher } from './clause-matcher.js';
import { createGeminiCall } from './gemini-call.js';
import { SYSTEM_INSTRUCTION, itemsPart, leasePart } from './prompt.js';

export function createGeminiMatcher(config: AiConfig, fetchFn: typeof fetch): ClauseMatcher {
  const call = createGeminiCall(config, fetchFn);
  return {
    async findClauses({ leaseText, items, signal }) {
      const reply = await call({
        systemInstruction: SYSTEM_INSTRUCTION,
        parts: [leasePart(leaseText, randomUUID()), itemsPart(items)],
        replyJsonSchema: AI_REPLY_JSON_SCHEMA,
        replySchema: aiReplySchema,
        signal,
      });
      return reply.answers;
    },
  };
}
