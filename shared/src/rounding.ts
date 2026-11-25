/** D-2. Works on the remainder, so no fractional number is ever created (D-1). */
export function divideRoundHalfUp(numerator: number, denominator: number): number {
  // A product past the safe range would be wrong without notice. D-4 and D-22 keep it unreachable.
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) {
    throw new RangeError('divideRoundHalfUp needs safe integers');
  }
  const remainder = numerator % denominator;
  const quotient = (numerator - remainder) / denominator;
  return remainder * 2 >= denominator ? quotient + 1 : quotient;
}
