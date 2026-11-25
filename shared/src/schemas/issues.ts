import type { z } from 'zod';

/** Codes used as the Zod issue message for rules that Zod has no code of its own for. */
export type SchemaIssue =
  | 'CURRENT_BELOW_PREVIOUS'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_MATCH'
  | 'INVALID_DATE'
  | 'INVALID_MONTH'
  | 'MODE_MISMATCH'
  | 'START_AFTER_HANDOVER'
  | 'UNKNOWN_DEDUCTION';

export function addIssue(ctx: z.RefinementCtx, path: PropertyKey[], message: SchemaIssue): void {
  ctx.addIssue({ code: 'custom', path, message });
}

/** Reports every value that already appeared earlier in the list. */
export function reportRepeats(
  ctx: z.RefinementCtx,
  values: readonly string[],
  pathOf: (index: number) => PropertyKey[],
  message: SchemaIssue,
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      addIssue(ctx, pathOf(index), message);
    }
    seen.add(value);
  });
}
