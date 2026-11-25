import type { ErrorCode, ErrorResponse } from '../../shared/src/index.js';

// Statuses come from API.md. A new error code adds one entry here.
export const ERROR_STATUS: Readonly<Record<ErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CASE_NOT_FOUND: 404,
  REVISION_CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  STORAGE_UNAVAILABLE: 503,
};

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: readonly string[],
  ) {
    super(message);
    this.name = 'AppError';
    this.status = ERROR_STATUS[code];
  }

  toBody(): ErrorResponse {
    const { code, message, fields } = this;
    return { error: fields ? { code, message, fields: [...fields] } : { code, message } };
  }
}
