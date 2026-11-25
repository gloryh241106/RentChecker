import type { ApiResult } from '../api/api-error.js';
import type { AssistantApi } from '../api/assistant-api.js';
import { readPromptByCode } from '../shared.js';
import type { AssistantRequest, AssistantResponse, PromptReading } from '../shared.js';

type Answer = ApiResult<AssistantResponse> | Promise<ApiResult<AssistantResponse>>;

/** An AssistantApi for tests. It reads a prompt by code unless the test says what the AI read. */
export class FakeAssistantApi implements AssistantApi {
  readonly prompts: string[] = [];
  answer: (request: AssistantRequest) => Answer = ({ prompt }) => ({
    ok: true,
    value: { mode: 'ai', warnings: [], ...readPromptByCode(prompt) },
  });

  reads(reading: Partial<PromptReading>): void {
    const empty: PromptReading = { task: 'check_deductions', facts: [], doubts: [] };
    this.answer = () => ({
      ok: true,
      value: { mode: 'ai', warnings: [], ...empty, ...reading },
    });
  }

  readPrompt(request: AssistantRequest): Promise<ApiResult<AssistantResponse>> {
    this.prompts.push(request.prompt);
    return Promise.resolve(this.answer(request));
  }
}
