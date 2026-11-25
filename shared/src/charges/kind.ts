import type { DeductionKind } from '../schemas/deduction.js';

/** F8-R5, in the order they are tried. */
const KIND_WORDS: readonly (readonly [DeductionKind, RegExp])[] = [
  ['rent', /\brent\b/i],
  ['metered', /\b(?:electricity|electric|power|water|gas|meter|units)\b/i],
  ['fixed_fee', /\b(?:fees?|fine|penalty|service|maintenance|society|late)\b/i],
];

export function guessKind(label: string): DeductionKind {
  return KIND_WORDS.find(([, words]) => words.test(label))?.[0] ?? 'cost';
}

/** F8-R4. Sums and payments, which are not charges. */
export function isSummary(text: string): boolean {
  return /\b(?:total|balance|refund(?:ed|able)?|net|deposit|advance|paid|received)\b/i.test(text);
}
