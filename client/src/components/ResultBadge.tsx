import { RESULT_NAMES } from '../shared.js';
import type { PrimaryResult } from '../shared.js';
import {
  CalculatorIcon,
  CheckCircleIcon,
  QuestionIcon,
  ReceiptIcon,
  SearchCrossIcon,
} from './ui/Icon.js';

/** UI.md: each result has its own icon and its text, so colour is never the only signal. */
const RESULT_LOOK: Readonly<
  Record<PrimaryResult, { readonly Icon: typeof CalculatorIcon; readonly classes: string }>
> = {
  recalculate: { Icon: CalculatorIcon, classes: 'border-danger bg-danger-bg text-danger' },
  unclear: { Icon: QuestionIcon, classes: 'border-warning bg-warning-bg text-warning' },
  not_found: { Icon: SearchCrossIcon, classes: 'border-danger bg-danger-bg text-danger' },
  needs_proof: { Icon: ReceiptIcon, classes: 'border-warning bg-warning-bg text-warning' },
  supported: { Icon: CheckCircleIcon, classes: 'border-success bg-success-bg text-success' },
};

export function ResultBadge({ result }: { readonly result: PrimaryResult }) {
  const { Icon, classes } = RESULT_LOOK[result];
  return (
    <p
      className={`inline-flex min-h-8 items-center gap-2 rounded-full border-2 px-3 py-0.5 font-semibold ${classes}`}
    >
      <Icon />
      <span>{RESULT_NAMES[result]}</span>
    </p>
  );
}
