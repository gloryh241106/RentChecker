import { randomUUID } from 'node:crypto';
import type { AiConfig } from '../config.js';
import { ASSISTANT_INSTRUCTION, promptPart } from './assistant-prompt.js';
import { READING_JSON_SCHEMA, readingSchema } from './assistant-reading.js';
import { createGeminiCall } from './gemini-call.js';
import type { PromptReader } from './prompt-reader.js';

export function createGeminiPromptReader(config: AiConfig, fetchFn: typeof fetch): PromptReader {
  const call = createGeminiCall(config, fetchFn);
  return {
    readPrompt: ({ prompt, signal }) =>
      call({
        systemInstruction: ASSISTANT_INSTRUCTION,
        parts: [promptPart(prompt, randomUUID())],
        replyJsonSchema: READING_JSON_SCHEMA,
        replySchema: readingSchema,
        signal,
      }),
  };
}
