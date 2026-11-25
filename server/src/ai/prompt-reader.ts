import type { PromptReading } from '../../../shared/src/index.js';

export interface PromptQuestion {
  prompt: string;
  signal: AbortSignal;
}

/** Readings are validated in shape only. Sources are checked by the caller (F9-R3). */
export interface PromptReader {
  readPrompt(question: PromptQuestion): Promise<PromptReading>;
}
