import type { RequestHandler } from 'express';
import { matchRequestSchema } from '../../../shared/src/index.js';
import { noteMatchOutcome } from '../logging/request-logger.js';
import type { ClauseService } from '../services/clause-service.js';
import { toValidationError } from './validation-error.js';

export function createMatchController(service: ClauseService): RequestHandler {
  return async (req, res) => {
    const parsed = matchRequestSchema.safeParse(req.body);
    if (!parsed.success) throw toValidationError(parsed.error);
    const response = await service.match(parsed.data);
    noteMatchOutcome(res, response);
    res.json(response);
  };
}
