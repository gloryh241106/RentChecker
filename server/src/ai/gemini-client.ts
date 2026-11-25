import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { AiConfig } from '../config.js';
import { AI_REPLY_JSON_SCHEMA, aiReplySchema } from './answers.js';
import { AiClientError } from './clause-matcher.js';
import type { AiAnswer, ClauseMatcher, ClauseQuestion } from './clause-matcher.js';
import { SYSTEM_INSTRUCTION, itemsPart, leasePart } from './prompt.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const partSchema = z.object({ text: z.string().default(''), thought: z.boolean().default(false) });

// A blocked prompt has no candidate. A candidate that stopped early holds half an answer.
const envelopeSchema = z.object({
  candidates: z
    .tuple([
      z.object({
        content: z.object({ parts: z.array(partSchema) }),
        finishReason: z.literal('STOP').optional(),
      }),
    ])
    .rest(z.unknown()),
});

function requestBody({ leaseText, items }: ClauseQuestion) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: 'user',
        parts: [{ text: leasePart(leaseText, randomUUID()) }, { text: itemsPart(items) }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: AI_REPLY_JSON_SCHEMA,
    },
  };
}

function parseReply(reply: string): AiAnswer[] {
  try {
    const { candidates } = envelopeSchema.parse(JSON.parse(reply));
    const answerText = candidates[0].content.parts
      .filter((part) => !part.thought)
      .map((part) => part.text)
      .join('');
    return aiReplySchema.parse(JSON.parse(answerText)).answers;
  } catch {
    // The cause is dropped because it can repeat the reply (NFR-2).
    throw new AiClientError('INVALID_REPLY');
  }
}

export function createGeminiMatcher(config: AiConfig, fetchFn: typeof fetch): ClauseMatcher {
  const url = `${BASE_URL}/${encodeURIComponent(config.model)}:generateContent`;

  async function send(question: ClauseQuestion): Promise<string> {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify(requestBody(question)),
      // Following a redirect would send the key header to another host (NFR-1).
      redirect: 'error',
      signal: question.signal,
    });
    if (!response.ok) throw new AiClientError('HTTP_STATUS', response.status);
    return response.text();
  }

  return {
    async findClauses(question) {
      const reply = await send(question).catch((error: unknown) => {
        throw error instanceof AiClientError ? error : new AiClientError('REQUEST_FAILED');
      });
      return parseReply(reply);
    },
  };
}
