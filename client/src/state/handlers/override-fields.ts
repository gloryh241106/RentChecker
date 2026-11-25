import { isQuoteInLease } from '../../shared.js';
import type { EvidenceOverride } from '../actions.js';

/** What an override stores, whoever owns the item. */
export type OverrideFields =
  | { readonly state: 'verified'; readonly quote: string; readonly source: 'user' }
  | { readonly state: 'none'; readonly quote: null; readonly source: 'user' };

/**
 * F2-R12, F2-R13. A pasted quote must be in the current lease, or nothing is stored. Removing an
 * override (`unconfirmed`) is the caller's business.
 */
export function overrideFields(
  override: EvidenceOverride,
  leaseText: string,
): OverrideFields | null {
  if (override.state === 'none') {
    return { state: 'none', quote: null, source: 'user' };
  }
  if (override.state === 'verified' && isQuoteInLease(override.quote, leaseText)) {
    return { state: 'verified', quote: override.quote.trim(), source: 'user' };
  }
  return null;
}
