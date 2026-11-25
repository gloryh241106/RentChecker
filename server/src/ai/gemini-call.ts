import { z } from 'zod';
import type { AiConfig } from '../config.js';
import { AiClientError } from './clause-matcher.js';

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

export interface GeminiQuestion<Reply> {
  /** Never holds text of a user (F2-R15, F9-R13). */
  systemInstruction: string;
  /** Untrusted text, one content part each. */
  parts: readonly string[];
  replyJsonSchema: object;
  replySchema: z.ZodType<Reply>;
  signal: AbortSignal;
}

export type GeminiCall = <Reply>(question: GeminiQuestion<Reply>) => Promise<Reply>;

function requestBody({ systemInstruction, parts, replyJsonSchema }: GeminiQuestion<unknown>) {
  return {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: parts.map((text) => ({ text })) }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: replyJsonSchema,
    },
  };
}

function parseReply<Reply>(reply: string, replySchema: z.ZodType<Reply>): Reply {
  try {
    const { candidates } = envelopeSchema.parse(JSON.parse(reply));
    const answerText = candidates[0].content.parts
      .filter((part) => !part.thought)
      .map((part) => part.text)
      .join('');
    return replySchema.parse(JSON.parse(answerText));
  } catch {
    // The cause is dropped because it can repeat the reply (NFR-2).
    throw new AiClientError('INVALID_REPLY');
  }
}

/** One request to Gemini. Every failure is an AiClientError, which carries a code only. */
export function createGeminiCall(config: AiConfig, fetchFn: typeof fetch): GeminiCall {
  const url = `${BASE_URL}/${encodeURIComponent(config.model)}:generateContent`;

  async function send(question: GeminiQuestion<unknown>): Promise<string> {
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

  return async (question) => {
    const reply = await send(question).catch((error: unknown) => {
      throw error instanceof AiClientError ? error : new AiClientError('REQUEST_FAILED');
    });
    return parseReply(reply, question.replySchema);
  };
}
