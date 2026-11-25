import type { Problem } from '../components/ui/ErrorSummary.js';
import { fieldErrorText } from './field-errors.js';
import type { FieldErrorCode } from './field-errors.js';

interface FieldSpec {
  readonly label: string;
  readonly noun: string;
}

export interface Problems<Field extends string> {
  /** Every problem, in field order, shown or not. */
  readonly all: readonly Problem[];
  /** The message of a field, only once it may be shown. */
  readonly messageOf: (field: Field) => string | undefined;
}

/** Turns error codes into the summary entries and the messages under the fields. */
export function collectProblems<Field extends string>(
  fields: readonly Field[],
  errors: Readonly<Partial<Record<Field, FieldErrorCode>>>,
  specs: Readonly<Record<Field, FieldSpec>>,
  rules: { readonly idOf: (field: Field) => string; readonly isShown: (field: Field) => boolean },
): Problems<Field> {
  const entries = fields.flatMap((field) => {
    const code = errors[field];
    const { label, noun } = specs[field];
    return code === undefined
      ? []
      : [
          {
            field,
            problem: { fieldId: rules.idOf(field), label, message: fieldErrorText(code, noun) },
          },
        ];
  });
  return {
    all: entries.map(({ problem }) => problem),
    messageOf: (field) =>
      entries.find((entry) => entry.field === field && rules.isShown(field))?.problem.message,
  };
}
