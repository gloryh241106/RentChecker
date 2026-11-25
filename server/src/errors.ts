// Statuses come from API.md. A new error code adds one entry here.
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export interface ErrorBody {
  error: { code: ErrorCode; message: string; fields?: readonly string[] };
}

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

  toBody(): ErrorBody {
    const { code, message, fields } = this;
    return { error: fields ? { code, message, fields } : { code, message } };
  }
}
