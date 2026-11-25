/** FRONTEND.md API client. One kind per way a call can fail, so the UI handles each. */
export type ApiError =
  | { readonly kind: 'validation'; readonly fields: readonly string[] }
  | { readonly kind: 'too_large' }
  | { readonly kind: 'rate_limited' }
  | { readonly kind: 'server' }
  | { readonly kind: 'unauthorized' }
  | { readonly kind: 'case_not_found' }
  | { readonly kind: 'conflict' }
  | { readonly kind: 'storage_unavailable' }
  | { readonly kind: 'network' }
  | { readonly kind: 'aborted' }
  | { readonly kind: 'bad_response' };

export type ApiErrorKind = ApiError['kind'];

export type ApiResult<Value> =
  { readonly ok: true; readonly value: Value } | { readonly ok: false; readonly error: ApiError };

export function failure(error: ApiError): { readonly ok: false; readonly error: ApiError } {
  return { ok: false, error };
}
