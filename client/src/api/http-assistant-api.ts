import { assistantResponseSchema } from '../shared.js';
import type { AssistantApi } from './assistant-api.js';
import { createHttpCall, jsonPost } from './http-call.js';
import type { HttpOptions } from './http-call.js';

/** The real API of F9. */
export function createHttpAssistantApi(options: HttpOptions = {}): AssistantApi {
  const call = createHttpCall(options);
  return {
    readPrompt: (request, signal) =>
      call(assistantResponseSchema, '/api/assistant/read', jsonPost(request), signal),
  };
}
