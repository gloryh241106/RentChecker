import type { AssistantRequest, AssistantResponse } from '../shared.js';
import type { ApiResult } from './api-error.js';

/** What the client needs from the server for F9. A test passes a fake. */
export interface AssistantApi {
  /** POST /api/assistant/read. One request, no retry (F9-R8). */
  readPrompt(request: AssistantRequest, signal: AbortSignal): Promise<ApiResult<AssistantResponse>>;
}
