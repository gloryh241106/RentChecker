import { formatRupees } from '../shared.js';
import type { Totals } from '../shared.js';

/** UI.md: the one sentence that sums up a check. */
export function AskAboutLine({ totals }: { readonly totals: Totals }) {
  return (
    <p>
      <strong className="block text-3xl leading-tight tabular-nums">
        Ask about {formatRupees(totals.askAboutPaise)}
      </strong>{' '}
      <span className="text-ink-muted">of {formatRupees(totals.totalDeductedPaise)} deducted</span>
    </p>
  );
}
