import { isInPrompt, readPromptByCode } from '../../../shared/src/index.js';
import type {
  AssistantRequest,
  AssistantResponse,
  MatchWarning,
  PromptReading,
} from '../../../shared/src/index.js';
import type { PromptReader } from '../ai/prompt-reader.js';
import type { Logger } from '../logging/logger.js';
import { askAi } from './ask-ai.js';

export interface AssistantService {
  read(request: AssistantRequest): Promise<AssistantResponse>;
}

export interface AssistantServiceOptions {
  /** Absent when AI is not configured. */
  promptReader?: PromptReader | undefined;
  logger: Logger;
}

/** F9-R3. Only words of the prompt are kept. */
function keepProven(prompt: string, reading: PromptReading): AssistantResponse {
  const isProven = ({ source }: { source: string }): boolean => isInPrompt(source, prompt);
  const facts = reading.facts.filter(isProven).map(({ kind, source, label }) => ({
    kind,
    source,
    label: label !== null && isInPrompt(label, prompt) ? label : null,
  }));
  const doubts = reading.doubts.filter(isProven);
  const isDropped = facts.length < reading.facts.length || doubts.length < reading.doubts.length;
  return {
    mode: 'ai',
    warnings: isDropped ? ['QUOTE_REJECTED'] : [],
    task: reading.task,
    facts,
    doubts,
  };
}

// F9-R4
const byCode = (prompt: string, warning: MatchWarning): AssistantResponse => ({
  mode: 'keyword',
  warnings: [warning],
  ...readPromptByCode(prompt),
});

export function createAssistantService(options: AssistantServiceOptions): AssistantService {
  const { promptReader, logger } = options;
  return {
    async read({ prompt }) {
      if (!promptReader) return byCode(prompt, 'AI_NOT_CONFIGURED');
      const outcome = await askAi(logger, (signal) => promptReader.readPrompt({ prompt, signal }));
      return outcome.ok ? keepProven(prompt, outcome.reply) : byCode(prompt, outcome.warning);
    },
  };
}
