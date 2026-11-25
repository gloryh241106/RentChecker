import { parseHundredths } from './hundredths.js';
import type { NumberInputError } from './hundredths.js';
import { MAX_READING_HUNDREDTHS } from './limits.js';
import { rejected } from './parse-result.js';
import type { ParseResult } from './parse-result.js';

/** D-22. A meter reading as typed, returned in hundredths of a unit. */
export function parseReading(input: string): ParseResult<number, NumberInputError> {
  const text = input.trim();
  return text === '' ? rejected('EMPTY') : parseHundredths(text, MAX_READING_HUNDREDTHS);
}

interface MeterReadings {
  readonly previousReading?: number | undefined;
  readonly currentReading?: number | undefined;
}

/** D-22. A missing reading is not an error here, because D-34 handles it. */
export function isCurrentBelowPrevious(readings: MeterReadings): boolean {
  const { previousReading, currentReading } = readings;
  return (
    previousReading !== undefined &&
    currentReading !== undefined &&
    currentReading < previousReading
  );
}
