interface Accepted<Value> {
  readonly ok: true;
  readonly value: Value;
}

interface Rejected<ErrorCode extends string> {
  readonly ok: false;
  readonly error: ErrorCode;
}

/** The outcome of reading a form field. `error` is a code, so the wording stays in the client. */
export type ParseResult<Value, ErrorCode extends string> = Accepted<Value> | Rejected<ErrorCode>;

export function accepted<Value>(value: Value): Accepted<Value> {
  return { ok: true, value };
}

export function rejected<ErrorCode extends string>(error: ErrorCode): Rejected<ErrorCode> {
  return { ok: false, error };
}
