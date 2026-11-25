// Field schemas used by more than one entity in DATA_MODEL.md.
import { z } from 'zod';
import { isCalendarDate, isYearMonth } from '../dates.js';
import {
  MAX_AMOUNT_PAISE,
  MAX_RATE_PAISE_PER_UNIT,
  MAX_READING_HUNDREDTHS,
  MAX_SHORT_TEXT_LENGTH,
} from '../limits.js';
import type { SchemaIssue } from './issues.js';

const INVALID_DATE: SchemaIssue = 'INVALID_DATE';
const INVALID_MONTH: SchemaIssue = 'INVALID_MONTH';

export const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

export const shortTextSchema = z.string().trim().min(1).max(MAX_SHORT_TEXT_LENGTH);

/** D-5. */
export const dateSchema = z.string().refine(isCalendarDate, INVALID_DATE);

export const yearMonthSchema = z.string().refine(isYearMonth, INVALID_MONTH);

/** D-1, D-4. */
export const amountSchema = z.int().min(0).max(MAX_AMOUNT_PAISE);
export const positiveAmountSchema = z.int().min(1).max(MAX_AMOUNT_PAISE);

/** D-22. Hundredths of a unit. */
export const readingSchema = z.int().min(0).max(MAX_READING_HUNDREDTHS);
export const rateSchema = z.int().min(0).max(MAX_RATE_PAISE_PER_UNIT);

/** The D-22 facts, which a metered deduction and the bill check share. */
export const meterShape = {
  previousReading: readingSchema.optional(),
  currentReading: readingSchema.optional(),
  ratePaisePerUnit: rateSchema.optional(),
  fixedChargePaise: amountSchema.default(0),
};
