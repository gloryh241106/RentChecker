import type { RequestHandler } from 'express';
import { assistantRequestSchema } from '../../../shared/src/index.js';
import { noteMatchOutcome } from '../logging/request-logger.js';
import type { AssistantService } from '../services/assistant-service.js';
import { toValidationError } from './validation-error.js';

export function createAssistantController(service: AssistantService): RequestHandler {
  return async (req, res) => {
    const parsed = assistantRequestSchema.safeParse(req.body);
    if (!parsed.success) throw toValidationError(parsed.error);

    const response = await service.read(parsed.data);
    noteMatchOutcome(res, response);
    res.json(response);
  };
}
