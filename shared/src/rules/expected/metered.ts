import { divideRoundHalfUp } from '../../rounding.js';
import type { DeductionOf } from '../../schemas/deduction.js';

/** The fields a metered deduction and a bill check have in common, so both use this formula. */
export type MeterFacts = Pick<
  DeductionOf<'metered'>,
  'previousReading' | 'currentReading' | 'ratePaisePerUnit' | 'fixedChargePaise'
>;

/** D-22. Null when a reading or the rate is missing. */
export function calculateMetered(facts: MeterFacts): number | null {
  const { previousReading, currentReading, ratePaisePerUnit, fixedChargePaise } = facts;
  if (
    previousReading === undefined ||
    currentReading === undefined ||
    ratePaisePerUnit === undefined
  ) {
    return null;
  }
  // Readings are hundredths of a unit, hence the division by 100.
  const usage = divideRoundHalfUp((currentReading - previousReading) * ratePaisePerUnit, 100);
  return usage + fixedChargePaise;
}
