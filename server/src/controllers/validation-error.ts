import type { z } from 'zod';
import { AppError } from '../errors.js';

type Issue = z.core.$ZodIssue;
type SizeIssue = Extract<Issue, { code: 'too_small' | 'too_big' }>;

const RULE_TEXT: Readonly<Record<Exclude<Issue['code'], SizeIssue['code']>, string>> = {
  invalid_type: 'is missing or has the wrong type',
  unrecognized_keys: 'has an unknown field',
  invalid_format: 'has the wrong format',
  invalid_value: 'is not valid',
  invalid_union: 'is not valid',
  invalid_key: 'is not valid',
  invalid_element: 'is not valid',
  not_multiple_of: 'is not valid',
  custom: 'is not valid',
};

// Built from the rule that failed. Zod's own message is never used, because it can repeat input.
function ruleText(issue: Issue): string {
  if (issue.code !== 'too_small' && issue.code !== 'too_big') return RULE_TEXT[issue.code];
  const unit = issue.origin === 'string' ? 'characters' : 'entries';
  return issue.code === 'too_small'
    ? `must have at least ${String(issue.minimum)} ${unit}`
    : `must have at most ${String(issue.maximum)} ${unit}`;
}

/**
 * Paths hold only field names of the schema and list positions. An unknown field is reported at
 * the object that holds it, because its name is input and could hold lease text (NFR-2, T-146).
 */
export function toValidationError(error: z.ZodError): AppError {
  const paths = error.issues.map((issue) => issue.path.map(String).join('.'));
  const [first] = error.issues;
  const subject = paths[0] || 'The request body';
  const message = first ? `${subject} ${ruleText(first)}` : 'The request body is not valid';
  const fields = [...new Set(paths)].filter((path) => path !== '');
  return new AppError('VALIDATION_ERROR', message, fields);
}
