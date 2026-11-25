import { MAX_QUOTE_LENGTH, MIN_QUOTE_LENGTH } from './limits.js';

/** F2-R4. The lease and the quote are normalised the same way before they are compared. */
export function normaliseText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/** F2-R4, F2-R8. For text that is already normalised. */
export function hasQuoteLength(normalised: string): boolean {
  return normalised.length >= MIN_QUOTE_LENGTH && normalised.length <= MAX_QUOTE_LENGTH;
}

/** F2-R4. Whether a quote may be shown as found in the lease. */
export function isQuoteInLease(quote: string, leaseText: string): boolean {
  const normalised = normaliseText(quote);
  return hasQuoteLength(normalised) && normaliseText(leaseText).includes(normalised);
}
